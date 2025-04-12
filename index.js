const { obtenerPromptPorMensaje } = require("./utils/promptSelector");
const fs = require("fs");

app.post("/analyze", async (req, res) => {
  try {
    // Configuración de cabeceras CORS
    res.header("Access-Control-Allow-Origin", corsOptions.origin);
    res.header("Access-Control-Allow-Methods", corsOptions.methods.join(","));
    res.header("Access-Control-Allow-Headers", corsOptions.allowedHeaders.join(","));
    res.header("Access-Control-Allow-Credentials", "true");

    const userInput = req.body.prompt || "";

    // Detectar tipo de mensaje y obtener el prompt correcto
    const { categoria, prompts } = await obtenerPromptPorMensaje(userInput);
    const promptBase = Array.isArray(prompts?.respuesta_ejemplo)
      ? prompts.respuesta_ejemplo[0]
      : prompts?.respuesta_ejemplo || "Podés contarme qué necesitás.";

    const contexto = prompts?.context || "";

    // Cargar análisis MIDI
    const analysisData = JSON.parse(
      fs.readFileSync("./data/extended_midi_analysis.json", "utf-8")
    );

    // Armar conversación para GPT-4
    const messages = [
      { role: "system", content: contexto },
      { role: "user", content: `${userInput}\n\nAnálisis:\n${JSON.stringify(analysisData)}` }
    ];

    const openaiResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages,
        max_tokens: 500,
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json(openaiResponse.data.choices[0].message.content.trim());

  } catch (error) {
    console.error("Error en análisis:", error);
    res.status(500).json({ error: "Error al procesar la solicitud." });
  }
});
