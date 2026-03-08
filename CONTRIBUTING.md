# Contributing

JAT was built primarily around a feature set that I personally needed. That said, if you have a great idea, spot a bug, or want to improve something, contributions are absolutely welcome. You can open an issue to discuss it first or submit a pull request directly.

## Before you start

For non-trivial changes (new features, architectural refactors, etc.), please **open an issue first**. This avoids duplicate work and gives a chance to discuss the approach before you invest time writing code. Small bug fixes, typo corrections, and documentation improvements can go straight to a PR.

## Prerequisites

- [Bun](https://bun.sh) (or Node.js 20+)
- A free [Convex](https://convex.dev) account
- Git

## Getting started

1. **Fork** the repository and clone your fork.
2. Follow the [Self-Hosting](README.md#self-hosting) steps in the README to get a working local setup.
3. Create a feature branch with a descriptive name: `git checkout -b feat/export-csv` or `git checkout -b fix/parse-timeout`

## Project structure

```
jat/
├── convex/                 # Backend (Convex serverless functions)
│   ├── schema.ts           # Database schema (jobs, resumes, userPreferences)
│   ├── jobs.ts             # Jobs CRUD mutations & queries
│   ├── resumes.ts          # Resume upload, rename, delete, star
│   ├── preferences.ts      # User preferences (location, resume behavior)
│   ├── parseJob.ts         # AI job parsing action (Gemini + Greenhouse/Lever APIs)
│   ├── auth.ts             # OAuth provider configuration
│   ├── http.ts             # HTTP router (auth callback routes)
│   └── lib/                # Shared helpers (auth, validation, normalization)
├── src/
│   ├── routes/             # TanStack Router file-based routes
│   │   ├── index.tsx       # Dashboard (main page)
│   │   └── login.tsx       # Login page
│   ├── components/         # React components
│   │   ├── job-table.tsx   # Main jobs table (desktop + mobile)
│   │   ├── add-job-bar.tsx # URL input bar (desktop)
│   │   ├── mobile-add-button.tsx  # Add job dialog (mobile)
│   │   ├── resume-manager.tsx     # Resume upload/rename/delete modal
│   │   ├── resume-select.tsx      # Per-job resume picker (Popover + Drawer)
│   │   └── ui/             # shadcn/ui primitives
│   └── lib/                # Frontend utilities (types, hooks, formatters)
├── public/                 # Static assets (logo, CNAME)
├── .github/workflows/      # CI/CD (GitHub Pages deploy)
└── vite.config.ts          # Vite + React Compiler + Tailwind + CSP
```

## Code style

- TypeScript strict mode is enabled.
- ESLint is configured. Run `bun lint` before committing.
- No comments that simply narrate what the code does. Comments should explain *why*, not *what*.
- Follow existing naming conventions: `kebab-case` for files, `camelCase` for functions/variables, `PascalCase` for components and types.

## Commit conventions

Write clear, imperative commit messages:

```
fix: validate URL scheme in jobs.add mutation
feat: add rate limiting to parseJob action
docs: update self-hosting instructions
```

## Submitting a PR

1. Make sure `bun lint` and `bun run build` pass locally.
2. Test your changes end-to-end — the app should build and the Convex backend should deploy cleanly.
3. Keep PRs focused. One logical change per pull request. If you're fixing a bug and adding a feature, split them into separate PRs.
4. Include a clear description of what changed and why. Screenshots or recordings are appreciated for UI changes.
5. If your change touches the Convex schema or adds a new mutation/query, mention it in the PR description.

## Reporting issues

Open an issue on GitHub. Include steps to reproduce, expected behavior, and what actually happened. Screenshots or console output are helpful.

For immediate bug reports or usage issues with the hosted version at [justanotherjobtracker.com](https://justanotherjobtracker.com), please email [anwarafaq@outlook.com](mailto:anwarafaq@outlook.com) directly.
