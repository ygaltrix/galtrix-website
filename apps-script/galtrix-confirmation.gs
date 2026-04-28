/**
 * GALTRIX — Gmail confirmation email backend (Google Apps Script)
 * ────────────────────────────────────────────────────────────────────────────
 * Receives an inquiry payload from the GALTRIX website contact form and:
 *   1. Sends a professional confirmation email to the client (via Gmail)
 *   2. Sends an internal notification email to galtrix.info@galtrix.net
 *
 * The website's existing Formspree + Telegram notification flow is untouched
 * by this script — it runs in parallel and only handles the confirmation email
 * to the client.
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
 * ────────────────────────────────────────────────────────────────────────────
 */

// ─── Configuration ─────────────────────────────────────────────────────────
const INTERNAL_RECIPIENT = 'galtrix.info@galtrix.net';
const COMPANY_NAME       = 'GALTRIX';
const SLOGAN             = "Built for What's Next.";
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
    if (!name)              return jsonError('Name is required.');
    if (!email)             return jsonError('Email is required.');
    if (!isValidEmail(email)) return jsonError('Email is not a valid address.');
    if (!message)           return jsonError('Message is required.');

    // ─── Send the confirmation email to the client ──────────────────────────
    sendClientConfirmation(name, email);

    // ─── Send the internal notification to GALTRIX ──────────────────────────
    // (Formspree also notifies you — this is a backup with reply-to set to
    //  the client's address so you can hit Reply to respond directly.)
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
function sendClientConfirmation(name, toEmail) {
  const subject = 'Your inquiry has been received';

  // Plain-text version — every client supports this.
  const plainBody = [
    'Hi ' + name + ',',
    '',
    'Thank you for reaching out to ' + COMPANY_NAME + '.',
    '',
    'Your inquiry has been successfully received. Our team will review the ' +
      'details you submitted and follow up with you soon.',
    '',
    'We appreciate the opportunity to learn more about your project and how ' +
      COMPANY_NAME + ' may help support your next stage of growth.',
    '',
    'Best regards,',
    COMPANY_NAME + ' Team',
    SLOGAN,
  ].join('\n');

  // Subtle HTML version that renders nicely in Gmail / Apple Mail / Outlook.
  const htmlBody =
    '<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Inter,Arial,sans-serif;color:#0b0f1d;line-height:1.6;font-size:15px;">' +
      '<p>Hi ' + escapeHtml(name) + ',</p>' +
      '<p>Thank you for reaching out to <strong>' + COMPANY_NAME + '</strong>.</p>' +
      '<p>Your inquiry has been successfully received. Our team will review ' +
        'the details you submitted and follow up with you soon.</p>' +
      '<p>We appreciate the opportunity to learn more about your project ' +
        'and how ' + COMPANY_NAME + ' may help support your next stage of growth.</p>' +
      '<p style="margin-top:28px;">Best regards,<br>' +
        '<strong>' + COMPANY_NAME + ' Team</strong><br>' +
        '<span style="color:#6b7280;font-size:13px;">' + SLOGAN + '</span>' +
      '</p>' +
    '</div>';

  GmailApp.sendEmail(toEmail, subject, plainBody, {
    name:    FROM_LABEL,
    htmlBody: htmlBody,
    // replyTo defaults to the sending Google account (galtrix.info@galtrix.net)
  });
}

// ─── Internal notification to GALTRIX ──────────────────────────────────────
function sendInternalNotification(name, email, company, message) {
  const subject = 'New ' + COMPANY_NAME + ' Inquiry — ' + name;

  const plainBody = [
    'A new inquiry has been submitted through the GALTRIX website.',
    '',
    'Client Name: '  + name,
    'Client Email: ' + email,
    'Company: '      + (company || '(not provided)'),
    'Message:',
    message,
  ].join('\n');

  GmailApp.sendEmail(INTERNAL_RECIPIENT, subject, plainBody, {
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

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
  });
}
