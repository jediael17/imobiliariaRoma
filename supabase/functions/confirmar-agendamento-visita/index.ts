const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json(405, { error: "Método não permitido." });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("VISIT_EMAIL_FROM");
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !resendApiKey || !from) {
    return json(500, { error: "O envio de e-mail não está configurado no servidor." });
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization) return json(401, { error: "Sessão ausente." });

  try {
    const identityResponse = await fetch(supabaseUrl + "/auth/v1/user", {
      headers: { apikey: anonKey, Authorization: authorization },
    });
    if (!identityResponse.ok) return json(401, { error: "Sessão inválida." });
    const identity = await identityResponse.json();
    const userEmail = String(identity.email || "").trim().toLowerCase();
    if (!userEmail) return json(403, { error: "Usuário sem e-mail válido." });

    const membershipQuery = new URLSearchParams({
      select: "id",
      email: "eq." + userEmail,
      ativo: "eq.true",
      limit: "1",
    });
    const membershipResponse = await fetch(
      supabaseUrl + "/rest/v1/equipe?" + membershipQuery.toString(),
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: "Bearer " + serviceRoleKey,
        },
      },
    );
    if (!membershipResponse.ok) return json(500, { error: "Não foi possível validar o acesso da equipe." });
    const membership = await membershipResponse.json();
    if (!membership.length) return json(403, { error: "Somente membros ativos da equipe podem enviar confirmações." });

    const payload = await request.json();
    const email = String(payload.email || "").trim();
    const name = String(payload.nome || "").trim();
    const date = String(payload.data || "");
    const time = String(payload.hora || "");
    const code = String(payload.imovel || "").trim();
    const title = String(payload.titulo || "").trim();
    const address = String(payload.endereco || "").trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name || !code || !title ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
      return json(400, { error: "Dados do agendamento incompletos ou inválidos." });
    }

    const visitDate = new Date(date + "T12:00:00");
    const formattedDate = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "long",
      timeZone: "America/Sao_Paulo",
    }).format(visitDate);
    const safeName = escapeHtml(name);
    const safeTitle = escapeHtml(title);
    const safeCode = escapeHtml(code);
    const safeAddress = escapeHtml(address || "Endereço não informado");
    const safeDate = escapeHtml(formattedDate);
    const safeTime = escapeHtml(time);
    const text = [
      "Olá, " + name + "!",
      "",
      "Confirmamos sua visita ao imóvel " + title + " (" + code + ") para " + formattedDate + ", às " + time + ".",
      "Endereço: " + (address || "Endereço não informado") + ".",
      "",
      "A equipe ROMA estará à sua disposição. Se precisar reagendar, responda a este e-mail ou fale com seu corretor.",
      "",
      "Atenciosamente,",
      "ROMA Negócios Imobiliários",
    ].join("\n");
    const html = "<p>Olá, " + safeName + "!</p>" +
      "<p>Confirmamos sua visita ao imóvel <strong>" + safeTitle + "</strong> (" + safeCode + ") para <strong>" + safeDate + ", às " + safeTime + "</strong>.</p>" +
      "<p><strong>Endereço:</strong> " + safeAddress + ".</p>" +
      "<p>A equipe ROMA estará à sua disposição. Se precisar reagendar, responda a este e-mail ou fale com seu corretor.</p>" +
      "<p>Atenciosamente,<br>ROMA Negócios Imobiliários</p>";
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + resendApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "Visita confirmada | ROMA Negócios Imobiliários",
        text,
        html,
      }),
    });
    if (!emailResponse.ok) {
      const details = await emailResponse.text();
      console.error("Resend rejected visit confirmation:", details);
      return json(502, { error: "O provedor não aceitou o envio do e-mail." });
    }
    const result = await emailResponse.json();
    return json(200, { id: result.id || null });
  } catch (error) {
    console.error("Visit confirmation error:", error);
    return json(500, { error: "Falha ao enviar a confirmação da visita." });
  }
});
