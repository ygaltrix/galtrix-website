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

---

## DNS deliverability — Outlook / Hotmail / Yahoo

Even with a perfect email body, Outlook / Hotmail / Yahoo may route
messages to **Junk** if the sending domain (`galtrix.net`) doesn't have
proper email authentication. This is independent of Apps Script — it's a
**DNS** matter handled at your domain registrar (or wherever the
`galtrix.net` zone lives).

To improve Outlook / Hotmail deliverability, verify that `galtrix.net` has
properly configured **SPF**, **DKIM**, and **DMARC** records for Google
Workspace.

### 1. SPF (Sender Policy Framework)

Make sure `galtrix.net` has an **SPF TXT record** that authorizes Google
Workspace to send email on its behalf.

| Type | Host / Name | Value |
|---|---|---|
| TXT | `@` (or `galtrix.net`) | `v=spf1 include:_spf.google.com ~all` |

> If you already have an SPF record (e.g. for another sender), don't add a
> second one. Combine into a single record:
> `v=spf1 include:_spf.google.com include:other-sender.com ~all`.
> Multiple SPF TXT records on the same domain *break* SPF.

### 2. DKIM (DomainKeys Identified Mail)

DKIM lets receiving servers verify that the email was actually sent by
Google Workspace and wasn't tampered with in transit.

In **Google Admin Console** (admin.google.com, signed in as a Workspace
admin):

1. Go to **Apps → Google Workspace → Gmail**
2. Click **Authenticate email**
3. Click **Generate new record** for `galtrix.net`
4. Copy the generated DNS record (looks like `google._domainkey TXT v=DKIM1; k=rsa; p=...`)
5. Add the record at your DNS provider for `galtrix.net`:
   - Type: `TXT`
   - Host / Name: `google._domainkey`
   - Value: the long `v=DKIM1; k=rsa; p=...` string
6. Wait ~10 minutes for DNS to propagate
7. Back in Google Admin Console, click **Start authentication**

You should see "Authenticating email" or "DKIM signing is on" once it's
verified.

### 3. DMARC (Domain-based Message Authentication)

DMARC tells receiving servers how to handle messages that fail SPF or DKIM
and gives you reports on impersonation attempts.

| Type | Host / Name | Value |
|---|---|---|
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:galtrix.info@galtrix.net` |

The `p=none` policy is **monitor-only** — it doesn't block anything yet,
just collects reports. After ~2 weeks of clean reports, strengthen it:

- `p=quarantine` → suspicious mail goes to Junk on the recipient side
- `p=reject` → strict, recipient rejects unsigned mail outright

> Don't jump straight to `p=reject` on day one — it can block your own
> legitimate mail if SPF or DKIM aren't 100% set up. Start with `p=none`,
> watch reports, then escalate.

### 4. Testing

After DNS changes propagate (give it 30–60 minutes), test the confirmation
email from the live website to **all three** major receivers:

- **Gmail** (gmail.com) — usually inboxes immediately if SPF/DKIM are OK
- **Outlook / Hotmail / Live** (outlook.com, hotmail.com, live.com)
- **Yahoo / AOL** (yahoo.com, aol.com)

For each test, ask the recipient to check **all** of:

- Inbox
- Junk / Spam
- Promotions (Gmail) / Other (Outlook)

If a test message lands in Junk on Outlook/Hotmail, ask the recipient to
mark it **"Not Junk"** — that single click trains Microsoft's filter for
your domain.

**Free tools that grade SPF/DKIM/DMARC for you:**
- <https://www.mail-tester.com> (send the test inquiry to the address it
  gives you, then click "Then check your score" — you want 9.5+/10)
- <https://mxtoolbox.com/spf.aspx> (just enter `galtrix.net`)
- <https://mxtoolbox.com/dmarc.aspx>

---

## Sender reputation warm-up

If `galtrix.net` is a new domain or the `galtrix.info@galtrix.net` mailbox
is new, Outlook / Hotmail filters will be cautious for a few weeks until
the sender builds reputation. To accelerate the warm-up:

- Send normal business correspondence from `galtrix.info@galtrix.net` —
  not just automated form replies
- When you do reach out manually, get the recipient to **reply** to your
  message (replies are a strong positive signal)
- Ask trusted contacts to **add `galtrix.info@galtrix.net` to their
  contacts** — Outlook treats Contacts as automatic-allow-list
- If a confirmation lands in Junk for an Outlook/Hotmail recipient, ask
  them to right-click → **Mark as Not Junk** and to **Add Sender to Safe
  Senders**
- **Avoid sending bulk / blast emails** from a brand-new domain — it spikes
  the spam-filter risk score. Stick to one-to-one and form-reply traffic
  for the first 30 days.

---

## No code change can guarantee inbox delivery

SPF, DKIM, DMARC, sender reputation, email content, *and* per-recipient
behavior all influence whether a message lands in Inbox vs Junk. The
changes in this repo (plain-text body, proper `From` name, `replyTo`,
no images/tracking) measurably improve deliverability — but no engineering
change can guarantee 100 % inbox placement on every receiver, every time.
