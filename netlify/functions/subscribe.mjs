// /api/subscribe — first-party email capture for chrisbergeron.com (HC-1135).
// Dual-write: Resend audience (primary) + Grist CRM via webhook-nats-bridge
// (best-effort; reconciled from Resend if the bridge is unreachable).
//
// Env (Netlify site c7d5995f):
//   RESEND_API_KEY     secret/holdingco/resend/chrisbergeron.com field api_key_fa
//   RESEND_AUDIENCE_ID audience "blog-subscribers"
//   WEBHOOK_URL        defaults to the shared "generic" bridge source until the
//                      dedicated blog-subscribe source token exists (HC-1136)
//   WEBHOOK_TOKEN      secret/holdingco/webhook-bridge/tokens/<source> field token

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export default async (req) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  let email = "";
  let honeypot = "";
  try {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const b = await req.json();
      email = String(b.email || "").trim();
      honeypot = String(b.website || "").trim();
    } else {
      const b = await req.formData();
      email = String(b.get("email") || "").trim();
      honeypot = String(b.get("website") || "").trim();
    }
  } catch {
    return json({ error: "bad request" }, 400);
  }

  // Honeypot filled = bot; report success so it learns nothing.
  if (honeypot) return json({ ok: true });
  if (!EMAIL_RE.test(email)) return json({ error: "invalid email" }, 400);

  const ip = req.headers.get("x-nf-client-connection-ip") || "";
  const ua = req.headers.get("user-agent") || "";
  const ts = new Date().toISOString();

  const resendRes = await fetch(
    `https://api.resend.com/audiences/${process.env.RESEND_AUDIENCE_ID}/contacts`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "User-Agent": "chrisbergeron-com-subscribe/1.0",
      },
      body: JSON.stringify({ email, unsubscribed: false }),
    }
  );
  // 409 = contact already exists — that's a success for the subscriber.
  if (!resendRes.ok && resendRes.status !== 409) {
    console.error("resend contact create failed", resendRes.status, await resendRes.text());
    return json({ error: "subscription failed — try again later" }, 502);
  }

  try {
    const whRes = await fetch(
      process.env.WEBHOOK_URL || "https://webhooks.holdingco.com/v1/webhook/generic",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WEBHOOK_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "blog-subscribe",
          email,
          source: "chrisbergeron.com",
          ip,
          user_agent: ua,
          subscribed_at: ts,
        }),
      }
    );
    if (!whRes.ok) console.error("webhook bridge post failed", whRes.status, await whRes.text());
  } catch (e) {
    console.error("webhook bridge post error", e);
  }

  // Non-JS form posts get a redirect home; fetch() callers get JSON.
  if ((req.headers.get("accept") || "").includes("text/html")) {
    return new Response(null, { status: 303, headers: { Location: "/?subscribed=1" } });
  }
  return json({ ok: true });
};
