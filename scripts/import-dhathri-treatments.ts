import { writeFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { runDhathriTreatmentImport } from './lib/dhathri-treatment-import-service';

export type DhathriTreatmentImportCliOptions = {
  tenantId: string;
  workbookPath: string;
  commit: boolean;
  reportPath: string | null;
  failOnQuarantine: boolean;
  help: boolean;
};

export const HELP_TEXT = `Import Dhathri Treatment history into Patient Treatment Plans.

Usage:
  bun run import:dhathri-treatments -- --tenant <tenant-id> --workbook <xlsx-path> [--dry-run] [--report <path>]
  bun run import:dhathri-treatments -- --tenant <tenant-id> --workbook <xlsx-path> --commit [--report <path>]

Dry run (default, performs zero writes):
  bun run import:dhathri-treatments -- --tenant TENANT_ID --workbook /path/to/DhathriDetails.xlsx --dry-run

Commit (requires an explicit flag):
  bun run import:dhathri-treatments -- --tenant TENANT_ID --workbook /path/to/DhathriDetails.xlsx --commit

Options:
  --tenant <id>             Target Tenant ID (required)
  --workbook <path>         Source .xlsx workbook (required)
  --dry-run                 Analyze only; this is the default
  --commit                  Persist an audited import
  --report <path>           Write the aggregate JSON report outside this repository
  --fail-on-quarantine      Exit non-zero if any source Plan is quarantined
  --help                    Show this help
`;

function valueAfter(args: string[], index: number, flag: string) {
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value`);
  return value;
}

export function parseDhathriTreatmentImportArgs(
  args: string[],
  repositoryRoot = process.cwd()
): DhathriTreatmentImportCliOptions {
  let tenantId: string | null = null;
  let workbookPath: string | null = null;
  let reportPath: string | null = null;
  let commit = false;
  let explicitDryRun = false;
  let failOnQuarantine = false;
  let help = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--tenant') tenantId = valueAfter(args, index++, argument);
    else if (argument === '--workbook') workbookPath = valueAfter(args, index++, argument);
    else if (argument === '--report') reportPath = valueAfter(args, index++, argument);
    else if (argument === '--commit') commit = true;
    else if (argument === '--dry-run') explicitDryRun = true;
    else if (argument === '--fail-on-quarantine') failOnQuarantine = true;
    else if (argument === '--help' || argument === '-h') help = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }

  if (help) {
    return {
      tenantId: '',
      workbookPath: '',
      commit: false,
      reportPath: null,
      failOnQuarantine: false,
      help: true,
    };
  }
  if (commit && explicitDryRun) throw new Error('--commit and --dry-run cannot be used together');
  if (!tenantId?.trim()) throw new Error('--tenant is required');
  if (!workbookPath?.trim()) throw new Error('--workbook is required');

  if (reportPath) {
    const absoluteReportPath = resolve(reportPath);
    const relativeToRepository = relative(resolve(repositoryRoot), absoluteReportPath);
    if (
      relativeToRepository === '' ||
      (!relativeToRepository.startsWith('..') && !isAbsolute(relativeToRepository))
    ) {
      throw new Error('--report must point outside the repository');
    }
    reportPath = absoluteReportPath;
  }

  return {
    tenantId: tenantId.trim(),
    workbookPath,
    commit,
    reportPath,
    failOnQuarantine,
    help: false,
  };
}

export async function main(args = process.argv.slice(2)) {
  const options = parseDhathriTreatmentImportArgs(args);
  if (options.help) {
    console.log(HELP_TEXT);
    return;
  }

  const summary = await runDhathriTreatmentImport({
    tenantId: options.tenantId,
    workbookPath: options.workbookPath,
    commit: options.commit,
  });
  const report = `${JSON.stringify(summary, null, 2)}\n`;
  console.log(report.trimEnd());
  if (options.reportPath)
    await writeFile(options.reportPath, report, { encoding: 'utf8', mode: 0o600 });

  if (
    summary.status === 'BLOCKED' ||
    (options.failOnQuarantine && summary.quarantinedPlanCount > 0)
  ) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Treatment import failed');
    process.exitCode = 1;
  });
}
