import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// OpenRouter API Configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.error("ERRO: OPENROUTER_API_KEY não configurado.");
}

// API Route for AI Proxy
app.post("/api/ai", async (req, res) => {
  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({ error: "Erro de configuração: OPENROUTER_API_KEY não definida no servidor." });
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

    let lastError: any = null;
    let data: any = null;

    for (const currentModel of modelsToTry) {
      try {
        console.log(`[BackHat AI] Requesting OpenRouter with model: ${currentModel}`);
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://ai.studio",
            "X-Title": "BackHat AI"
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
          console.log(`[BackHat AI] OpenRouter success with model: ${currentModel}`);
          break; // Success! Break the loop
        } else {
          const errText = await response.text();
          console.error(`[BackHat AI] OpenRouter Error with model ${currentModel}:`, errText);
          lastError = new Error(errText);
        }
      } catch (err: any) {
        console.error(`[BackHat AI] Exception with model ${currentModel}:`, err);
        lastError = err;
      }
    }

    if (data) {
      return res.json(data);
    } else {
      return res.status(502).json({ 
        error: "Erro em todos os modelos da API de IA do OpenRouter.", 
        details: lastError?.message || lastError || "Falha de conexão" 
      });
    }
  } catch (error: any) {
    console.error("Server API Exception:", error);
    return res.status(500).json({ error: "Erro interno do servidor ao processar IA", message: error.message });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // In Express v4, use '*'
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[BackHat AI] Server running on http://localhost:${PORT} under ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();
