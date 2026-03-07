<div align="center">
  <img src="public/JAJT.png" alt="JAT" width="80" />
  <h1>Just Another Job Tracker</h1>
  <p>A frictionless job application tracker. Paste a URL, get a parsed entry. That's it.</p>
</div>

---

<!-- Tab-style navigation -->
**[Overview](#overview)** | **[Contributing](#contributing)**

---

## Overview

JAT is a personal job application tracker designed to get out of your way. Paste the URL of a job posting and the app automatically extracts the role, company, salary, location, and more using AI. Everything stays in a single, editable table you can sort and manage at a glance.

### Features

- **One-paste add** -- paste a job URL and JAT parses it into a structured entry via Google Gemini. Greenhouse and Lever postings are parsed from their APIs for higher accuracy.
- **Inline editing** -- click any cell in the table to edit it. Role, company, salary, location, dates, and status are all editable in place.
- **Resume management** -- upload, rename, star a default, and attach resumes to individual applications. Supports "always use latest" mode.
- **Location preference** -- set your US state and JAT automatically picks the closest matching location from multi-location postings.
- **Mobile-friendly** -- responsive card layout on mobile with a detail sheet for editing, sticky add-job button.
- **Real-time sync** -- powered by Convex, so changes appear instantly across tabs and devices.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TanStack Router, Tailwind CSS 4, shadcn/ui, Radix UI |
| Backend | Convex (serverless DB, file storage, actions) |
| Auth | `@convex-dev/auth` with GitHub and Google OAuth |
| AI | Google Gemini (`gemma-3-4b-it`) for job posting extraction |
| Build | Vite 7, TypeScript 5.9, React Compiler |

### Self-Hosting

JAT is designed to be self-hosted. You need a free [Convex](https://convex.dev) account, OAuth credentials for GitHub and/or Google, and optionally a Gemini API key for AI parsing.

#### 1. Clone and install

```bash
git clone https://github.com/your-username/jat.git
cd jat
bun install        # or npm install
```

#### 2. Set up Convex

```bash
npx convex dev     # creates a new project & starts the dev server
```

This will create a `.env.local` file with your `CONVEX_DEPLOYMENT` and `VITE_CONVEX_URL`.

#### 3. Configure environment variables

In the **Convex dashboard** (Settings > Environment Variables), set:

| Variable | Description |
|----------|-------------|
| `CONVEX_SITE_URL` | Your Convex site URL (e.g. `https://your-slug.convex.site`) |
| `AUTH_GITHUB_ID` | GitHub OAuth App client ID |
| `AUTH_GITHUB_SECRET` | GitHub OAuth App client secret |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `GEMINI_API_KEY` | Google Gemini API key (optional, needed for AI parsing) |

For GitHub OAuth, register an app at [github.com/settings/developers](https://github.com/settings/developers). Set the callback URL to your `CONVEX_SITE_URL` + `/api/auth/callback/github`.

For Google OAuth, create credentials at [console.cloud.google.com](https://console.cloud.google.com/apis/credentials). Set the redirect URI to your `CONVEX_SITE_URL` + `/api/auth/callback/google`.

#### 4. Run locally

```bash
# Terminal 1 — Convex backend
npx convex dev

# Terminal 2 — Vite frontend
bun dev            # or npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

#### 5. Deploy the frontend

**GitHub Pages (recommended):**

1. Push to GitHub.
2. Go to Settings > Pages > Source and select **GitHub Actions**.
3. Add `VITE_CONVEX_URL` as a repository variable (Settings > Secrets and variables > Actions > Variables).
4. The included workflow at `.github/workflows/deploy.yml` builds and deploys on every push to `main`.

**Other hosts (Vercel, Netlify, Cloudflare Pages):**

Set `VITE_CONVEX_URL` as an environment variable and use `bun run build` as the build command with `dist` as the output directory.

#### 6. Deploy the Convex backend

```bash
npx convex deploy
```

---

## Contributing

Contributions are welcome. Whether it's a bug fix, feature, or documentation improvement, feel free to open a PR.

### Prerequisites

- [Bun](https://bun.sh) (or Node.js 20+)
- A free [Convex](https://convex.dev) account
- Git

### Getting started

1. **Fork** the repository and clone your fork.
2. Follow the [Self-Hosting](#self-hosting) steps above to get a working local setup.
3. Create a feature branch: `git checkout -b feat/my-feature`

### Project structure

```
jat/
├── convex/                 # Backend (Convex serverless functions)
│   ├── schema.ts           # Database schema (jobs, resumes, userPreferences)
│   ├── jobs.ts             # Jobs CRUD mutations & queries
│   ├── resumes.ts          # Resume upload, rename, delete, star
│   ├── preferences.ts      # User preferences (location, resume behavior)
│   ├── parseJob.ts         # AI job parsing action (Gemini + Greenhouse/Lever APIs)
│   ├── auth.ts             # OAuth provider configuration
│   └── lib/                # Shared helpers (auth, validation, normalization)
├── src/
│   ├── routes/             # TanStack Router file-based routes
│   │   ├── index.tsx       # Dashboard (main page)
│   │   └── login.tsx       # Login page
│   ├── components/         # React components
│   │   ├── job-table.tsx   # Main jobs table (desktop + mobile)
│   │   ├── add-job-bar.tsx # URL input bar
│   │   ├── resume-manager.tsx
│   │   └── ui/             # shadcn/ui primitives
│   └── lib/                # Frontend utilities (types, hooks, formatters)
├── .github/workflows/      # CI/CD (GitHub Pages deploy)
└── vite.config.ts          # Vite + React Compiler + Tailwind + CSP
```

### Code style

- TypeScript strict mode is enabled.
- ESLint is configured -- run `bun lint` (or `npm run lint`) before committing.
- No comments that simply narrate what the code does. Comments should explain *why*, not *what*.
- Follow existing naming conventions: `kebab-case` for files, `camelCase` for functions/variables, `PascalCase` for components and types.

### Commit conventions

Write clear, imperative commit messages:

```
fix: validate URL scheme in jobs.add mutation
feat: add rate limiting to parseJob action
docs: update self-hosting instructions
```

### Submitting a PR

1. Make sure `bun lint` and `bun run build` pass locally.
2. Keep PRs focused -- one feature or fix per PR.
3. Include a brief description of what changed and why.
4. If your change touches the Convex schema or adds a new mutation/query, mention it in the PR description.

### Reporting issues

Open an issue on GitHub. Include steps to reproduce, expected behavior, and what actually happened. Screenshots or console output are helpful.

---

<div align="center">
  <sub>Built by <a href="https://afaqanw.ar">Afaq Anwar</a></sub>
</div>
