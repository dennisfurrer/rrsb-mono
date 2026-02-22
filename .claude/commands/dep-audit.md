# /project:dep-audit -- Dependency Audit

You are a dependency auditor. Your job is to analyze package.json dependencies and identify unused, outdated, duplicate, or unnecessarily heavy packages.

## Target

Target: $ARGUMENTS

Default: All `package.json` files in the monorepo.

## This is a READ-ONLY command. It produces a report. It does NOT modify files.

## Audit Steps

### Step 1: Find All package.json Files
```bash
find /Users/dennisfurrer/Documents/Work/perpsstudio-mono -name "package.json" -not -path "*/node_modules/*" -not -path "*/.next/*"
```

### Step 2: For Each Package

#### 2a: Unused Dependencies
For each dependency in `dependencies` and `devDependencies`:
1. Search all source files for imports of that package
2. Check if it is used in config files (next.config, tailwind.config, postcss.config, etc.)
3. Check if it is a CLI tool invoked via scripts in package.json
4. Check if it is a peer dependency required by another installed package
5. Flag if zero usage found

#### 2b: Duplicate Dependencies
Find packages that appear in multiple workspace package.json files with different versions.

#### 2c: Heavy Dependencies
Flag packages known to have large bundle impact:
- `moment` (use `date-fns` or `dayjs`)
- `lodash` (use `lodash-es` or individual imports)
- `axios` (use native `fetch`)
- Any package >500KB that has a lighter alternative

#### 2d: Security
```bash
pnpm audit 2>&1 | head -100
```
Report any known vulnerabilities.

## Report Format

```
## Dependency Audit Report

### Workspace: [monorepo root]

#### Unused Dependencies
| Package | Location | Type | Confidence |
|---------|----------|------|------------|
| `@types/lodash` | `apps/exchange-ui` | devDep | HIGH — no lodash imports |

#### Version Mismatches
| Package | Version A | Location A | Version B | Location B |
|---------|-----------|-----------|-----------|-----------|

#### Heavy Dependencies
| Package | Size | Alternative | Location |
|---------|------|-------------|----------|

#### Security Issues
| Package | Severity | Advisory |
|---------|----------|----------|

### Summary
- Total dependencies: [N]
- Unused (high confidence): [N]
- Version mismatches: [N]
- Security issues: [N]
- Estimated removable: [N] packages

### Recommended Actions
1. [Highest impact first]
2. ...
```

## What NOT to Flag

- TypeScript itself (`typescript`) — always needed even if not directly imported
- Type packages (`@types/*`) — they provide types, not runtime imports
- Build tools (`turbo`, `eslint`, `prettier`, `tailwindcss`) — used by config, not source
- `prisma` / `@prisma/client` — used by codegen, not always directly imported
- Peer dependencies of installed packages
- `next` sub-packages (Next.js has many implicit imports)
