<div align="center">
  <img src="public/JAJT.png" alt="JAT" width="80" />
  <h1>Just Another <i>Job</i> Tracker</h1>
  <p>A frictionless job application tracker. Paste a URL, get a parsed entry. That's it.</p>
  <br />
  <a href="https://justanotherjobtracker.com"><strong>justanotherjobtracker.com</strong></a>
</div>

## Overview

JAT (Just Another Tracker), or in this case Just Another _Job_ Tracker is a tool I primarily built for myself. I was tired of manually tracking job applications in a spreadsheet. Copy a title here, paste a company name there, look up the salary range, update a status column. It added up. Copying the details of each application would become cumbersome and caused a ton of friction in the process. Obviously you don't need to track every application, but I like keeping track of things, a lot of things, in my life. This is where the concept of JAT was born. A tracking system, which for now is used to track job applications.

---
The whole thing runs on free tiers. The frontend is hosted on GitHub Pages, the backend on Convex's free plan, and AI parsing uses Google Gemini's free API. If you'd rather run your own instance, it's straightforward to self-host. Everything is open source and the setup takes a few minutes.

I also made it a goal to be platform agnostic because I believe in developing great, polished experiences that can be utilized effectively, regardless of the device medium (laptop, phone or tablet). Thus, the entire UI/UX adapts completely to whichever device you are on.

---
The concept is extremely simple, yet super effective. Paste the URL of a job posting and this tracker automatically extracts the role, company, salary, location, and more. Everything stays in a single, editable table you can sort and manage at a glance.

---

### Features

- **One-paste add.** Paste a job URL and the tracker will attempt to parse it into a structured entry via Google Gemini. Greenhouse and Lever postings are parsed from their APIs for higher accuracy. If a parse cannot occur, manual entry is prompted.
- **Inline editing.** Click any cell in the table to edit it. Role, company, salary, location, dates, and status are all editable in place.
- **Resume management.** Upload, rename, star a default, and attach resumes to individual applications.
- **Location preference.** Set your US state and the tracker will automatically pick the closest matching location from the posting.
- **Mobile-friendly.** Responsive card layout on mobile with a detail sheet for editing and a sticky add-job button.
- **Real-time sync.** Powered by Convex, so changes appear instantly across tabs and devices.

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
git clone https://github.com/AfaqAnwar/jat.git
cd jat
bun install        # or npm install
```

#### 2. Set up Convex

```bash
bunx convex dev    # creates a new project & starts the dev server
```

This will create a `.env.local` file with your `CONVEX_DEPLOYMENT` and `VITE_CONVEX_URL`.

#### 3. Configure environment variables

In the **Convex dashboard** (Settings > Environment Variables), set:

| Variable | Description |
|----------|-------------|
| `SITE_URL` | Your Convex HTTP Actions URL (e.g. `https://your-slug.convex.site`) |
| `AUTH_GITHUB_ID` | GitHub OAuth App client ID |
| `AUTH_GITHUB_SECRET` | GitHub OAuth App client secret |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `GEMINI_API_KEY` | Google Gemini API key (optional, needed for AI parsing) |

For GitHub OAuth, register an app at [github.com/settings/developers](https://github.com/settings/developers). Set the callback URL to your Convex HTTP Actions URL + `/api/auth/callback/github`.

For Google OAuth, create credentials at [console.cloud.google.com](https://console.cloud.google.com/apis/credentials). Set the redirect URI to your Convex HTTP Actions URL + `/api/auth/callback/google`.

#### 4. Run locally

```bash
# Terminal 1
bunx convex dev

# Terminal 2
bun dev
```

Open [http://localhost:5173](http://localhost:5173).

#### 5. Deploy the frontend

**GitHub Pages (recommended):**

1. Push to GitHub.
2. Go to Settings > Pages > Source and select **GitHub Actions**.
3. Add `VITE_CONVEX_URL` as a repository variable (Settings > Secrets and variables > Actions > Variables).
4. Add `CONVEX_DEPLOY_KEY` as a repository secret (generate one in the Convex dashboard under Settings > Deploy Keys).
5. The included workflow at `.github/workflows/deploy.yml` builds and deploys on every push to `main`.

**Other hosts (Vercel, Netlify, Cloudflare Pages):**

Set `VITE_CONVEX_URL` as an environment variable and use `bun run build` as the build command with `dist` as the output directory.

#### 6. Deploy the Convex backend

```bash
bunx convex deploy
```

### Deployment Notes

A few things to be aware of if you're hosting this yourself, especially outside of GitHub Pages.

#### SPA routing and 404 fallback

GitHub Pages doesn't natively support client-side routing. Navigating directly to `/login` returns a 404. The Vite config includes a `spaFallbackPlugin` that copies `index.html` to `404.html` at build time. GitHub Pages serves `404.html` for unknown paths, which lets TanStack Router handle routing on the client.

If you deploy to Vercel, Netlify, or Cloudflare Pages, you don't need this workaround. Those platforms support SPA rewrites natively (e.g. a `_redirects` file or `vercel.json` rewrite rule). The `404.html` copy won't cause issues but you can remove the plugin if you want.

#### Base path

The Vite config reads `VITE_BASE_PATH` to set the app's base URL. When hosting on a custom domain or any platform that serves from root, this should be `/`. If you're hosting under a subpath (e.g. `username.github.io/jat/`), set `VITE_BASE_PATH` to `/jat/`.

This affects asset URLs, the router base, and the OAuth `redirectTo` parameter. The login page constructs its redirect using `window.location.origin + import.meta.env.BASE_URL`, so getting this value right is important for auth to work.

#### OAuth redirect origins

After OAuth, Convex redirects the user back to your frontend. The allowed origins are listed in `convex/auth.ts` under `ALLOWED_REDIRECT_ORIGINS`. If you deploy to a new domain, add it to this array and redeploy your Convex functions. Otherwise login will redirect to the Convex site URL instead of your app.

The OAuth callback URLs configured on GitHub/Google should point to your **Convex HTTP Actions URL** (e.g. `https://your-slug.convex.site/api/auth/callback/github`), not your frontend domain. Convex handles the OAuth exchange and then redirects to your frontend.

#### Content Security Policy

The build injects a CSP meta tag via the `cspPlugin` in `vite.config.ts`. It restricts scripts, styles, fonts, and connections to `'self'` plus Convex domains. If you add third-party services (analytics, error tracking, CDN fonts), you'll need to update the CSP directives or requests will be blocked silently.

#### CNAME file

`public/CNAME` contains `justanotherjobtracker.com` for GitHub Pages custom domain configuration. If you fork this and deploy to your own domain, update or remove this file. If you're not using GitHub Pages, the file is harmless but unnecessary.

---

<div align="center">
  <sub>Built by <a href="https://afaqanw.ar">Afaq Anwar</a></sub>
</div>
