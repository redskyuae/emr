#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';

const root = process.cwd();
const failures = [];

function toProjectPath(path) {
  return relative(root, path).split(sep).join('/');
}

function fail(path, message) {
  failures.push(`${toProjectPath(path)}: ${message}`);
}

function walk(dir, predicate = () => true) {
  if (!existsSync(dir)) {
    return [];
  }

  const results = [];

  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      const projectPath = toProjectPath(path);

      if (
        projectPath === 'node_modules' ||
        projectPath === '.next' ||
        projectPath === '.git' ||
        projectPath.startsWith('node_modules/') ||
        projectPath.startsWith('.next/') ||
        projectPath.startsWith('.git/')
      ) {
        continue;
      }

      results.push(...walk(path, predicate));
      continue;
    }

    if (predicate(path)) {
      results.push(path);
    }
  }

  return results;
}

function collectTypeImportsFromSiblingTypes(source) {
  const importedNames = new Set();
  const importRegex = /import\s+type\s+([\s\S]*?)\s+from\s+['"]\.\/types['"];?/g;

  for (const match of source.matchAll(importRegex)) {
    const importClause = match[1];
    const namedImportMatch = importClause.match(/\{([\s\S]*?)\}/);

    if (!namedImportMatch) {
      continue;
    }

    for (const rawName of namedImportMatch[1].split(',')) {
      const name = rawName
        .trim()
        .replace(/^type\s+/, '')
        .split(/\s+as\s+/)[0]
        ?.trim();

      if (name) {
        importedNames.add(name);
      }
    }
  }

  return importedNames;
}

function checkRouteContracts() {
  const routeRoot = join(root, 'app/api/v1');
  const routeFiles = walk(routeRoot, (path) => path.endsWith(`${sep}route.ts`));

  for (const routeFile of routeFiles) {
    const source = readFileSync(routeFile, 'utf8');
    const typesFile = join(dirname(routeFile), 'types.ts');

    if (!existsSync(typesFile)) {
      fail(routeFile, 'missing sibling types.ts');
      continue;
    }

    if (/^export\s+(type|interface)\s+/m.test(source)) {
      fail(routeFile, 'must not export API contract types inline; move them to sibling types.ts');
    }

    const responseTypes = [
      ...new Set(
        [...source.matchAll(/NextResponse\.json<\s*([A-Za-z_$][\w$]*)\s*>/g)].map(
          (match) => match[1]
        )
      ),
    ];

    if (responseTypes.length > 0) {
      const importedNames = collectTypeImportsFromSiblingTypes(source);

      for (const responseType of responseTypes) {
        if (!importedNames.has(responseType)) {
          fail(
            routeFile,
            `NextResponse.json<${responseType}> must import ${responseType} from ./types with import type`
          );
        }
      }
    }
  }
}

function checkTypesFilesAreTypeOnly() {
  const typesFiles = walk(join(root, 'app/api/v1'), (path) => path.endsWith(`${sep}types.ts`));

  for (const typesFile of typesFiles) {
    const source = readFileSync(typesFile, 'utf8');

    if (!/^export\s+(type|interface)\s+/m.test(source)) {
      fail(typesFile, 'must export at least one type or interface');
    }

    if (/^import\s+(?!type\b)/m.test(source)) {
      fail(typesFile, 'must use import type for every import');
    }

    if (/from\s+['"]next\/server['"]/.test(source)) {
      fail(typesFile, 'must not import next/server');
    }

    if (/\bexport\s+(async\s+function|function|const|let|var|class|enum)\b/.test(source)) {
      fail(typesFile, 'must be type-only; runtime exports are not allowed');
    }
  }
}

function checkTanStackQueriesUseRouteTypes() {
  const queryRoot = join(root, 'app/queries');
  const queryFiles = walk(queryRoot, (path) => /\.(ts|tsx)$/.test(path));

  for (const queryFile of queryFiles) {
    const source = readFileSync(queryFile, 'utf8');
    const usesTanStack = source.includes('@tanstack/react-query');
    const callsApiV1 = source.includes('/api/v1/');

    if (!usesTanStack || !callsApiV1) {
      continue;
    }

    const importsRouteTypes =
      /import\s+type\s+[\s\S]*?from\s+['"][^'"]*api\/v1\/[^'"]+\/types['"]/.test(source);

    if (!importsRouteTypes) {
      fail(
        queryFile,
        'TanStack API hook must import request/response contracts from app/api/v1/**/types.ts'
      );
    }

    const localApiContractType =
      /^(export\s+)?type\s+[A-Za-z_$][\w$]*(Request|Response|ApiResponse)\b/m;

    if (localApiContractType.test(source)) {
      fail(queryFile, 'must not define duplicate API request/response contract types locally');
    }
  }
}

function checkNoRouteTypeImports() {
  const files = walk(root, (path) => {
    const projectPath = toProjectPath(path);

    if (
      projectPath.startsWith('node_modules/') ||
      projectPath.startsWith('.next/') ||
      projectPath.startsWith('.git/')
    ) {
      return false;
    }

    return /\.(ts|tsx|mts|cts)$/.test(path);
  });

  for (const file of files) {
    const source = readFileSync(file, 'utf8');

    if (/from\s+['"][^'"]*app\/api\/v1\/[^'"]+\/route['"]/.test(source)) {
      fail(file, 'must import API contracts from app/api/v1/**/types.ts, not route.ts');
    }
  }
}

checkRouteContracts();
checkTypesFilesAreTypeOnly();
checkTanStackQueriesUseRouteTypes();
checkNoRouteTypeImports();

if (failures.length > 0) {
  console.error('API contract checks failed:\n');

  for (const failure of failures) {
    console.error(`- ${failure}`);
  }

  process.exit(1);
}

console.log('API contract checks passed.');
