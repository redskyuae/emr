#!/usr/bin/env python3
"""Read the TreatmentDetails worksheet from an XLSX as untrusted raw data."""

from __future__ import annotations

import json
import posixpath
import re
import sys
import zipfile
from pathlib import Path, PurePosixPath
from xml.etree import ElementTree


SHEET_NAME = "TreatmentDetails"
REQUIRED_HEADERS = (
    "Treatment",
    "TotalSession",
    "MRN",
    "VisitID",
    "VisitNumber",
    "TreatmentStatus",
    "SessionNumber",
    "ConductionNote",
    "SessionStatus",
)

MAX_ARCHIVE_ENTRIES = 1000
MAX_ENTRY_BYTES = 64 * 1024 * 1024
MAX_TOTAL_UNCOMPRESSED_BYTES = 256 * 1024 * 1024
MAX_COMPRESSION_RATIO = 250
MAX_CELL_CHARACTERS = 32_767
MAX_WORKSHEET_CELLS = 1_000_000
MAX_EXCEL_COLUMN = 16_384

RELATIONSHIPS_NAMESPACE = "http://schemas.openxmlformats.org/package/2006/relationships"
OFFICE_RELATIONSHIPS_NAMESPACE = (
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
)
CELL_REFERENCE_PATTERN = re.compile(r"^([A-Z]{1,3})([1-9][0-9]*)$")


class WorkbookRejected(Exception):
    """Raised when the workbook cannot be processed safely."""


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def parse_xml(content: bytes, entry_name: str) -> ElementTree.Element:
    lowered = content.lower()
    if b"<!doctype" in lowered or b"<!entity" in lowered:
        raise WorkbookRejected(f"XML declarations are not allowed in {entry_name}")
    try:
        return ElementTree.fromstring(content)
    except ElementTree.ParseError as error:
        raise WorkbookRejected(f"Malformed XML in {entry_name}") from error


def validate_archive(archive: zipfile.ZipFile) -> None:
    entries = archive.infolist()
    if len(entries) > MAX_ARCHIVE_ENTRIES:
        raise WorkbookRejected("Archive contains too many entries")

    total_uncompressed = 0
    for entry in entries:
        path = PurePosixPath(entry.filename)
        if path.is_absolute() or ".." in path.parts:
            raise WorkbookRejected("Archive contains an unsafe entry path")
        if entry.flag_bits & 0x1:
            raise WorkbookRejected("Encrypted workbooks are not allowed")
        if entry.file_size > MAX_ENTRY_BYTES:
            raise WorkbookRejected("Archive entry exceeds the size limit")
        total_uncompressed += entry.file_size
        if total_uncompressed > MAX_TOTAL_UNCOMPRESSED_BYTES:
            raise WorkbookRejected("Archive exceeds the uncompressed size limit")
        if (
            entry.file_size > 1024 * 1024
            and entry.compress_size > 0
            and entry.file_size / entry.compress_size > MAX_COMPRESSION_RATIO
        ):
            raise WorkbookRejected("Archive entry exceeds the compression ratio limit")

    lowered_names = {entry.filename.lower() for entry in entries}
    if any(name.startswith("xl/externallinks/") for name in lowered_names):
        raise WorkbookRejected("External links are not allowed")
    if any(name.endswith("vbaproject.bin") for name in lowered_names):
        raise WorkbookRejected("Macro-enabled workbooks are not allowed")


def read_entry(archive: zipfile.ZipFile, name: str) -> bytes:
    try:
        return archive.read(name)
    except KeyError as error:
        raise WorkbookRejected(f"Required workbook entry {name} is missing") from error
    except RuntimeError as error:
        raise WorkbookRejected("Encrypted workbooks are not allowed") from error


def resolve_relationship_target(source_name: str, target: str) -> str:
    if not target or "\\" in target:
        raise WorkbookRejected("Workbook relationship has an unsafe target")
    if target.startswith("/"):
        resolved = posixpath.normpath(target.lstrip("/"))
    else:
        resolved = posixpath.normpath(posixpath.join(posixpath.dirname(source_name), target))
    path = PurePosixPath(resolved)
    if path.is_absolute() or ".." in path.parts or not resolved.startswith("xl/"):
        raise WorkbookRejected("Workbook relationship has an unsafe target")
    return resolved


def read_relationships(
    archive: zipfile.ZipFile, source_name: str, relationships_name: str
) -> dict[str, tuple[str, str]]:
    root = parse_xml(read_entry(archive, relationships_name), relationships_name)
    relationships: dict[str, tuple[str, str]] = {}
    for relationship in root.findall(f"{{{RELATIONSHIPS_NAMESPACE}}}Relationship"):
        relationship_id = relationship.attrib.get("Id")
        relationship_type = relationship.attrib.get("Type")
        target = relationship.attrib.get("Target")
        if relationship.attrib.get("TargetMode", "").lower() == "external":
            raise WorkbookRejected("External relationships are not allowed")
        if not relationship_id or not relationship_type or not target:
            raise WorkbookRejected("Workbook contains a malformed relationship")
        if relationship_id in relationships:
            raise WorkbookRejected("Workbook contains duplicate relationship identifiers")
        relationships[relationship_id] = (
            relationship_type,
            resolve_relationship_target(source_name, target),
        )
    return relationships


def reject_external_relationships(archive: zipfile.ZipFile) -> None:
    for entry in archive.infolist():
        if not entry.filename.lower().endswith(".rels"):
            continue
        root = parse_xml(read_entry(archive, entry.filename), entry.filename)
        for relationship in root.findall(f"{{{RELATIONSHIPS_NAMESPACE}}}Relationship"):
            if relationship.attrib.get("TargetMode", "").lower() == "external":
                raise WorkbookRejected("External relationships are not allowed")


def find_sheet_and_shared_strings(archive: zipfile.ZipFile) -> tuple[str, str | None]:
    workbook_name = "xl/workbook.xml"
    workbook = parse_xml(read_entry(archive, workbook_name), workbook_name)
    relationships = read_relationships(
        archive, workbook_name, "xl/_rels/workbook.xml.rels"
    )

    matching_relationship_ids: list[str] = []
    relationship_attribute = f"{{{OFFICE_RELATIONSHIPS_NAMESPACE}}}id"
    for element in workbook.iter():
        if local_name(element.tag) == "sheet" and element.attrib.get("name") == SHEET_NAME:
            relationship_id = element.attrib.get(relationship_attribute)
            if not relationship_id:
                raise WorkbookRejected("TreatmentDetails has no workbook relationship")
            matching_relationship_ids.append(relationship_id)
    if not matching_relationship_ids:
        raise WorkbookRejected("TreatmentDetails worksheet is missing")
    if len(matching_relationship_ids) != 1:
        raise WorkbookRejected("TreatmentDetails worksheet is ambiguous")

    relationship = relationships.get(matching_relationship_ids[0])
    if not relationship or not relationship[0].endswith("/worksheet"):
        raise WorkbookRejected("TreatmentDetails worksheet relationship is invalid")
    sheet_name = relationship[1]

    shared_strings_name = None
    for relationship_type, target in relationships.values():
        if relationship_type.endswith("/sharedStrings"):
            if shared_strings_name is not None:
                raise WorkbookRejected("Shared strings relationship is ambiguous")
            shared_strings_name = target
    return sheet_name, shared_strings_name


def reject_formulas(archive: zipfile.ZipFile) -> None:
    for entry in archive.infolist():
        if not entry.filename.startswith("xl/worksheets/") or not entry.filename.endswith(".xml"):
            continue
        root = parse_xml(read_entry(archive, entry.filename), entry.filename)
        if any(local_name(element.tag) == "f" for element in root.iter()):
            raise WorkbookRejected("Formula cells are not allowed")


def read_shared_strings(archive: zipfile.ZipFile, entry_name: str | None) -> list[str]:
    if entry_name is None:
        return []
    root = parse_xml(read_entry(archive, entry_name), entry_name)
    values: list[str] = []
    for item in root:
        if local_name(item.tag) != "si":
            continue
        value = "".join(
            element.text or "" for element in item.iter() if local_name(element.tag) == "t"
        )
        if len(value) > MAX_CELL_CHARACTERS:
            raise WorkbookRejected("Cell value exceeds the length limit")
        values.append(value)
    return values


def column_number(reference: str) -> tuple[int, int]:
    match = CELL_REFERENCE_PATTERN.fullmatch(reference)
    if not match:
        raise WorkbookRejected("Worksheet contains an invalid cell reference")
    column_letters, row_text = match.groups()
    column = 0
    for character in column_letters:
        column = column * 26 + ord(character) - ord("A") + 1
    if column > MAX_EXCEL_COLUMN:
        raise WorkbookRejected("Worksheet cell exceeds the Excel column limit")
    return column, int(row_text)


def cell_value(cell: ElementTree.Element, shared_strings: list[str]) -> str | None:
    cell_type = cell.attrib.get("t")
    if cell_type == "inlineStr":
        value = "".join(
            element.text or "" for element in cell.iter() if local_name(element.tag) == "t"
        )
    else:
        value_element = next(
            (element for element in cell if local_name(element.tag) == "v"), None
        )
        if value_element is None or value_element.text in (None, ""):
            return None
        value = value_element.text
        if cell_type == "s":
            try:
                shared_index = int(value)
                if shared_index < 0:
                    raise IndexError
                value = shared_strings[shared_index]
            except (ValueError, IndexError) as error:
                raise WorkbookRejected("Worksheet has an invalid shared string reference") from error
    if len(value) > MAX_CELL_CHARACTERS:
        raise WorkbookRejected("Cell value exceeds the length limit")
    return value if value != "" else None


def read_rows(
    archive: zipfile.ZipFile, sheet_name: str, shared_strings: list[str]
) -> tuple[list[str | None], list[dict[str, object]], list[dict[str, str]]]:
    root = parse_xml(read_entry(archive, sheet_name), sheet_name)
    parsed_rows: list[tuple[int, dict[int, str | None]]] = []
    seen_row_numbers: set[int] = set()
    cell_count = 0

    for row in (element for element in root.iter() if local_name(element.tag) == "row"):
        row_number_text = row.attrib.get("r")
        if not row_number_text or not row_number_text.isdigit() or int(row_number_text) < 1:
            raise WorkbookRejected("Worksheet contains an invalid row number")
        row_number = int(row_number_text)
        if row_number in seen_row_numbers:
            raise WorkbookRejected("Worksheet contains duplicate row numbers")
        seen_row_numbers.add(row_number)
        values: dict[int, str | None] = {}
        for cell in (element for element in row if local_name(element.tag) == "c"):
            cell_count += 1
            if cell_count > MAX_WORKSHEET_CELLS:
                raise WorkbookRejected("Worksheet contains too many cells")
            reference = cell.attrib.get("r")
            if not reference:
                raise WorkbookRejected("Worksheet cell has no reference")
            column, referenced_row = column_number(reference)
            if referenced_row != row_number:
                raise WorkbookRejected("Worksheet cell reference does not match its row")
            if column in values:
                raise WorkbookRejected("Worksheet row contains duplicate cells")
            values[column] = cell_value(cell, shared_strings)
        parsed_rows.append((row_number, values))

    if not parsed_rows:
        header_values: dict[int, str | None] = {}
        data_rows: list[tuple[int, dict[int, str | None]]] = []
    else:
        _, header_values = parsed_rows[0]
        data_rows = parsed_rows[1:]

    max_header_column = max(header_values, default=0)
    headers = [header_values.get(column) for column in range(1, max_header_column + 1)]
    header_columns: dict[str, int] = {}
    structural_errors: list[dict[str, str]] = []

    for column, raw_header in sorted(header_values.items()):
        if raw_header is None or raw_header.strip() == "":
            continue
        normalized_header = raw_header.strip()
        if normalized_header not in REQUIRED_HEADERS:
            structural_errors.append(
                {
                    "code": "INVALID_HEADER",
                    "header": normalized_header,
                    "message": f"Unexpected header {normalized_header}",
                }
            )
            continue
        if normalized_header in header_columns:
            structural_errors.append(
                {
                    "code": "DUPLICATE_REQUIRED_HEADER",
                    "header": normalized_header,
                    "message": f"Required header {normalized_header} appears more than once",
                }
            )
            continue
        header_columns[normalized_header] = column

    for required_header in REQUIRED_HEADERS:
        if required_header not in header_columns:
            structural_errors.append(
                {
                    "code": "MISSING_REQUIRED_HEADER",
                    "header": required_header,
                    "message": f"Required header {required_header} is missing",
                }
            )

    output_rows: list[dict[str, object]] = []
    for row_number, values in data_rows:
        output_rows.append(
            {
                "type": "row",
                "sourceRowNumber": row_number,
                "values": [
                    values.get(header_columns[header]) if header in header_columns else None
                    for header in REQUIRED_HEADERS
                ],
            }
        )
    return headers, output_rows, structural_errors


def emit_workbook(path: Path) -> None:
    if path.suffix.lower() != ".xlsx":
        raise WorkbookRejected("Only .xlsx workbooks are allowed")
    try:
        with zipfile.ZipFile(path) as archive:
            validate_archive(archive)
            reject_external_relationships(archive)
            content_types = read_entry(archive, "[Content_Types].xml")
            if b"macroenabled" in content_types.lower() or b"vbaproject" in content_types.lower():
                raise WorkbookRejected("Macro-enabled workbooks are not allowed")
            sheet_name, shared_strings_name = find_sheet_and_shared_strings(archive)
            reject_formulas(archive)
            shared_strings = read_shared_strings(archive, shared_strings_name)
            headers, rows, structural_errors = read_rows(
                archive, sheet_name, shared_strings
            )
    except FileNotFoundError as error:
        raise WorkbookRejected("Workbook file does not exist") from error
    except zipfile.BadZipFile as error:
        raise WorkbookRejected("Workbook is not a valid XLSX archive") from error

    print(
        json.dumps(
            {
                "type": "metadata",
                "sheetName": SHEET_NAME,
                "headers": headers,
                "structuralErrors": structural_errors,
            },
            ensure_ascii=False,
            separators=(",", ":"),
        )
    )
    for row in rows:
        print(json.dumps(row, ensure_ascii=False, separators=(",", ":")))


def main() -> int:
    if len(sys.argv) != 2 or not sys.argv[1]:
        print("Workbook rejected: workbook path argument is required", file=sys.stderr)
        return 2
    try:
        emit_workbook(Path(sys.argv[1]))
    except (OSError, WorkbookRejected) as error:
        print(f"Workbook rejected: {error}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
