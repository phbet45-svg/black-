export default async function handler(req, res) {
  // CORS Configuration
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) {
    console.error("ERRO: OPENROUTER_API_KEY não configurada no servidor Vercel.");
    return res.status(500).json({ error: "Erro de configuração: Chave de API OPENROUTER_API_KEY não definida no painel do Vercel." });
  }

  try {
    const { prompt, systemPrompt, toolId, model } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "O prompt é obrigatório." });
    }

    // Set model fallback
    const selectedModel = model || "google/gemini-2.5-flash";

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    // We will try these models in order to ensure absolute reliability and high availability
    const modelsToTry = [
      selectedModel,
      "google/gemini-2.5-flash",
      "google/gemini-2.5-flash:free",
      "openai/gpt-4o-mini",
      "meta-llama/llama-3-8b-instruct:free"
    ];

    let lastError = null;
    let data = null;

    for (const currentModel of modelsToTry) {
      try {
        console.log(`[BLACKHAT AI Vercel] Requesting OpenRouter with model: ${currentModel}`);
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://blackhat-ai.vercel.app",
            "X-Title": "BLACKHAT AI"
          },
          body: JSON.stringify({
            model: currentModel,
            messages: messages,
            temperature: 0.7,
            max_tokens: 1500
          })
        });

        if (response.ok) {
          data = await response.json();
          console.log(`[BLACKHAT AI Vercel] OpenRouter success with model: ${currentModel}`);
          break; // Success! Break the loop
        } else {
          const errText = await response.text();
          console.error(`[BLACKHAT AI Vercel] OpenRouter Error with model ${currentModel}:`, errText);
          lastError = new Error(errText);
        }
      } catch (err) {
        console.error(`[BLACKHAT AI Vercel] Exception with model ${currentModel}:`, err);
        lastError = err;
      }
    }

    if (data) {
      return res.status(200).json(data);
    } else {
      return res.status(502).json({ 
        error: "Erro em todos os modelos da API de IA do OpenRouter.", 
        details: lastError?.message || lastError || "Falha de conexão" 
      });
    }
  } catch (error) {
    console.error("Vercel Serverless Exception:", error);
    return res.status(500).json({ error: "Erro interno do servidor ao processar IA no Vercel", message: error.message });
  }
}
