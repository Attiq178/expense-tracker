# Expense Ledger — Project Handoff
*Last updated: 10 July 2026*

## What this project is
A personal daily/monthly expense tracker. Single-page HTML app (no framework, no build step) that stores all data in a Google Sheet via a Google Apps Script web app. Deployed on GitHub Pages as an installable PWA.

---

## Current architecture

```
[index.html on GitHub Pages]  --fetch-->  [Apps Script /exec URL]  --reads/writes-->  [Google Sheet]
        (PWA, installable)                  (runs as Attiq's account)                 (Attiq's Drive)
```

- **Frontend**: `index.html` (originally `expense-tracker.html`) — vanilla JS, all client-side
- **Backend**: Google Apps Script bound to the sheet, deployed as Web App
  - Execute as: **Me** · Access: **Anyone**
  - Actions supported: `add`, `update`, `delete` (POST, JSON body, Content-Type text/plain to dodge CORS preflight)
  - `doGet` returns all rows as JSON; normalizes dates to `yyyy-MM-dd`, auto-assigns Ids to manually typed rows, strips currency text from amounts
- **Sheet layout**: tab `Sheet1`, columns `Id | Date | Category | Amount | Note`, headers in row 1
- **Apps Script URL** (baked into the HTML):
  `https://script.google.com/macros/s/AKfycbwevRe5dCJltG3B6SqxTNO4YNEZIjxgAlB6Nc1YToCyQzQtWH6JfZIh0kS6QYlOSI_Y/exec`
- **GitHub Pages**: account `attiq178`, site building from `main` branch, root folder
  - URL pattern: `https://attiq178.github.io/<repo-name>/`

## Repo files (5)
| File | Purpose |
|---|---|
| `index.html` | The whole app (rename of expense-tracker.html) |
| `manifest.json` | PWA manifest → install prompt, icons, standalone mode |
| `sw.js` | Service worker: network-first caching, offline shell |
| `icon-192.png`, `icon-512.png` | App icons (ledger/receipt design) |

## Features built so far
- Add / **edit** (✎) / delete (✕) expenses; edit mode highlights the row and switches the form to "Update expense" + Cancel
- **Month / Year / All** view toggle — Year & All show per-month summary rows (count + total), tap a month to drill into daily detail; ‹ › arrows navigate months (or years in Year view)
- Big "receipt" total card, per-day grouping with day totals, today's total
- **Dark theme**: ◐ button top-right, defaults to device preference (choice not persisted — deliberate, localStorage skipped; can add persistence later)
- Sync status badge (synced / saving / failed) with real server error messages in toasts
- Currency `Rs`, categories list — both editable in the CONFIG block at top of the HTML
- PWA: installable on desktop (address-bar icon) and phone (Android: install banner; iPhone: Safari → Share → Add to Home Screen)

---

## ⚠️ Open items when resuming

1. **Possibly unresolved: "Unknown action" on update.** The live Apps Script deployment may still be running the FIRST script version (no `update` action, no date normalization). Fix: Apps Script editor → confirm latest code is pasted & saved → **Deploy → Manage deployments → pencil → Version: "New version" → Deploy**.
   **Verify**: open the /exec URL — dates must look like `"2026-07-10"` (new code), NOT `"Fri Jul 10 2026 00:00:00 GMT+0500..."` (old code). Editing entries only works once this shows the new format.
2. Check for duplicate deployments in Manage deployments (created during troubleshooting) — keep the one matching the URL above, archive the rest.

## Key lessons learned (troubleshooting history)
- **Saving code in Apps Script ≠ deploying.** Live URL only updates via Manage deployments → New version. "New deployment" creates a NEW URL (old one keeps old code).
- 302 on POST is normal (redirect to script.googleusercontent.com).
- CORS errors from Apps Script usually mean auth/misconfig, not actual CORS: check access = "Anyone" (not "Anyone with Google account"), Execute as = "Me".
- Multi-account Google sessions break script.google.com pages → use incognito with only the owning account (attiqtherehman@gmail.com).
- GitHub Pages redeploys automatically on every commit (~1 min); Apps Script never does.

---

## 🔮 Pending decision: multi-user version
**Requirement**: any user signs in with their Gmail; app auto-creates/maintains an expense sheet in *their own* Drive.

**Chosen-candidate architecture** (no server needed):
- Google Identity Services "Sign in with Google" in the frontend
- OAuth scope `drive.file` (app can only touch files it created — lightweight verification)
- First sign-in: create "Expense Ledger" spreadsheet in user's Drive; later: find & reuse it
- Read/write via Google Sheets REST API with the user's token
- Apps Script backend gets retired entirely

**Setup needed**: Google Cloud project + OAuth consent screen + client ID + whitelist the GitHub Pages origin (~30–60 min console work, no code).

**Effort estimate**: 1–2 days total incl. testing. Caveats: unverified-app phase limits to 100 manually-added test users + shows "unverified" warning until verification; token expiry/refresh handling needed.

**Fallback option**: keep current architecture, let each user paste their own Apps Script URL (zero dev, terrible onboarding).

**Status**: NOT decided yet — revisit on the weekend.

## Resume checklist
- [ ] Fix/verify the Apps Script redeploy (open item #1)
- [ ] Confirm edit + delete work end-to-end from the GitHub Pages URL
- [ ] Install PWA on phone, sanity-check
- [ ] Decide: multi-user OAuth rebuild vs. keep personal
- [ ] If OAuth: ask Claude for full updated app + Google Cloud console walkthrough
