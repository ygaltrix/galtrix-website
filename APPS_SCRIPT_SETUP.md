# GALTRIX — Inquiry Verification Setup (Apps Script + Google Sheet)

This sets up **double-opt-in email verification** for the website contact
form. Bots and typo emails never reach your inbox or Telegram — only people
who can actually receive email at the address they typed will produce a real
inquiry.

## How the flow works

```
1. User submits inquiry on the website
   └─► Apps Script writes a "pending" row to a Google Sheet
       and sends a verification email with a one-time link (24h TTL)
       (No Telegram alert, no admin email yet.)

2. User clicks the link in their inbox
   └─► Apps Script verifies the token, marks the row "verified",
       and only THEN forwards the inquiry to Formspree
       (which fires Telegram + your admin Gmail like before)

3. The admin dashboard reads the Sheet directly
   └─► Pending rows show a yellow badge, verified rows show a green one
```

Existing Formspree → Telegram → admin Gmail wiring is unchanged. The Apps
Script just becomes the gate that decides *when* Formspree fires.

---

## One-time setup (≈ 10 minutes)

### Step 1 — Create the Inquiries Sheet

1. Open <https://sheets.new> while signed in as your Galtrix Google account.
2. Rename the spreadsheet to **`GALTRIX — Inquiries`**.
3. Rename the first tab to **`Inquiries`** (double-click `Sheet1` at the bottom).
4. In **row 1**, paste these headers (one per cell, columns A → J):

   ```
   id    submittedAt    status    name    email    company    message    source    token    verifiedAt
   ```

5. Copy the **Sheet ID** from the URL — it's the long string between
   `/spreadsheets/d/` and `/edit`. You'll need it in Step 6.

### Step 2 — Open Apps Script

Go to <https://script.google.com> while signed in as the Galtrix account
that should send the verification emails.

### Step 3 — Create a new project

Click **➕ New project** in the top-left.

### Step 4 — Paste the backend code

1. Open [`apps-script/galtrix-confirmation.gs`](apps-script/galtrix-confirmation.gs) from this repo.
2. Copy the **entire file**.
3. In the Apps Script editor, **delete everything** in `Code.gs` and paste the contents in.
4. Click 💾 **Save** (or `Cmd/Ctrl + S`). Name the project **GALTRIX Inquiry Verification**.

### Step 5 — Generate a dashboard read-key

The dashboard uses this key to fetch the leads list. Generate any random
string — easiest way: open your browser DevTools console anywhere and run:

```js
crypto.randomUUID().replace(/-/g,'')
```

Save it in a note — you'll paste it into both Apps Script (Step 6) and the
dashboard (Step 11).

### Step 6 — Set Script Properties

In the Apps Script editor:

1. Click ⚙ **Project Settings** (left sidebar, near the bottom).
2. Scroll to **Script Properties** → **Add script property**.
3. Add four properties:

   | Property name | Value |
   |---|---|
   | `SHEET_ID` | the Sheet ID you copied in Step 1 |
   | `FORMSPREE_URL` | `https://formspree.io/f/xykljbzj` |
   | `DASHBOARD_KEY` | the random string from Step 5 |
   | `SITE_BASE_URL` | `https://brave-cliff-02c1d5a10.7.azurestaticapps.net` (or your custom domain) |

4. Click **Save script properties**.

### Step 7 — Deploy as a Web App

1. Click **Deploy** (top-right) → **New deployment**.
2. Click ⚙ next to **Select type** → **Web app**.
3. Fill in:

   | Field | Value |
   |---|---|
   | Description | `GALTRIX inquiry verification v1` |
   | Execute as | **Me** *(verification emails will send from your Galtrix account)* |
   | Who has access | **Anyone** *(must be Anyone — the website is public)* |

4. Click **Deploy**.

### Step 8 — Authorize Gmail + Sheets

Google will pop up an OAuth flow:

1. Choose your Galtrix account.
2. *"Google hasn't verified this app"* → **Advanced** → **Go to GALTRIX
   Inquiry Verification (unsafe)**. (Normal for your own scripts.)
3. Click **Allow** to grant Gmail + Sheets permissions.

### Step 9 — Copy the Web App URL

After deployment finishes, copy the URL — it looks like:

```
https://script.google.com/macros/s/AKfycb…long-id…/exec
```

### Step 10 — Confirm the URL in the website code

Open [`src/app.jsx`](src/app.jsx), find the line:

```js
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/.../exec';
```

If it's different from Step 9, update it.

### Step 11 — Paste the URL + key into the dashboard

Open [`dashboard.html`](dashboard.html) and find the `CONFIG` block near the
top of the `<script>`:

```js
APPS_SCRIPT_LIST_URL: "https://script.google.com/macros/s/.../exec",
DASHBOARD_KEY:        "",   // ⬅️ paste here
```

- Make sure `APPS_SCRIPT_LIST_URL` matches Step 9.
- Paste your random key from Step 5 into `DASHBOARD_KEY`.

### Step 12 — Build and deploy

```bash
npm install     # first time only
npm run build
git add -A
git commit -m "Configure inquiry verification flow"
git push
```

Azure SWA redeploys automatically (~90 s).

---

## Re-deploying the Apps Script after edits

**Every time you edit the script** you must re-deploy or your changes won't
take effect:

1. **Deploy → Manage deployments** (top-right).
2. Click ✏ on your active deployment.
3. **Version → New version** → click **Deploy**.

This keeps the same `/exec` URL — no need to update the website.

---

## End-to-end test

1. Open your live site in a browser, scroll to the contact form.
2. Submit with a real email you control (e.g. your personal Gmail).
3. The form should switch to:
   *"One last step — confirm your email. We just sent a confirmation link
   to **you@example.com**…"*.
4. Open your inbox — the verification email should arrive within seconds
   (subject: *"Confirm your email — your inquiry to GALTRIX"*).
5. **Don't click yet.** Open the admin dashboard, hard-refresh
   (`Ctrl + Shift + R`). You should see your inquiry with a yellow
   **pending** pill. No Telegram alert has fired.
6. Click the **Confirm my email →** button in the email. A themed page
   opens: *"Your email is verified."*.
7. Within ~30 seconds:
   - Telegram pings,
   - your admin Gmail receives the Formspree notification,
   - the dashboard auto-refresh upgrades the row to a green **verified** pill.
8. Click the same link again → idempotent *"Already verified"* page.
9. To test expiry: in the Sheet, manually set the `submittedAt` of a pending
   row to a date >24h ago, then click that row's link → *"Link expired"* page.
10. To test the disposable blocklist: try submitting with `foo@mailinator.com` —
    the form should refuse it before even sending.

---

## Troubleshooting

**Form shows "We couldn't submit your inquiry."**

The Apps Script returned `ok: false` or the request failed.
- Visit the `/exec` URL directly in a browser — should show a JSON
  health-check `{"ok":true,…}`.
- If it shows an error, check the Apps Script editor → **Executions** to
  see the stack trace.
- Common causes: `SHEET_ID` script property missing, headers in row 1 of
  the sheet are misspelled, Apps Script not re-deployed after an edit.

**Verification email never arrives.**

- Check the user's spam folder.
- Apps Script editor → **Executions** → look for `sendVerificationEmail`
  failures.
- Gmail per-day send quota: 100/day on free, 1,500/day on Workspace.

**Dashboard shows mock data.**

- Open DevTools → Console. Look for `[Sheet] fetch failed:` or
  `[Sheet] unauthorized` lines.
- Most likely: `DASHBOARD_KEY` mismatch between Apps Script properties and
  `dashboard.html`. They must be byte-identical.
- Or: visiting `…/exec?action=list&key=YOURKEY` in the browser doesn't
  return JSON — re-deploy the script.

**Verification page says "Link expired".**

The token is older than 24 hours. The user must submit again to get a
fresh link. To change the TTL, edit `TOKEN_TTL_MS` near the top of the
Apps Script and re-deploy.

**Telegram alerts stopped firing for some inquiries.**

By design — Telegram now fires only when an inquiry is *verified*. If a
real client never clicks the link you won't hear about it. Watch the
dashboard's **pending** filter for unconfirmed leads, and reach out
manually if needed.

---

## What this added to the repo

| File | Purpose |
|---|---|
| `apps-script/galtrix-confirmation.gs` | Apps Script backend: Sheet I/O, token gen, verification flow, themed HTML pages, dashboard list endpoint |
| `APPS_SCRIPT_SETUP.md` | This file |
| `src/app.jsx` | Contact form: tighter email validation (length, double-dot, disposable-domain blocklist), single POST to Apps Script, *"check your inbox"* success state |
| `dashboard.html` | Reads leads from the Apps Script Sheet endpoint as the primary source. New **pending** + **verified** status pills. New filter buttons. |

---

## Disposable-domain blocklist

Inputs from disposable mailboxes (mailinator, 10minutemail, yopmail, etc.)
are rejected on both the frontend **and** the server. The list lives in:

- `DISPOSABLE_DOMAINS` array near the top of [`apps-script/galtrix-confirmation.gs`](apps-script/galtrix-confirmation.gs)
- `DISPOSABLE_DOMAINS` Set near the top of [`src/app.jsx`](src/app.jsx)

Keep them in sync. Add domains as you encounter abuse.

---

## DNS deliverability — Outlook / Hotmail / Yahoo

Even with a perfect verification email body, Outlook / Hotmail / Yahoo may
route messages to **Junk** if the sending domain (`galtrix.net`) doesn't
have proper email authentication. This is independent of Apps Script — it's
a **DNS** matter handled at your domain registrar (or wherever the
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

After DNS changes propagate (give it 30–60 minutes), test the verification
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
- If a verification email lands in Junk for an Outlook/Hotmail recipient,
  ask them to right-click → **Mark as Not Junk** and to **Add Sender to
  Safe Senders**
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
