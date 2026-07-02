import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// OpenRouter API Configuration
function getOpenRouterApiKey(): string | undefined {
  return process.env.OPENROUTER_API_KEY;
}

// API Route for AI Proxy
app.post("/api/ai", async (req, res) => {
  const OPENROUTER_API_KEY = getOpenRouterApiKey();
  if (!OPENROUTER_API_KEY) {
    console.error("ERRO: OPENROUTER_API_KEY não configurada no servidor.");
    return res.status(500).json({ error: "Erro de configuração: Chave de API não definida no servidor." });
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
        console.log(`[BLACKHAT AI] Requesting OpenRouter with model: ${currentModel}`);
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://ai.studio",
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
          console.log(`[BLACKHAT AI] OpenRouter success with model: ${currentModel}`);
          break; // Success! Break the loop
        } else {
          const errText = await response.text();
          console.error(`[BLACKHAT AI] OpenRouter Error with model ${currentModel}:`, errText);
          lastError = new Error(errText);
        }
      } catch (err: any) {
        console.error(`[BLACKHAT AI] Exception with model ${currentModel}:`, err);
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

// JSON2Video API route
app.get("/api/video-gen", async (req, res) => {
  const { projectId } = req.query;
  const API_KEY = "mbmxlFGhDIcAsrHE7ARuAjp2IZ2ex7rCitNFR1Pd";

  if (!projectId) {
    return res.status(400).json({ error: "O parâmetro projectId é obrigatório." });
  }

  try {
    console.log(`[BLACKHAT AI Video] Checking status for project: ${projectId}`);
    const response = await fetch(`https://api.json2video.com/v2/movies?project=${projectId}`, {
      method: "GET",
      headers: {
        "x-api-key": API_KEY
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[BLACKHAT AI Video] JSON2Video status error:", errText);
      return res.status(response.status).json({ error: "Erro ao consultar status na JSON2Video.", details: errText });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err: any) {
    console.error("[BLACKHAT AI Video] Exception checking status:", err);
    return res.status(500).json({ error: "Erro de conexão ao verificar status do vídeo.", details: err.message });
  }
});

// Helper to ensure correct src attribute instead of url, and sanitize string coordinates (e.g. "center") to numeric values
function fixJson2VideoPayload(payload: any): any {
  if (!payload) return payload;
  if (Array.isArray(payload)) {
    payload.forEach(item => fixJson2VideoPayload(item));
  } else if (typeof payload === "object") {
    // 1. Convert url to src for image/audio/video
    if (payload.type && ["image", "audio", "video"].includes(payload.type)) {
      if (payload.url && !payload.src) {
        payload.src = payload.url;
        delete payload.url;
      }
    }

    // 2. Fix x and y positioning to be integers (mandatory for JSON2Video)
    if (payload.type) {
      const type = payload.type;
      const fontSize = Number(payload["font-size"] || payload.fontSize || 40);

      // Handle X
      if ("x" in payload) {
        const valX = payload.x;
        if (typeof valX === "string") {
          const lowerX = valX.toLowerCase().trim();
          if (lowerX === "center" || lowerX === "middle") {
            if (type === "image" || type === "video") {
              payload.x = 0;
            } else if (type === "text") {
              const textLen = (payload.text || "").length;
              payload.x = Math.max(40, Math.round((1280 - (textLen * fontSize * 0.55)) / 2));
            } else {
              payload.x = 100;
            }
          } else if (lowerX === "left") {
            payload.x = 50;
          } else if (lowerX === "right") {
            if (type === "text") {
              const textLen = (payload.text || "").length;
              payload.x = Math.max(40, Math.round(1280 - (textLen * fontSize * 0.55) - 50));
            } else {
              payload.x = 800;
            }
          } else {
            const parsed = parseInt(valX, 10);
            payload.x = isNaN(parsed) ? 100 : parsed;
          }
        } else if (typeof valX !== "number") {
          payload.x = 100;
        }
      } else {
        if (type === "image" || type === "video") {
          payload.x = 0;
        } else if (type === "text") {
          payload.x = 100;
        }
      }

      // Handle Y
      if ("y" in payload) {
        const valY = payload.y;
        if (typeof valY === "string") {
          const lowerY = valY.toLowerCase().trim();
          if (lowerY === "center" || lowerY === "middle") {
            if (type === "image" || type === "video") {
              payload.y = 0;
            } else if (type === "text") {
              payload.y = Math.max(40, Math.round((720 - fontSize) / 2));
            } else {
              payload.y = 100;
            }
          } else if (lowerY === "top") {
            payload.y = 80;
          } else if (lowerY === "bottom") {
            payload.y = 600;
          } else {
            const parsed = parseInt(valY, 10);
            payload.y = isNaN(parsed) ? 100 : parsed;
          }
        } else if (typeof valY !== "number") {
          payload.y = 100;
        }
      } else {
        if (type === "image" || type === "video") {
          payload.y = 0;
        } else if (type === "text") {
          payload.y = 100;
        }
      }

      // Ensure width/height for image and video
      if (type === "image" || type === "video") {
        if (!payload.width || typeof payload.width === "string") {
          payload.width = 1280;
        }
        if (!payload.height || typeof payload.height === "string") {
          payload.height = 720;
        }
      }
    }

    // Recurse to children
    for (const key in payload) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        fixJson2VideoPayload(payload[key]);
      }
    }
  }
  return payload;
}

app.post("/api/video-gen", async (req, res) => {
  const API_KEY = "mbmxlFGhDIcAsrHE7ARuAjp2IZ2ex7rCitNFR1Pd";
  
  try {
    const { prompt, duration = 10, style = "cinematic", voice = "pt-BR-FranciscaNeural", backgroundMusic = "none", imageUrls = [] } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "O prompt ou descrição do vídeo é obrigatório." });
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "Chave de API do OpenRouter não configurada no servidor." });
    }

    // We will ask Gemini to build a highly creative and valid JSON2Video JSON schema
    const systemPrompt = `Você é um desenvolvedor especialista na API JSON2Video.
Sua tarefa é criar um objeto JSON válido seguindo estritamente as especificações de payload da API JSON2Video v2.

O payload DEVE ter a seguinte estrutura básica:
{
  "width": 1280,
  "height": 720,
  "fps": 25,
  "scenes": [
    {
      "duration": <number_seconds>,
      "background-color": "<hex_color_or_black>",
      "elements": [
        // elementos da cena
      ]
    }
  ]
}

Tipos de elementos permitidos e seus parâmetros principais:
1. Elemento de Texto:
{
  "type": "text",
  "text": "Texto a ser exibido",
  "font": "Arial" ou "Courier" ou "Georgia" ou "Bebas Neue",
  "font-size": 48 (número),
  "color": "#ffffff" ou outra cor,
  "x": 100 (número inteiro obrigatório em pixels),
  "y": 100 (número inteiro obrigatório em pixels),
  "duration": <number>
}

2. Elemento de Voz (Text-to-Speech) para narrar o texto:
{
  "type": "voice",
  "text": "Frase para ser falada pela IA",
  "voice": "${voice}"
}

3. Elemento de Imagem:
{
  "type": "image",
  "src": "<SELECIONE_DA_LISTA_ABAIXO_OU_USER_URL>",
  "duration": <number>,
  "x": 0 (obrigatório),
  "y": 0 (obrigatório),
  "width": 1280,
  "height": 720
}

CATÁLOGO DE IMAGENS ESTÁVEIS E VERIFICADAS (Você DEVE escolher a imagem de fundo mais pertinente deste catálogo para garantir que o render funcione sem erros 404):
- Hambúrguer / Burger / Fast Food / Carnes:
  * "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80"
  * "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80"
- Pizza / Comida Italiana:
  * "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80"
- Comida Saudável / Saladas / Fitness:
  * "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=800&q=80"
- Tecnologia / Computadores / Código / Inteligência Artificial:
  * "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80"
  * "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80"
- Negócios / Finanças / Marketing / Dinheiro:
  * "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
- Cyberpunk / Neon / Futuristic / Dark Tech / Modern:
  * "https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&w=800&q=80"
  * "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80"
- Natureza / Paisagem / Viagem / Geral:
  * "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80"

Diretrizes de geração:
- IMPORTANTE: As propriedades de posicionamento "x" e "y" de todos os elementos (textos, imagens, etc.) DEVEM ser estritamente NÚMEROS INTEIROS (em pixels). É estritamente proibido usar strings como "center", "middle", "left", "right" para "x" ou "y", pois isso faz a renderização falhar!
- Para imagens que ocupam toda a tela do vídeo, configure obrigatoriamente: "x": 0, "y": 0, "width": 1280, "height": 720.
- Para textos, coloque posições numéricas seguras (ex: "x": 100, "y": 100 para o primeiro título, "x": 100, "y": 450 para um subtítulo).
- IMPORTANTE: Sempre use a propriedade "src" (e nunca "url") para especificar o link das imagens ("type": "image") ou do áudio ("type": "audio")!
- Nunca invente ou alucine URLs do Unsplash com IDs que não estejam no catálogo acima, pois isso causará erro de download (404) e o vídeo não renderizará.
- Crie de 1 a 3 cenas dinâmicas baseadas nas especificações do usuário.
- Divida a duração total do vídeo (${duration} segundos) igualmente entre as cenas.
- Em cada cena, coloque pelo menos um elemento de texto de destaque e um elemento de voz narrando o que está acontecendo na cena.
- O estilo visual do vídeo deve seguir: ${style}.
- A música de fundo solicitada é: ${backgroundMusic}. Se for diferente de "none", você pode adicionar opcionalmente um elemento de áudio ("type": "audio", "src": "https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3" para eletrônica, "https://assets.mixkit.co/music/preview/mixkit-corporate-optimism-312.mp3" para corporativa, "https://assets.mixkit.co/music/preview/mixkit-dreaming-big-31.mp3" para cinematic/acústica).
- RESPONDA APENAS E EXCLUSIVAMENTE COM O OBJETO JSON VÁLIDO. NÃO COLOQUE DECORADORES MARKDOWN (COMO \`\`\`json ou \`\`\`), NÃO ESCREVA COMENTÁRIOS, NÃO DIGA NADA ANTES OU DEPOIS DO JSON. APENAS O JSON PURO.`;

    const userInstructionsPrompt = `Gere um vídeo profissional com as seguintes características:
- Roteiro principal / Ideia: "${prompt}"
- Duração total: ${duration} segundos
- Estilo: ${style}
- Voz de narração: ${voice}
- Música de fundo: ${backgroundMusic}
- URLs de imagem opcionais adicionadas pelo usuário: ${imageUrls.join(", ")}

Gere agora o JSON perfeito para JSON2Video v2.`;

    console.log("[BLACKHAT AI Video] Generating JSON2Video schema via OpenRouter...");
    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userInstructionsPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1500
      })
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`Erro na API do OpenRouter ao criar roteiro: ${errText}`);
    }

    const aiData = await aiResponse.json();
    const rawText = aiData?.choices?.[0]?.message?.content?.trim() || "";
    
    // Clean up markdown code block delimiters
    let cleanedJsonText = rawText;
    if (cleanedJsonText.startsWith("```")) {
      cleanedJsonText = cleanedJsonText.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
    cleanedJsonText = cleanedJsonText.trim();

    let jsonPayload;
    try {
      jsonPayload = JSON.parse(cleanedJsonText);
    } catch (parseErr) {
      console.error("[BLACKHAT AI Video] Fail to parse AI generated JSON. Raw text:", rawText);
      jsonPayload = {
        width: 1280,
        height: 720,
        fps: 25,
        scenes: [
          {
            duration: duration,
            "background-color": "#0c0c0e",
            elements: [
              {
                type: "text",
                text: prompt.substring(0, 80),
                font: "Arial",
                "font-size": 40,
                color: "#22d3ee",
                x: "center",
                y: "center",
                duration: duration
              },
              {
                type: "voice",
                text: prompt,
                voice: voice
              }
            ]
          }
        ]
      };
    }

    // Apply safety utility to convert any potential 'url' keys to 'src'
    jsonPayload = fixJson2VideoPayload(jsonPayload);

    console.log("[BLACKHAT AI Video] Generated JSON Payload:", JSON.stringify(jsonPayload));

    // Make the actual call to JSON2Video movies endpoint
    console.log("[BLACKHAT AI Video] Submitting movie render request to JSON2Video...");
    const renderResponse = await fetch("https://api.json2video.com/v2/movies", {
      method: "POST",
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(jsonPayload)
    });

    if (!renderResponse.ok) {
      const renderErrText = await renderResponse.text();
      console.error("[BLACKHAT AI Video] JSON2Video render request failed:", renderErrText);
      return res.status(renderResponse.status).json({
        error: "Erro na API JSON2Video ao enfileirar renderização.",
        details: renderErrText,
        generatedJson: jsonPayload
      });
    }

    const renderData = await renderResponse.json();
    console.log("[BLACKHAT AI Video] JSON2Video accepted render request:", renderData);

    return res.status(200).json({
      success: true,
      message: "O vídeo foi aceito e está sendo renderizado!",
      projectId: renderData.project || renderData.movie,
      generatedJson: jsonPayload,
      response: renderData
    });

  } catch (err: any) {
    console.error("[BLACKHAT AI Video] Exception generating video:", err);
    return res.status(500).json({ error: "Erro interno ao processar geração de vídeo.", details: err.message });
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
    console.log(`[BLACKHAT AI] Server running on http://localhost:${PORT} under ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();
