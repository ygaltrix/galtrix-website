/**
 * Azure Function: GET /api/formspree-submissions
 *
 * Proxies the Formspree Submissions API so the browser never sees the PAT.
 *
 * Environment variables (Azure SWA → Configuration → Application settings):
 *   FORMSPREE_FORM_ID   e.g. "xykljbzj"
 *   FORMSPREE_PAT       Personal Access Token from https://formspree.io/account/api
 *
 * Returns JSON: { ok, source, submissions: [...] } normalized to the
 * shape the dashboard expects.
 */

module.exports = async function (context, req) {
  const FORM_ID = process.env.FORMSPREE_FORM_ID;
  const PAT     = process.env.FORMSPREE_PAT;

  const respond = (status, body) => {
    context.res = {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify(body)
    };
  };

  if (!FORM_ID || !PAT) {
    return respond(200, {
      ok: false,
      error: "missing_config",
      message:
        "Set FORMSPREE_FORM_ID and FORMSPREE_PAT in Azure SWA Configuration. " +
        "Falling back to mock data on the client.",
      submissions: []
    });
  }

  try {
    const url = `https://formspree.io/api/0/forms/${encodeURIComponent(FORM_ID)}/submissions`;
    const r = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${PAT}`,
        "Accept": "application/json"
      }
    });

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return respond(r.status, {
        ok: false,
        error: "formspree_http_" + r.status,
        message: text.slice(0, 400),
        submissions: []
      });
    }

    const data = await r.json();
    const rows = Array.isArray(data.submissions) ? data.submissions : [];

    // Normalize → internal lead shape (keep raw for debugging)
    const submissions = rows.map((s) => {
      const d = s.data || {};
      const iso = s.date || s.created_at || new Date().toISOString();
      return {
        id:   String(s.id || cryptoId()),
        name: d.fullName || d.name || "—",
        email: d.email || "—",
        message: d.project || d.message || "",
        source: d.source || "Formspree",
        submittedAt: iso,
        status: "new",
        history: [{ t: "submitted", at: iso }]
      };
    });

    return respond(200, { ok: true, source: "formspree", submissions });
  } catch (err) {
    context.log.error("formspree-submissions error:", err);
    return respond(502, {
      ok: false,
      error: "upstream_error",
      message: String(err && err.message || err),
      submissions: []
    });
  }
};

function cryptoId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
