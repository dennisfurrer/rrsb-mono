# Cardinal Laws

1. **No git write commands.** No `git add`, `git commit`, `git push`, `git reset`, `git rebase`, `git merge`, `git checkout`, `git stash`, `git cherry-pick`, or any other command that mutates git state. Read-only git commands (`status`, `log`, `diff`, `show`) are fine.

2. **No modifications outside the working directory.** Never write, edit, delete, or move files outside of `/Users/dennisfurrer/Documents/Work/RRSB/rrsb-mono/`. The only exception is copying/reading files *from* the legacy codebases (`scoreboard/`, `scoreboard-be/`, `rrsb-breaks-calendar/`) *into* this working directory.

3. **Don't build, lint, or format after every change.** Only run builds, typechecks, linters, and formatters when explicitly asked or when a logical phase of work is complete and verification is needed. Be conscious of context window, compute resources, and time.

4. **Check settings.local.json before constructing shell commands.** When you need to run a command, first consider whether the same result can be achieved using a command pattern that is already allowed in `.claude/settings.local.json`. Do NOT wrap allowed commands with extra prefixes (like `export NVM_DIR=... && source ... &&`) that change the command signature and trigger unnecessary permission prompts. Use `PATH="$HOME/.nvm/versions/node/v22.14.0/bin:$PATH"` as an env-var prefix when node is needed — this keeps the command matching the allowed pattern.

# Environment

- **Node**: v22.14.0 via nvm at `$HOME/.nvm/versions/node/v22.14.0/bin`
- **Node PATH prefix**: All commands needing node/pnpm/npx MUST start with `export PATH="$HOME/.nvm/versions/node/v22.14.0/bin:$PATH" &&` — this matches the `Bash(export PATH=:*)` allow rule
- **Package manager**: pnpm 10.x
- **Database**: PostgreSQL at localhost:5432, user `rrsb`, database `scoreboard-db-v3`
