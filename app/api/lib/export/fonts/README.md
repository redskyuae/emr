# PDF export fonts

Embedded by `../pdf-report.ts` so exported PDFs can print names in Arabic as well as Latin script.

| File                                                    | Font             | Source                                                                               |
| ------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------ |
| `NotoSans-Regular.ttf`, `NotoSans-Bold.ttf`             | Noto Sans        | https://github.com/notofonts/notofonts.github.io (`fonts/NotoSans/hinted/ttf`)       |
| `NotoSansArabic-Regular.ttf`, `NotoSansArabic-Bold.ttf` | Noto Sans Arabic | https://github.com/notofonts/notofonts.github.io (`fonts/NotoSansArabic/hinted/ttf`) |

Both are licensed under the SIL Open Font License 1.1 (`OFL-NotoSans.txt`, `OFL-NotoSansArabic.txt`),
which allows embedding them in documents and shipping them with this application.

The routes that build PDFs read these files at run time, so `next.config.ts` adds this folder to
their server bundle with `outputFileTracingIncludes`.
