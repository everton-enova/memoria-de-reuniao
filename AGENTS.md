<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project workflow

- At the beginning of each work session, inspect `git status`, the current branch, and `PROJECT_STATUS.md`.
- When a remote history exists, run `git pull --ff-only` before editing. Never overwrite local changes to force a pull.
- Keep `PROJECT_STATUS.md` accurate: only check items that are implemented and verified.
- After completing a coherent, tested change, update the status document, create a descriptive commit, and push it to `origin` unless the user explicitly asks not to.
- Never commit secrets or `.env.local`.
