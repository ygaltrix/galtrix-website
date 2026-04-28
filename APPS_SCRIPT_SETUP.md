# GALTRIX — Gmail Confirmation Email Setup

This adds **automatic Gmail confirmation emails** to clients who submit the
website inquiry form. Your existing Formspree inquiry notification and
Telegram notification are **not touched** — this runs in parallel.

The flow once set up:

```
Client submits inquiry on website
   ├─► Formspree         → existing internal inquiry email + Telegram alert
   └─► Apps Script (new) → confirmation email to client + backup internal email
                           sent via your Gmail / Google Workspace
```

The Apps Script uses Google's built-in OAuth — you never paste your Gmail
password anywhere, and no credentials are stored in the website code.

---

## One-time setup (≈ 5 minutes)

### Step 1 — Open Apps Script

Go to **<https://script.google.com>** while signed in as
**galtrix.info@galtrix.net** (or whichever Google Workspace account you want
the confirmation emails to be sent from).

### Step 2 — Create a new project

Click **➕ New project** in the top-left.
You'll see a starter file called `Code.gs`.

### Step 3 — Paste the backend code

1. Open [`apps-script/galtrix-confirmation.gs`](apps-script/galtrix-confirmation.gs) from this repo.
2. Copy the **entire file**.
3. In the Apps Script editor, **delete everything** in `Code.gs` and paste
   the contents in.

### Step 4 — Save

Click the 💾 **Save project** icon (or `Cmd/Ctrl + S`). Give the project a
name like **"GALTRIX Confirmation Email"** when prompted.

### Step 5 — Deploy as a Web App

1. Click **Deploy** (top-right) → **New deployment**.
2. Click the ⚙️ gear next to "Select type" → choose **Web app**.

### Step 6 — Configure execution

In the deployment dialog, set:

| Field | Value |
|---|---|
| Description | `GALTRIX confirmation email v1` |
| Execute as | **Me** *(your Galtrix Google account — emails will send from here)* |
| Who has access | **Anyone** *(must be Anyone — the website is public and posts unauthenticated)* |

### Step 7 — Authorize Gmail

Click **Deploy**. Google will pop up an OAuth flow:

1. Choose your Galtrix account.
2. You'll see *"Google hasn't verified this app"* — click **Advanced** →
   **Go to GALTRIX Confirmation Email (unsafe)**. This is normal for your
   own scripts; the warning exists because you (the developer) haven't
   submitted it for Google's verification process, which isn't needed for
   private use.
3. Click **Allow** to grant Gmail send permission.

### Step 8 — Copy the Web App URL

After deployment finishes, you'll get a URL like:

```
https://script.google.com/macros/s/AKfycb…long-id…/exec
```

Click **Copy**.

### Step 9 — Paste it into the website

In this repo, open **`src/app.jsx`** and find this line:

```js
const APPS_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';
```

Replace the placeholder with the URL you just copied:

```js
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycb…/exec';
```

### Step 10 — Rebuild and deploy

```bash
# Locally:
bun run build:bun     # or: npm run build  (Azure runs this on push too)
git add src/app.jsx
git commit -m "Wire Gmail confirmation Apps Script URL"
git push origin main
```

Azure SWA picks up the push and redeploys automatically (~2 min).

### Step 11 — Test

1. Open <https://www.galtrixtech.com> in a private/incognito window.
2. Submit the contact form using a **real email address you can check**.
3. Within 5–30 seconds you should receive **the confirmation email** in
   that inbox.
4. You should also receive **two** internal notifications:
   - The existing Formspree email (with Telegram alert) — unchanged
   - The new Apps Script backup email at `galtrix.info@galtrix.net` (with
     `Reply-To` set to the client's address — handy for replying)

If the confirmation email doesn't arrive within a minute, see
**Troubleshooting** below.

---

## Updating the Apps Script later

If you change the email copy in `apps-script/galtrix-confirmation.gs`:

1. Paste the updated code into the Apps Script editor.
2. Save.
3. **Deploy → Manage deployments → ✏️ Edit (pencil icon) → New version → Deploy.**
4. The URL stays the same — no website rebuild needed.

> ⚠️ Don't click "New deployment" again — that would create a *second* URL
> and you'd have to update the website. Always edit the existing deployment
> to keep the URL stable.

---

## Daily quotas

Apps Script's `GmailApp.sendEmail` quota for a Google Workspace account is
**1,500 outbound recipients per day** (consumer Gmail is 100/day). Your
inquiry volume is nowhere near this — you're safe.

---

## Troubleshooting

**Form submits but no confirmation email arrives.**

1. Open the Apps Script editor → left sidebar → **Executions**.
2. Look at the most recent `doPost` run. If it's red, click it for the error.
3. Common causes:
   - Deployment is "Execute as: User accessing the web app" → change to
     **Me** and redeploy.
   - "Who has access" is restricted → change to **Anyone** and redeploy.
   - Gmail permission was never granted → re-run the OAuth flow.

**`'sent-no-email'` shown on the website success screen.**

This means the request to Apps Script failed at the network layer (Apps
Script down, URL typo, or your network blocked it). The inquiry itself was
recorded by Formspree, so nothing's lost — re-test the URL in a browser
(visit it directly: it should respond with a JSON `{"ok":true,…}`).

**`'error'` shown on the website success screen.**

Formspree itself failed. This is unrelated to the Gmail integration — check
your Formspree dashboard.

---

## What this added to the repo

- `apps-script/galtrix-confirmation.gs` — the backend code to paste into
  Apps Script
- `APPS_SCRIPT_SETUP.md` — this file
- Updated `src/app.jsx`:
  - Added an optional **Company** field to the contact form
  - Stronger client-side validation (name, email format, message)
  - Submits to **both** Formspree (existing) and Apps Script (new) in
    parallel via `Promise.allSettled`
  - New success copy mentioning the confirmation email
  - Distinct error states: `'sent'`, `'sent-no-email'`, `'error'`

Nothing else (Telegram, design, animations, layout) was modified.
