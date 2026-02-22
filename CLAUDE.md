# Cardinal Laws

1. **No git write commands.** No `git add`, `git commit`, `git push`, `git reset`, `git rebase`, `git merge`, `git checkout`, `git stash`, `git cherry-pick`, or any other command that mutates git state. Read-only git commands (`status`, `log`, `diff`, `show`) are fine.

2. **No modifications outside the working directory.** Never write, edit, delete, or move files outside of `/Users/dennisfurrer/Documents/Work/RRSB/rrsb-mono/`. The only exception is copying/reading files *from* the legacy codebases (`scoreboard/`, `scoreboard-be/`, `rrsb-breaks-calendar/`) *into* this working directory.

3. **Don't build, lint, or format after every change.** Only run builds, typechecks, linters, and formatters when explicitly asked or when a logical phase of work is complete and verification is needed. Be conscious of context window, compute resources, and time.
