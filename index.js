const express = require("express");
const fs = require("fs");
const axios = require("axios");
const cors = require("cors");
const app = express();

require('dotenv').config();

// Configuración CORS mejorada
const corsOptions = {
  origin: [
    "https://mozairt-app-git-main-naials-projects.vercel.app",
    "https://mozairt-app.vercel.app",
    "https://mozairt-app-naials-projects.vercel.app"
  ],
  methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Middleware para manejar OPTIONS explícitamente
app.options('*', cors(corsOptions));

app.use(express.json());

// Ruta para analizar el MIDI
app.post("/analyze", async (req, res) => {
    try {
        // Configuración de cabeceras CORS para la respuesta
        res.header("Access-Control-Allow-Origin", corsOptions.origin);
        res.header("Access-Control-Allow-Methods", corsOptions.methods.join(","));
        res.header("Access-Control-Allow-Headers", corsOptions.allowedHeaders.join(","));
        res.header("Access-Control-Allow-Credentials", "true");

        const analysisData = JSON.parse(fs.readFileSync("./data/extended_midi_analysis.json", "utf-8"));
        const prompt = fs.readFileSync("./data/prompt_midi_analysis.txt", "utf-8");

        const openaiResponse = await axios.post(
            "https://api.openai.com/v1/completions", 
            {
                model: "gpt-4",
                prompt: `${prompt}\n${JSON.stringify(analysisData)}`,
                max_tokens: 500,
                temperature: 0.7,
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                }
            }
        );

        res.json({ suggestions: openaiResponse.data.choices[0].text.trim() });
    } catch (error) {
        console.error("Error en análisis:", error);
        res.status(500).json({ error: "Error al procesar la solicitud." });
    }
});

// Ruta de verificación de salud
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend funcionando en http://localhost:${PORT}`);
});