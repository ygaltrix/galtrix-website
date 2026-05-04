/**
 * GALTRIX - Inquiry verification + confirmation backend (Google Apps Script)
 *
 * Double-opt-in flow:
 *   1. doPost  - receives the inquiry, writes a "pending" row to a Google
 *                Sheet, sends a verification email with a one-time link
 *                (24h TTL). Does NOT notify the admin yet.
 *   2. doGet   - handles the verification link click. If the token is valid
 *                and not expired and not already used, marks the row as
 *                "verified", fires the existing Formspree submission (which
 *                triggers Telegram + admin Gmail), and returns a themed
 *                success page.
 *   3. doGet?action=list&key=... - returns all rows as JSON for the admin
 *                dashboard to render.
 *
 * SETUP: see APPS_SCRIPT_SETUP.md. You MUST set these script properties
 * (Apps Script editor -> Project Settings -> Script properties):
 *   SHEET_ID         - the Inquiries spreadsheet id
 *   FORMSPREE_URL    - https://formspree.io/f/xykljbzj
 *   DASHBOARD_KEY    - random string the dashboard sends to read the list
 *   SITE_BASE_URL    - your live site URL (used in email copy)
 *
 * SECURITY: deploy with "Execute as: Me", "Who has access: Anyone". The
 * dashboard list endpoint is gated by DASHBOARD_KEY.
 */

// Brand constants
const COMPANY_NAME = 'GALTRIX';
const SLOGAN       = "Built for What's Next.";
const FROM_LABEL   = 'GALTRIX Team';
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;   // 24 hours

// Sheet column order - must match the headers you create in row 1.
const HEADERS = [
  'id', 'submittedAt', 'status', 'name', 'email',
  'company', 'message', 'source', 'token', 'verifiedAt'
];

// Disposable / throwaway email domains to reject up front. Mirror this list
// in src/app.jsx so the frontend can fail fast.
const DISPOSABLE_DOMAINS = [
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'tempmail.net',
  'temp-mail.org', '10minutemail.com', '10minutemail.net', 'yopmail.com',
  'throwawaymail.com', 'getairmail.com', 'sharklasers.com', 'maildrop.cc',
  'trashmail.com', 'fakeinbox.com', 'mintemail.com', 'mohmal.com'
];

// Routing
function doPost(e) {
  try {
    const data = parsePayload(e);
    const name    = stringField(data, ['name', 'fullName', 'full_name']);
    const email   = stringField(data, ['email']);
    const company = stringField(data, ['company', 'companyName']);
    const message = stringField(data, ['message', 'project', 'details']);
    const source  = stringField(data, ['source']) || 'Galtrix Website Contact Form';

    if (!name)                  return jsonError('Name is required.');
    if (!email)                 return jsonError('Email is required.');
    if (!isValidEmail(email))   return jsonError('That email address looks invalid. Please double-check and try again.');
    if (isDisposable(email))    return jsonError('Please use a permanent email address - disposable inboxes are not accepted.');
    if (!message)               return jsonError('Message is required.');

    // Persist the pending inquiry
    const id    = Utilities.getUuid();
    const token = Utilities.getUuid().replace(/-/g, '');
    const submittedAt = new Date().toISOString();
    appendRow({
      id: id,
      submittedAt: submittedAt,
      status: 'pending',
      name: name,
      email: email,
      company: company,
      message: message,
      source: source,
      token: token,
      verifiedAt: ''
    });

    // Send the confirmation email with the verify link
    const verifyUrl = buildVerifyUrl(id, token);
    sendVerificationEmail(name, email, verifyUrl);

    return jsonSuccess('Verification email sent. Please confirm your email to complete the inquiry.');
  } catch (err) {
    console.error('doPost error:', err && (err.stack || err.message || err));
    return jsonError('Internal error: ' + ((err && err.message) || String(err)));
  }
}

function doGet(e) {
  try {
    const p = (e && e.parameter) || {};

    // Verify endpoint
    if (p.verify && p.id) {
      return handleVerify(p.id, p.verify);
    }

    // Dashboard list endpoint (key-gated JSON)
    if (p.action === 'list') {
      const expected = scriptProp('DASHBOARD_KEY');
      if (!expected || p.key !== expected) {
        return jsonError('unauthorized');
      }
      return jsonSuccess('ok', { leads: listLeads() });
    }

    // Health check
    return jsonSuccess('GALTRIX inquiry verification service is online.');
  } catch (err) {
    console.error('doGet error:', err && (err.stack || err.message || err));
    return htmlPage('error', null, 'Internal error: ' + ((err && err.message) || String(err)));
  }
}

// Verification handler
function handleVerify(id, token) {
  const row = findRowById(id);
  if (!row) return htmlPage('not-found');

  if (String(row.values.token) !== String(token)) return htmlPage('invalid');

  // Idempotent - show "already verified" instead of erroring
  if (String(row.values.status) === 'verified') {
    return htmlPage('already', row.values.name);
  }

  // Expiry check (TOKEN_TTL_MS from submittedAt)
  const submittedAtMs = Date.parse(row.values.submittedAt);
  if (!isFinite(submittedAtMs) || (Date.now() - submittedAtMs) > TOKEN_TTL_MS) {
    return htmlPage('expired', row.values.name);
  }

  // Mark verified
  const verifiedAt = new Date().toISOString();
  updateRow(row.rowIndex, { status: 'verified', verifiedAt: verifiedAt });

  // Fire the existing Formspree pipeline (Telegram + admin Gmail)
  postToFormspree({
    fullName: row.values.name,
    email:    row.values.email,
    company:  row.values.company,
    project:  row.values.message,
    source:   row.values.source + ' (verified)'
  });

  return htmlPage('success', row.values.name);
}

// Sheet I/O
function sheet_() {
  const id = scriptProp('SHEET_ID');
  if (!id) throw new Error('SHEET_ID script property is not set.');
  const ss = SpreadsheetApp.openById(id);
  let sh = ss.getSheetByName('Inquiries');
  if (!sh) {
    sh = ss.insertSheet('Inquiries');
    sh.appendRow(HEADERS);
  } else if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
  }
  return sh;
}

function appendRow(obj) {
  const sh = sheet_();
  const values = HEADERS.map(function (k) { return obj[k] != null ? obj[k] : ''; });
  sh.appendRow(values);
}

// Returns { rowIndex (1-based, includes header), values: {...} } or null
function findRowById(id) {
  const sh = sheet_();
  const last = sh.getLastRow();
  if (last < 2) return null;
  const data = sh.getRange(2, 1, last - 1, HEADERS.length).getValues();
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      const obj = {};
      for (var j = 0; j < HEADERS.length; j++) obj[HEADERS[j]] = data[i][j];
      return { rowIndex: i + 2, values: obj };
    }
  }
  return null;
}

function updateRow(rowIndex, patch) {
  const sh = sheet_();
  const current = sh.getRange(rowIndex, 1, 1, HEADERS.length).getValues()[0];
  for (var j = 0; j < HEADERS.length; j++) {
    if (Object.prototype.hasOwnProperty.call(patch, HEADERS[j])) {
      current[j] = patch[HEADERS[j]];
    }
  }
  sh.getRange(rowIndex, 1, 1, HEADERS.length).setValues([current]);
}

function listLeads() {
  const sh = sheet_();
  const last = sh.getLastRow();
  if (last < 2) return [];
  const data = sh.getRange(2, 1, last - 1, HEADERS.length).getValues();
  const out = data.map(function (row) {
    const o = {};
    for (var j = 0; j < HEADERS.length; j++) o[HEADERS[j]] = row[j];
    delete o.token;   // don't leak the token to the dashboard
    return o;
  });
  // Newest first
  out.sort(function (a, b) {
    return Date.parse(b.submittedAt || 0) - Date.parse(a.submittedAt || 0);
  });
  return out;
}

// Verification email
function sendVerificationEmail(name, toEmail, verifyUrl) {
  const greetName = name || 'there';
  const subject = 'Confirm your email - your inquiry to ' + COMPANY_NAME;

  const plainBody = [
    'Hi ' + greetName + ',',
    '',
    'Thank you for reaching out to ' + COMPANY_NAME + '.',
    '',
    'To complete your inquiry and reach our team, please confirm your',
    'email address by visiting the link below:',
    '',
    verifyUrl,
    '',
    'This link expires in 24 hours.',
    '',
    "Didn't request this? You can safely ignore this email.",
    '',
    'Best regards,',
    COMPANY_NAME + ' Team',
    SLOGAN
  ].join('\n');

  const htmlBody =
    '<div style="background:#04050d;padding:40px 16px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Inter,Arial,sans-serif;">' +
      '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;margin:0 auto;background:#06081a;border:1px solid rgba(34,211,238,0.18);border-radius:24px;overflow:hidden;">' +
        '<tr><td style="padding:36px 36px 8px 36px;">' +
          '<div style="font-family:Space Grotesk,Inter,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.36em;color:#67e8f9;">' + COMPANY_NAME + '</div>' +
          '<h1 style="margin:18px 0 0 0;font-family:Space Grotesk,Inter,sans-serif;font-size:24px;font-weight:700;line-height:1.25;color:#eaf4ff;letter-spacing:-0.01em;">Confirm your email to complete your inquiry</h1>' +
        '</td></tr>' +
        '<tr><td style="padding:18px 36px 8px 36px;">' +
          '<p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:#cbd5e1;">Hi ' + escapeHtml(greetName) + ',</p>' +
          '<p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:#cbd5e1;">Thank you for reaching out to <strong style="color:#eaf4ff;">' + COMPANY_NAME + '</strong>. To make sure we can actually reach you, please confirm your email address by clicking the button below.</p>' +
        '</td></tr>' +
        '<tr><td align="center" style="padding:18px 36px 6px 36px;">' +
          '<a href="' + escapeAttr(verifyUrl) + '" style="display:inline-block;padding:15px 34px;border-radius:14px;background:linear-gradient(135deg,#22d3ee,#a855f7);color:#04050d;font-weight:700;font-size:15px;text-decoration:none;letter-spacing:0.01em;">Confirm my email</a>' +
        '</td></tr>' +
        '<tr><td style="padding:6px 36px 28px 36px;">' +
          '<p style="margin:18px 0 0 0;font-size:12px;line-height:1.6;color:#7b86a8;text-align:center;">This link expires in 24 hours. Didn&rsquo;t request this? You can safely ignore this email.</p>' +
        '</td></tr>' +
        '<tr><td style="padding:0 36px 28px 36px;border-top:1px solid rgba(148,163,184,0.10);padding-top:20px;">' +
          '<p style="margin:0;font-size:12px;line-height:1.6;color:#7b86a8;">If the button does not work, copy &amp; paste this link into your browser:<br><span style="color:#67e8f9;word-break:break-all;">' + escapeHtml(verifyUrl) + '</span></p>' +
        '</td></tr>' +
        '<tr><td style="padding:0 36px 36px 36px;">' +
          '<p style="margin:0;font-size:13px;line-height:1.7;color:#cbd5e1;">Best regards,<br><strong style="color:#eaf4ff;">' + COMPANY_NAME + ' Team</strong><br><span style="color:#7b86a8;font-size:12px;">' + SLOGAN + '</span></p>' +
        '</td></tr>' +
      '</table>' +
    '</div>';

  GmailApp.sendEmail(toEmail, subject, plainBody, {
    name:     FROM_LABEL,
    htmlBody: htmlBody
  });
}

// Themed HTML response pages
function htmlPage(state, name, extra) {
  const greet = name ? escapeHtml(String(name).split(' ')[0]) : 'there';
  let title, headline, body, accent;
  switch (state) {
    case 'success':
      accent = 'cyan';
      title = 'Email verified - GALTRIX';
      headline = 'Your email is verified.';
      body = 'Thanks ' + greet + '. Your inquiry is now on its way to our team. We will be in touch within 24 to 48 hours.';
      break;
    case 'already':
      accent = 'cyan';
      title = 'Already verified - GALTRIX';
      headline = 'This email is already verified.';
      body = 'Looks like you already confirmed this inquiry, ' + greet + '. There is nothing more to do - we will be in touch shortly.';
      break;
    case 'expired':
      accent = 'amber';
      title = 'Link expired - GALTRIX';
      headline = 'This verification link has expired.';
      body = 'For security, the link is only valid for 24 hours. Please submit your inquiry again from the GALTRIX website to get a fresh link.';
      break;
    case 'invalid':
      accent = 'amber';
      title = 'Invalid link - GALTRIX';
      headline = 'This verification link is invalid.';
      body = 'The link does not match any inquiry on file. Please submit your inquiry again from the GALTRIX website.';
      break;
    case 'not-found':
      accent = 'amber';
      title = 'Inquiry not found - GALTRIX';
      headline = 'We could not find this inquiry.';
      body = 'The reference in this link does not exist. Please submit your inquiry again from the GALTRIX website.';
      break;
    case 'error':
    default:
      accent = 'red';
      title = 'Something went wrong - GALTRIX';
      headline = 'Something went wrong on our end.';
      body = extra || 'Please try again in a moment, or email us directly at galtrix.info@galtrix.net.';
  }
  const accentColor = accent === 'cyan' ? '#22d3ee' : accent === 'amber' ? '#fbbf24' : '#f87171';
  const accentSoft  = accent === 'cyan' ? 'rgba(34,211,238,0.18)' : accent === 'amber' ? 'rgba(251,191,36,0.18)' : 'rgba(248,113,113,0.18)';
  const siteUrl = scriptProp('SITE_BASE_URL') || 'https://galtrix.com';

  const html =
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + escapeHtml(title) + '</title>' +
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">' +
    '<style>' +
      'html,body{margin:0;padding:0;background:#04050d;color:#eaf4ff;font-family:Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased;min-height:100vh;}' +
      '.bg{position:fixed;inset:0;pointer-events:none;background:radial-gradient(900px 700px at 12% 8%,rgba(12,26,54,0.9) 0%,transparent 60%),radial-gradient(1100px 900px at 88% 24%,rgba(30,10,52,0.9) 0%,transparent 60%),radial-gradient(ellipse at 50% 120%,#05071a 0%,#02030a 60%);}' +
      '.bg .glow{position:absolute;border-radius:50%;filter:blur(80px);opacity:0.55;}' +
      '.bg .g1{width:55vmax;height:55vmax;top:-18%;left:-18%;background:radial-gradient(circle,rgba(34,211,238,0.55),transparent 65%);}' +
      '.bg .g2{width:55vmax;height:55vmax;top:5%;right:-22%;background:radial-gradient(circle,rgba(168,85,247,0.5),transparent 65%);}' +
      '.wrap{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:32px 16px;}' +
      '.card{max-width:520px;width:100%;background:linear-gradient(180deg,rgba(13,17,36,0.85),rgba(8,11,24,0.85));border:1px solid rgba(148,163,184,0.18);border-radius:28px;padding:44px 36px;backdrop-filter:blur(14px);text-align:center;box-shadow:0 30px 80px -20px rgba(0,0,0,0.6),0 0 0 1px ' + accentSoft + ' inset;}' +
      '.brand{font-family:Space Grotesk,Inter,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.36em;color:#67e8f9;}' +
      '.icon{margin:18px auto 8px;width:64px;height:64px;border-radius:50%;display:grid;place-items:center;border:1px solid ' + accentSoft + ';background:' + accentSoft + ';box-shadow:0 0 30px ' + accentSoft + ';}' +
      'h1{font-family:Space Grotesk,Inter,sans-serif;font-size:24px;font-weight:700;letter-spacing:-0.01em;margin:14px 0 10px;color:#eaf4ff;}' +
      'p{font-size:14.5px;line-height:1.7;color:#cbd5e1;margin:0 0 18px;}' +
      '.cta{display:inline-block;margin-top:8px;padding:13px 28px;border-radius:14px;background:linear-gradient(135deg,#22d3ee,#a855f7);color:#04050d;font-weight:700;font-size:14px;text-decoration:none;letter-spacing:0.01em;transition:transform .18s ease;}' +
      '.cta:hover{transform:translateY(-1px);}' +
      '.foot{margin-top:26px;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#7b86a8;}' +
    '</style></head><body>' +
    '<div class="bg"><div class="glow g1"></div><div class="glow g2"></div></div>' +
    '<div class="wrap"><div class="card">' +
      '<div class="brand">GALTRIX</div>' +
      '<div class="icon">' + iconSvg(state, accentColor) + '</div>' +
      '<h1>' + escapeHtml(headline) + '</h1>' +
      '<p>' + escapeHtml(body) + '</p>' +
      '<a class="cta" href="' + escapeAttr(siteUrl) + '">Return to galtrix.com</a>' +
      '<div class="foot">Built for what is next.</div>' +
    '</div></div></body></html>';

  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function iconSvg(state, color) {
  const stroke = 'stroke="' + color + '" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"';
  if (state === 'success' || state === 'already') {
    return '<svg viewBox="0 0 24 24" width="32" height="32" ' + stroke + '><path d="M5 12.5l4 4L19 7"/></svg>';
  }
  if (state === 'expired') {
    return '<svg viewBox="0 0 24 24" width="32" height="32" ' + stroke + '><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
  }
  if (state === 'invalid' || state === 'not-found') {
    return '<svg viewBox="0 0 24 24" width="32" height="32" ' + stroke + '><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><circle cx="12" cy="16.5" r="1" fill="' + color + '" stroke="none"/></svg>';
  }
  return '<svg viewBox="0 0 24 24" width="32" height="32" ' + stroke + '><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></svg>';
}

// Outbound: fire Formspree (Telegram + admin Gmail) once verified
function postToFormspree(payload) {
  const url = scriptProp('FORMSPREE_URL');
  if (!url) {
    console.warn('FORMSPREE_URL not set - skipping Formspree forward.');
    return;
  }
  try {
    UrlFetchApp.fetch(url, {
      method:  'post',
      contentType: 'application/x-www-form-urlencoded',
      payload: payload,
      headers: { 'Accept': 'application/json' },
      muteHttpExceptions: true
    });
  } catch (err) {
    console.error('Formspree forward failed:', err && err.message);
  }
}

// Helpers
function parsePayload(e) {
  if (e && e.postData && e.postData.contents) {
    try { return JSON.parse(e.postData.contents); }
    catch (_) { /* fall through */ }
  }
  return (e && e.parameter) ? e.parameter : {};
}

function stringField(obj, keys) {
  for (var i = 0; i < keys.length; i++) {
    var v = obj[keys[i]];
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

function isValidEmail(s) {
  s = String(s || '').trim();
  if (s.length > 254) return false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return false;
  const parts = s.split('@');
  if (parts[0].length > 64) return false;
  if (parts[1].indexOf('..') !== -1) return false;
  return true;
}

function isDisposable(s) {
  const dom = String(s).split('@').pop().toLowerCase();
  for (var i = 0; i < DISPOSABLE_DOMAINS.length; i++) {
    if (dom === DISPOSABLE_DOMAINS[i] || dom.endsWith('.' + DISPOSABLE_DOMAINS[i])) {
      return true;
    }
  }
  return false;
}

function buildVerifyUrl(id, token) {
  const base = ScriptApp.getService().getUrl();   // .../exec
  return base + '?verify=' + encodeURIComponent(token) + '&id=' + encodeURIComponent(id);
}

function scriptProp(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

function jsonSuccess(message, extra) {
  const body = Object.assign({ ok: true, message: message }, extra || {});
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonError(message) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: message }))
    .setMimeType(ContentService.MimeType.JSON);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
  });
}

function escapeAttr(s) {
  return escapeHtml(s);
}
