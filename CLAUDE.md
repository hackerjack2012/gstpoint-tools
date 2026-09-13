@AGENTS.md

## Git Workflow

After successfully completing each requested coding task:

1. Run `git status` and review all changed files.
2. Only commit files that were changed as part of the current requested task.
3. Never commit secrets, API keys, `.env*`, credentials, `node_modules`, `.next`, database files, logs, caches, build outputs, or other generated files.
4. Run the appropriate validation/tests for the changes before committing.
5. If validation fails, fix the issue first. Do not commit or push known broken code.
6. Stage only the relevant files for the completed task. Do not blindly use `git add .` if unrelated changes exist.
7. Create a concise, descriptive Git commit message explaining the completed change.
8. Push the commit to the current GitHub branch automatically after a successful commit.
9. Never force-push, rewrite Git history, delete branches, or reset/discard existing changes unless I explicitly request it.
10. After pushing, report:
   - Commit hash
   - Commit message
   - Branch pushed
   - Whether the push succeeded

If Git authentication, merge conflicts, remote changes, or another issue prevents a safe push, stop and tell me instead of forcing the operation.