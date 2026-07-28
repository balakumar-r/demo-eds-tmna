# EDS Test — Developer Quick Start & CSS build workflow

AEM-based frontend with per-component SCSS in `blocks/`. This project compiles each non-partial SCSS file to a same-folder `.css` and supports a BrowserSync-powered watcher for instant CSS injection during development. It also includes a recommended publish flow that pushes compiled-only CSS to a `css-only` branch for the EDS deployment pipeline.

---

## Quick summary (short)
- Source: SCSS files under `blocks/` (keep these tracked).
- Build: `npm run build:css` → compiles `blocks/**/[^_]*.scss` → `.css` + `.css.map` next to sources.
- Dev/watch: `npm run watch:css` → starts Gulp + BrowserSync (proxies your local AEM dev server) and injects CSS on save.
- Publish: produce a `css-only` branch that contains only compiled CSS for EDS (script or CI).

---

## Prerequisites
- Node.js (recommended v16.x or v18.x)
- npm (if using npm v7+ see notes below)
- Git configured with push access to this repository
- AEM local dev server (AEM CLI) for full integration (typical dev URL: http://localhost:3000)

---

## First-time setup (one-time per machine)

1. Clone the repo:
   git clone git@github.com:<owner>/eds-test.git
   cd eds-test

2. Install Node deps (if npm gives ERESOLVE errors, use legacy peer-deps):
   # Recommended (works with peer conflicts):
   npm install --legacy-peer-deps

   # If you prefer to add only BrowserSync:
   npm install --save-dev browser-sync --legacy-peer-deps

Notes:
- Some linting packages in devDependencies may have peer conflicts with strict npm versions; using `--legacy-peer-deps` is the simplest workaround for dev setups.

---

## Build & Watch (development)

1. Build once (verify compilation works):
   npm run build:css

   - This compiles every `blocks/**/[^_]*.scss` to `.css` and `.css.map` files next to their source SCSS.

2. Start your AEM dev server (if you need backend integration):
   aem up
   (confirm AEM serves at e.g. http://localhost:3000)

3. Start the watcher + BrowserSync (in a separate terminal from AEM):
   npm run watch:css

   Behavior:
   - BrowserSync proxies your AEM dev server (default: http://localhost:3000).
   - On a compiled SCSS save (non-partial), CSS is recompiled and injected into the browser (no full reload).
   - On partial (_*.scss) changes the build re-runs so components that import the partial get updated.
   - On markup changes (HTML templates), BrowserSync triggers a full page reload.

Environment variable (if AEM is on a different port):
- Unix / macOS / Git Bash:
  BS_PROXY=http://localhost:4502 npm run watch:css
- Windows PowerShell:
  $env:BS_PROXY='http://localhost:4502'; npm run watch:css

Optional static fallback (if you don't run AEM):
- You can serve a static folder (e.g., test pages) instead of proxying:
  BS_STATIC_DIR=./test-pages npm run watch:css
  (this requires the gulpfile to support static fallback — see Troubleshooting / Fallback)

---

## Commands reference

- Install dependencies:
  npm install --legacy-peer-deps

- Build CSS once:
  npm run build:css

- Start watcher + live reload (BrowserSync):
  npm run watch:css

- Run the Gulp styles task directly (no npm script):
  npx gulp styles

---

## How the build works (brief)
- Gulp task compiles `blocks/**/[^_]*.scss` — that means files whose basename does NOT start with `_`.
- Partials (files beginning with `_`) are not compiled into their own CSS files; they are intended to be imported by component SCSS files.
- Output preserves the folder structure: `blocks/button/button.scss` -> `blocks/button/button.css` and `blocks/button/button.css.map`.
- BrowserSync injects only CSS changes; for other changes it reloads the page.

---

## Troubleshooting

1. Error: Cannot find module 'browser-sync'
   - Install deps (ensure `node_modules` exists):
     npm install --legacy-peer-deps
   - Or install BrowserSync only:
     npm install --save-dev browser-sync --legacy-peer-deps

2. npm ERESOLVE (peer-dependency errors)
   - Use legacy peer deps:
     npm install --legacy-peer-deps
   - Or use yarn: remove package-lock.json and run `yarn install` (alternative).

3. BrowserSync shows a blank/never-loading page
   - The watcher proxies your AEM URL. Ensure AEM is running and reachable:
     # PowerShell
     Invoke-WebRequest -Uri http://localhost:3000 -Method Head
     # Or test TCP
     Test-NetConnection -ComputerName localhost -Port 3000
   - If AEM is not running, start it: `aem up`.
   - If AEM runs on another port, start the watcher with BS_PROXY set (see above).

4. Changes saved but CSS not updating
   - Confirm watcher is running (keep the terminal open).
   - Confirm the file saved is:
     - a non-partial component scss → compiled directly, or
     - a partial that is imported by a compiled scss (otherwise it won't affect any output).
   - If your editor uses atomic saves, file-change events may not trigger — enable polling if needed (ask to enable polling in gulpfile).

5. If you need logs when files change
   - We can update the gulpfile to log filenames on change and show exactly which files are rebuilt.

---

## Publish compiled-only CSS for EDS (recommended flow)

We recommend:
- Keep SCSS tracked in your main branches (dev/feature/main) for code review.
- Publish compiled assets only to a dedicated `css-only` branch that EDS consumes.

Two ways to produce `css-only`:

A) Local publish script (manual)
- Example flow (script: `scripts/build-and-publish-css.sh`):
  - Build: npm ci && npm run build:css
  - Copy only `.css` files into a temp dir preserving folders (rsync)
  - Init a Git repo in temp dir, commit, and force-push to `css-only`

B) CI workflow (automated)
- Add a GitHub Actions workflow (`.github/workflows/publish-css.yml`) that runs on merge to `main` or `workflow_dispatch`, builds CSS, creates an orphan `css-only` branch containing only compiled CSS and force-pushes it using `GITHUB_TOKEN` (or a PAT).

Notes:
- The `css-only` branch is intentionally force-pushed during publishing so it contains only compiled assets.
- If branch protection blocks force pushes to `css-only`, either relax it for the CI user or provide a PAT secret for the action.

---

## Best practices for contributors
- Keep SCSS files in feature branches for review.
- Run `npm run build:css` locally to verify compiled output before opening PRs.
- Use `npm run watch:css` for live development; save often to see instant CSS injection.
- Do not add `**/*.scss` to `.gitignore` — SCSS must remain tracked in the source branches.

---

## Want me to update the repo for you?
I can:
- Commit this README update directly to the repository, or open a PR with the change.
- Add the local publish script under `scripts/` and commit it.
- Add the GitHub Actions workflow to automate publishing to `css-only`.
- Add polling / extra logging to the gulpfile if your editor/OS needs it.

If you want me to commit the README now, reply: "Commit README to repo" and specify whether to push to `main` or create a branch and PR.
