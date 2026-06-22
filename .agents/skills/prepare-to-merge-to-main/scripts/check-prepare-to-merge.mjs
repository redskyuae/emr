#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, sep } from 'node:path';

const root = process.cwd();
const failures = [];
const appRoot = join(root, 'app');

function toProjectPath(path) {
  return relative(root, path).split(sep).join('/');
}

function fromProjectPath(path) {
  return join(root, ...path.split('/'));
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

function git(args) {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function findMergeBase() {
  if (process.env.MERGE_BASE) {
    return process.env.MERGE_BASE;
  }

  for (const ref of ['main', 'origin/main']) {
    const [base] = git(['merge-base', 'HEAD', ref]);

    if (base) {
      return base;
    }
  }

  return undefined;
}

function getChangedProjectPaths() {
  const changed = new Set();
  const mergeBase = findMergeBase();

  if (mergeBase) {
    for (const file of git(['diff', '--name-only', '--diff-filter=ACMR', `${mergeBase}...HEAD`])) {
      changed.add(file);
    }
  }

  for (const file of git(['diff', '--name-only', '--diff-filter=ACMR'])) {
    changed.add(file);
  }

  for (const file of git(['diff', '--name-only', '--cached', '--diff-filter=ACMR'])) {
    changed.add(file);
  }

  for (const file of git(['ls-files', '--others', '--exclude-standard'])) {
    changed.add(file);
  }

  return changed;
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
  const files = walk(root, (path) => /\.(ts|tsx|mts|cts)$/.test(path));

  for (const file of files) {
    const source = readFileSync(file, 'utf8');

    if (/from\s+['"][^'"]*app\/api\/v1\/[^'"]+\/route['"]/.test(source)) {
      fail(file, 'must import API contracts from app/api/v1/**/types.ts, not route.ts');
    }
  }
}

function isPageFile(path) {
  const projectPath = toProjectPath(path);
  return (
    projectPath.startsWith('app/') &&
    !projectPath.startsWith('app/api/') &&
    basename(path) === 'page.tsx'
  );
}

function loaderHasSkeleton(loaderFile) {
  const source = readFileSync(loaderFile, 'utf8');
  return source.includes('@/components/ui/skeleton') && /<Skeleton\b/.test(source);
}

function checkPageLoaders() {
  const pageFiles = walk(appRoot, isPageFile);

  for (const pageFile of pageFiles) {
    const loaderFile = join(dirname(pageFile), 'loader.tsx');

    if (!existsSync(loaderFile)) {
      fail(pageFile, 'missing sibling loader.tsx with a page-shaped Skeleton loader');
      continue;
    }

    if (!loaderHasSkeleton(loaderFile)) {
      fail(loaderFile, 'must import and render Skeleton from @/components/ui/skeleton');
    }
  }
}

const routeSpecialFiles = new Set([
  'default.tsx',
  'error.tsx',
  'global-error.tsx',
  'layout.tsx',
  'loader.tsx',
  'loading.tsx',
  'not-found.tsx',
  'page.tsx',
  'template.tsx',
]);

function checkAppComponentColocation() {
  const appTsxFiles = walk(appRoot, (path) => {
    const projectPath = toProjectPath(path);
    return (
      projectPath.startsWith('app/') && !projectPath.startsWith('app/api/') && path.endsWith('.tsx')
    );
  });

  for (const file of appTsxFiles) {
    const projectPath = toProjectPath(file);

    if (routeSpecialFiles.has(basename(file))) {
      continue;
    }

    if (!projectPath.includes('/_components/')) {
      fail(
        file,
        'page-specific React components under app/ must live in the route-local _components/ directory'
      );
    }
  }
}

function loaderPathForRouteDir(routeDirProjectPath) {
  return `${routeDirProjectPath}/loader.tsx`;
}

function routeDirForChangedComponent(projectPath) {
  const marker = '/_components/';
  const markerIndex = projectPath.indexOf(marker);

  if (markerIndex === -1) {
    return undefined;
  }

  const routeDirProjectPath = projectPath.slice(0, markerIndex);
  const pageFile = fromProjectPath(`${routeDirProjectPath}/page.tsx`);

  if (!existsSync(pageFile)) {
    return undefined;
  }

  return routeDirProjectPath;
}

function checkLoadersChangedWithPagesAndComponents() {
  const changedPaths = getChangedProjectPaths();

  if (changedPaths.size === 0) {
    return;
  }

  for (const projectPath of changedPaths) {
    if (!projectPath.startsWith('app/') || projectPath.startsWith('app/api/')) {
      continue;
    }

    if (projectPath.endsWith('/page.tsx')) {
      const loaderPath = loaderPathForRouteDir(dirname(projectPath).split(sep).join('/'));

      if (!changedPaths.has(loaderPath)) {
        fail(
          fromProjectPath(projectPath),
          `page.tsx changed, so ${loaderPath} must change in the same branch`
        );
      }

      continue;
    }

    if (!projectPath.endsWith('.tsx') || !projectPath.includes('/_components/')) {
      continue;
    }

    const routeDirProjectPath = routeDirForChangedComponent(projectPath);

    if (!routeDirProjectPath) {
      continue;
    }

    const loaderPath = loaderPathForRouteDir(routeDirProjectPath);

    if (!changedPaths.has(loaderPath)) {
      fail(
        fromProjectPath(projectPath),
        `route component changed, so ${loaderPath} must change to keep its skeleton loader in sync`
      );
    }
  }
}

checkRouteContracts();
checkTypesFilesAreTypeOnly();
checkTanStackQueriesUseRouteTypes();
checkNoRouteTypeImports();
checkPageLoaders();
checkAppComponentColocation();
checkLoadersChangedWithPagesAndComponents();

if (failures.length > 0) {
  console.error('Prepare-to-merge checks failed:\n');

  for (const failure of failures) {
    console.error(`- ${failure}`);
  }

  process.exit(1);
}

console.log('Prepare-to-merge checks passed.');
