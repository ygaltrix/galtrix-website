# GALTRIX Admin Dashboard — Real Data Setup

Your dashboard at [`dashboard.html`](./dashboard.html) already ships with realistic mock data. This guide walks through the two paths to live data. **The Gmail path is recommended — it works on any Formspree plan and requires zero backend secrets.**

## Which path should I pick?

| Path | Plan required | Secrets in browser | Where leads come from |
|---|---|---|---|
| **A — Gmail only (recommended)** | Formspree Free is fine | Restricted OAuth Client ID + API Key only | Parses Formspree notification emails in your inbox |
| **B — Formspree API + Gmail** | Formspree Professional+ | Nothing in browser (PAT lives in Azure) | Formspree Submissions API *and* Gmail inbox |

Path A is simpler, free, and the dashboard already prefers it when Gmail is connected. Start with A; only do B if you specifically want the Formspree API as a second source.

---

## PATH A — Gmail-only (no Formspree plan required)

Every Formspree submission is already emailed to your inbox. The dashboard signs into that inbox with read-only Gmail OAuth and parses those notification emails directly into leads. Skip all of Section 1 — you only need Section 2.

1. Do every step in **Section 2 — Gmail**.
2. Click **Connect Gmail** in the dashboard.
3. The sidebar badge flips to **`gmail · via Gmail inbox`** (cyan dot) and the header shows **`LIVE · GMAIL (FORMSPREE EMAILS)`**.
4. Done.

> The dashboard extracts each lead from: the `Reply-To` header (submitter's email), the `Date` header (submitted-at), and the parsed body fields `fullName`, `project`, `source`. If your Formspree email template is customized, see "Tuning the parser" at the bottom.

---

## PATH B — Add the Formspree Submissions API as a second source

Only continue here if you want to use the Formspree Submissions API in addition to (or instead of) Gmail parsing.

---

## Architecture

```
┌───────────────────────┐        ┌──────────────────────┐        ┌────────────────┐
│  dashboard.html       │───────▶│ /api/formspree-sub…  │──PAT──▶│   Formspree    │
│  (Azure SWA static)   │        │ Azure Function (Node)│        │   Submissions  │
│                       │        └──────────────────────┘        └────────────────┘
│                       │                                                          
│                       │◀─────── OAuth token flow (browser) ────▶ Gmail API      
└───────────────────────┘                                                          
```

- **Formspree PAT never touches the browser.** It lives as an SWA application setting and is only read by the serverless function.
- **Gmail uses browser OAuth** (Google Identity Services). The access token is kept in `sessionStorage` and revoked on sign-out.

---

## 1 — Formspree (live submissions)

> **Plan requirement:** Formspree's HTTP API is a paid feature (Professional / Business). Free plans don't expose this. If you're on Free, either upgrade, or replace the proxy with a Formspree-webhook → storage flow (not covered here).

### 1a. Get the form's API key
Formspree's API keys are **per-form**, under that form's own Settings tab (there is no account-level `/account/api` page any more).

1. Sign in at **https://formspree.io/**.
2. From the forms list, click into your contact form (the one whose endpoint is `xykljbzj`).
3. Click the **Settings** tab.
4. Find the **HTTP API** section → toggle it **On** if needed.
5. Two keys appear:
   - **Master** — read + write
   - **Read-only** — read only (use this one)
6. Copy the **Read-only API key**.

### 1b. Local development
Copy the template:
```
cp api/local.settings.json.example api/local.settings.json
```
Fill in:
```json
{
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "FORMSPREE_FORM_ID": "xykljbzj",
    "FORMSPREE_PAT": "fs_pat_XXXXXXXXXXXXXXXXXXXXXXXX"
  }
}
```
Run the SWA emulator with Functions:
```
npm i -g @azure/static-web-apps-cli azure-functions-core-tools@4
swa start . --api-location api
```
Open `http://localhost:4280/dashboard.html`. The sidebar pill for Formspree should switch from `mock` to `live`.

> `api/local.settings.json` is git-ignored — it will never be committed.

### 1c. Production (Azure Static Web Apps)
1. **Azure Portal** → your Static Web App → **Configuration** → **Application settings**.
2. Add two entries:
   - `FORMSPREE_FORM_ID` = `xykljbzj`
   - `FORMSPREE_PAT` = *(your PAT)*
3. **Save**. Azure restarts the Functions runtime automatically.
4. Push to `main`. The updated workflow now sets `api_location: "api"` and deploys the proxy.
5. Visit `https://<your-app>.azurestaticapps.net/dashboard.html`.

### 1d. Verify
- `GET https://<your-app>.azurestaticapps.net/api/formspree-submissions`
- Expected: `{ "ok": true, "source": "formspree", "submissions": [...] }`
- If `ok:false` with `missing_config`, your app settings were not picked up.

---

## 2 — Gmail (real notifications)

### 2a. Create a Google Cloud project
1. Go to **https://console.cloud.google.com/** → *Select a project* → **New project** (name it "Galtrix Admin").
2. **APIs & Services → Library** → search **Gmail API** → **Enable**.

### 2b. OAuth consent screen
1. **APIs & Services → OAuth consent screen**.
2. User type: **External** → Create.
3. App name: `Galtrix Admin`. Support email: your email.
4. Scopes: **Add or remove scopes** → add `https://www.googleapis.com/auth/gmail.readonly`.
5. Test users: add `leads@galtrix.com` (and any other admin account that will sign in).
6. Save. You can stay in *Testing* mode — no verification required for your own Google Workspace accounts.

### 2c. Create credentials
1. **APIs & Services → Credentials → + Create credentials → OAuth client ID**.
2. Application type: **Web application**.
3. **Authorized JavaScript origins** — add each host the dashboard is served from:
   - `http://localhost:4280`  *(SWA CLI)*
   - `http://localhost:8000`  *(plain `python -m http.server`)*
   - `https://<your-app>.azurestaticapps.net`
   - `https://galtrix.com`  *(if you have a custom domain)*
4. Create → copy the **Client ID** (looks like `123-abc.apps.googleusercontent.com`).
5. Back on **Credentials** → **+ Create credentials → API key**. Copy it.
6. Click the API key → **Edit** → *Application restrictions* → **HTTP referrers** → add the same origins as above → *API restrictions* → **Restrict key** → choose **Gmail API**.

### 2d. Paste into the dashboard
Open [`dashboard.html`](./dashboard.html), find the `CONFIG` block near the top of the `<script>`:

```js
const CONFIG = {
  FORMSPREE_FORM_ID: "xykljbzj",
  FORMSPREE_PROXY:   "/api/formspree-submissions",
  GMAIL_CLIENT_ID:   "123-abc.apps.googleusercontent.com",   // ⬅️ paste here
  GMAIL_API_KEY:     "AIzaSy...",                             // ⬅️ paste here
  GMAIL_DESTINATION: "leads@galtrix.com",
  GMAIL_QUERY:       'from:(no-reply@formspree.io) newer_than:30d',
  GMAIL_SCOPE:       'https://www.googleapis.com/auth/gmail.readonly',
  GMAIL_DISCOVERY:   'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest',
};
```

> These two values **are safe to ship in the browser** because you restricted them to your origins in Google Cloud. That's the intended use.

### 2e. Connect
1. Reload the dashboard.
2. The Gmail panel now shows a **Connect Gmail** button.
3. Click it → sign in with `leads@galtrix.com` → grant read-only Gmail access.
4. The panel switches to **Live** and starts streaming notifications matching `GMAIL_QUERY`.

### 2f. Signing out
Click the sign-out icon next to the **Live** pill. The access token is revoked and removed from `sessionStorage`.

---

## 3 — Tuning the Gmail query

`CONFIG.GMAIL_QUERY` is raw Gmail search syntax. Useful variants:

| Intent                                  | Query                                                            |
|----------------------------------------|------------------------------------------------------------------|
| Only Formspree notifications, last 30d | `from:(no-reply@formspree.io) newer_than:30d`                    |
| Any form notification, last 90d        | `(from:formspree.io OR subject:"new submission") newer_than:90d` |
| Only unread                            | `from:no-reply@formspree.io is:unread`                           |
| Specific label                         | `label:Leads from:no-reply@formspree.io`                         |

---

## 4 — File map

```
dashboard.html                             ← the dashboard UI
api/
  formspree-submissions/
    function.json                          ← GET /api/formspree-submissions
    index.js                               ← proxy logic
  host.json                                ← Functions host config
  package.json
  local.settings.json.example              ← copy → local.settings.json
.github/workflows/
  azure-static-web-apps-brave-cliff-…yml   ← api_location: "api"
.gitignore                                 ← excludes api/local.settings.json
```

---

## 5 — Troubleshooting

| Symptom                                             | Likely cause                                                             |
|-----------------------------------------------------|--------------------------------------------------------------------------|
| Sidebar shows `mock · Formspree` in production      | Missing `FORMSPREE_FORM_ID` or `FORMSPREE_PAT` app setting               |
| `/api/formspree-submissions` returns 404            | Workflow not redeployed, or `api_location` still `""`                    |
| Proxy returns `formspree_http_401`                  | PAT was rotated/revoked — generate a new one                             |
| Gmail `idpiframe_initialization_failed`             | Origin not listed in OAuth client → Authorized JS origins                |
| Gmail sign-in works but list is empty               | Query matched nothing. Try a broader `GMAIL_QUERY`                       |
| `Google scripts did not load`                       | `accounts.google.com` blocked by browser extensions / strict privacy CSP |

---

Everything is reversible: clearing the two app settings restores mock mode for Formspree, and clicking sign-out (or clearing `CONFIG.GMAIL_CLIENT_ID`) restores mock mode for Gmail.

---

## 6 — Tuning the Gmail → Lead parser

The dashboard's Gmail parser (in `Gmail.fetchLeads` inside `dashboard.html`) expects Formspree-style notification emails:

```
fullName: Jane Doe
email: jane@northwind.co
project: Looking to build an AI-powered ops layer…
source: Hero CTA
```

It maps them into lead objects using this priority:

| Lead field   | 1st choice                            | Fallback                                              |
|--------------|---------------------------------------|-------------------------------------------------------|
| `email`      | `Reply-To` header                     | parsed `email:` field                                 |
| `name`       | parsed `fullName:` or `name:`         | subject "New submission from {X}" → X, else email prefix |
| `message`    | parsed `project:` or `message:`       | email snippet                                          |
| `source`     | parsed `source:`                      | `"Formspree → Gmail"`                                  |
| `submittedAt`| `Date` header                         | `internalDate`                                         |

If you customize your Formspree template with different field labels, adjust the fallback names in `Gmail.fetchLeads` — search for `fields.fullname`, `fields.project`, etc. The keys are the field labels, lowercased, with spaces removed.
