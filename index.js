const express = require("express");
const fs = require("fs");
const axios = require("axios");
const cors = require("cors");
const app = express();
const { obtenerPromptPorMensaje } = require("./utils/promptSelector");

require('dotenv').config();
console.log("Clave cargada:", process.env.OPENAI_API_KEY ? "✅ Sí" : "❌ No");

// Configuración CORS
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://mozairt-app-git-main-naials-projects.vercel.app',
      'https://mozairt-app.vercel.app'
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  
  
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('/*name', cors(corsOptions)); // fix para preflight

app.use(express.json());

// Endpoint de salud
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Endpoint principal: análisis y respuesta GPT
app.post("/analyze", async (req, res) => {
  try {
    res.header("Access-Control-Allow-Origin", corsOptions.origin);
    res.header("Access-Control-Allow-Methods", corsOptions.methods.join(","));
    res.header("Access-Control-Allow-Headers", corsOptions.allowedHeaders.join(","));
    res.header("Access-Control-Allow-Credentials", "true");

    const userInput = req.body.prompt || "";

    const { categoria, prompts } = await obtenerPromptPorMensaje(userInput);
    const promptBase = Array.isArray(prompts?.respuesta_ejemplo)
      ? prompts.respuesta_ejemplo[0]
      : prompts?.respuesta_ejemplo || "Podés contarme qué necesitás.";

    const contexto = prompts?.context || "";

    const analysisData = JSON.parse(
      fs.readFileSync("./data/extended_midi_analysis.json", "utf-8")
    );

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

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend funcionando en http://localhost:${PORT}`);
});
