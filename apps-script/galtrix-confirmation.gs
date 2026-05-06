/**
 * GALTRIX — Gmail confirmation email backend (Google Apps Script)
 * ────────────────────────────────────────────────────────────────────────────
 * Receives an inquiry payload from the GALTRIX website contact form and:
 *   1. Sends a plain-text confirmation email to the client (via Gmail)
 *   2. Sends an internal notification email to galtrix.info@galtrix.net
 *
 * The website's existing Formspree + Telegram notification flow runs in
 * parallel and is unaffected by this script. The internal notification here
 * is a backup with replyTo set to the client's address so a "Reply" in
 * Gmail goes straight back to the client.
 *
 * SETUP: see APPS_SCRIPT_SETUP.md in the project root for step-by-step
 * deployment instructions. After deployment, paste the Web App URL into
 * src/app.jsx's APPS_SCRIPT_URL constant.
 *
 * SECURITY:
 *   - No passwords are used. Authentication is handled by Apps Script's
 *     built-in OAuth flow when you deploy.
 *   - The Web App must be deployed with "Execute as: Me" so Gmail sends
 *     from your Galtrix account.
 *   - "Who has access" must be "Anyone" (no Google sign-in) so the website
 *     form can POST to it from a browser.
 *
 * DELIVERABILITY (Outlook / Hotmail / Yahoo):
 *   The client confirmation body is intentionally plain-text, conversational,
 *   and free of marketing copy / images / tracking links so it reads as a
 *   normal business reply — Outlook / Hotmail spam filters have less to flag.
 *   Inbox placement also depends on the galtrix.net domain having properly
 *   configured SPF, DKIM, and DMARC records — see the "DNS deliverability"
 *   section of APPS_SCRIPT_SETUP.md for the full checklist.
 *
 *   No code change can guarantee inbox placement. SPF/DKIM/DMARC, sender
 *   reputation, content, and recipient behavior all influence outcomes.
 * ────────────────────────────────────────────────────────────────────────────
 */

// ─── Configuration ─────────────────────────────────────────────────────────
const INTERNAL_RECIPIENT = 'galtrix.info@galtrix.net';
const REPLY_TO_ADDRESS   = 'galtrix.info@galtrix.net';
const COMPANY_NAME       = 'GALTRIX';
const FROM_LABEL         = 'GALTRIX Team';

// ─── Main entry point — runs when the website POSTs the form ───────────────
function doPost(e) {
  try {
    const data = parsePayload(e);

    // Pull fields, accepting a couple of name variants so the script is
    // resilient to small payload changes.
    const name    = stringField(data, ['name', 'fullName', 'full_name']);
    const email   = stringField(data, ['email']);
    const company = stringField(data, ['company', 'companyName']);
    const message = stringField(data, ['message', 'project', 'details']);

    // ─── Validation ─────────────────────────────────────────────────────────
    if (!name)                return jsonError('Name is required.');
    if (!email)               return jsonError('Email is required.');
    if (!isValidEmail(email)) return jsonError('Email is not a valid address.');
    if (!message)             return jsonError('Message is required.');

    // ─── Send the confirmation email to the client ──────────────────────────
    sendClientConfirmation(name, email);

    // ─── Send the internal notification to GALTRIX ──────────────────────────
    // Backup notification (Formspree also notifies you and fires Telegram).
    // replyTo is set to the client's address so hitting Reply in Gmail
    // sends straight back to them.
    sendInternalNotification(name, email, company, message);

    return jsonSuccess('Confirmation and internal notification sent.');
  } catch (err) {
    // Never throw — Apps Script will return a 500 with no body and the
    // browser will see a CORS-blocked error instead of a useful message.
    console.error('doPost error:', err && (err.stack || err.message || err));
    return jsonError('Internal error: ' + ((err && err.message) || String(err)));
  }
}

// ─── Health check — visit the deployed URL in a browser to confirm it's up ─
function doGet() {
  return jsonSuccess('GALTRIX confirmation email service is online.');
}

// ─── Parse JSON body, fall back to form params ─────────────────────────────
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
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

// ─── Client confirmation email ─────────────────────────────────────────────
// Plain-text only. No HTML, no images, no tracking links, no marketing copy.
// Reads as a normal business reply, which gives Outlook/Hotmail spam filters
// less to flag and improves inbox placement on those providers.
function sendClientConfirmation(name, toEmail) {
  const greetName = name || 'there';
  const subject  = 'We received your inquiry';

  const body = [
    'Hi ' + greetName + ',',
    '',
    'Thank you for contacting ' + COMPANY_NAME + '.',
    '',
    'We received your inquiry and our team will review the details you ' +
      'submitted. You can expect a response within 24 to 48 hours.',
    '',
    'If you need to add anything else, you can reply directly to this email.',
    '',
    'Best regards,',
    FROM_LABEL,
    REPLY_TO_ADDRESS,
  ].join('\n');

  GmailApp.sendEmail(toEmail, subject, body, {
    name:    FROM_LABEL,
    replyTo: REPLY_TO_ADDRESS,
  });
}

// ─── Internal notification to GALTRIX ──────────────────────────────────────
// Sent in parallel with Formspree's notification (and its Telegram alert).
// Subject uses a normal hyphen ('-') instead of an em dash ('—') to avoid
// encoding issues in some mail clients.
function sendInternalNotification(name, email, company, message) {
  const subject = 'New ' + COMPANY_NAME + ' Inquiry - ' + name;

  const body = [
    'A new inquiry has been submitted through the GALTRIX website.',
    '',
    'Client Name: '  + name,
    'Client Email: ' + email,
    'Company: '      + (company || '(not provided)'),
    '',
    'Message:',
    message,
  ].join('\n');

  GmailApp.sendEmail(INTERNAL_RECIPIENT, subject, body, {
    name:    COMPANY_NAME + ' Website',
    replyTo: email, // hit Reply in Gmail to respond directly to the client
  });
}

// ─── Response helpers ──────────────────────────────────────────────────────
function jsonSuccess(message) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, message: message }))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonError(message) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: message }))
    .setMimeType(ContentService.MimeType.JSON);
}
