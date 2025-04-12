const express = require("express");
const fs = require("fs");
const axios = require("axios");
const cors = require("cors");
const app = express();
const { obtenerPromptPorMensaje } = require("./utils/promptSelector");

require('dotenv').config();
console.log("Clave cargada:", process.env.OPENAI_API_KEY ? "✅ Sí" : "❌ No");

// Verificación de la clave de API
if (!process.env.OPENAI_API_KEY) {
    console.error("Clave de API de OpenAI no encontrada.");
    process.exit(1);
}

// Configuración de CORS
const corsOptions = {
    origin: 'https://mozairt-app-git-main-naials-projects.vercel.app',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('/*name', cors(corsOptions)); //  acá está el fix

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Ruta para analizar el MIDI
app.post("/analyze", async (req, res) => {
    try {
        const userInput = req.body.prompt || "";

        // Detectar tipo de mensaje y obtener el prompt adecuado
        const { categoria, prompts } = await obtenerPromptPorMensaje(userInput);

        if (!prompts || !prompts.respuesta_ejemplo) {
            return res.status(400).json({ error: "No se pudo determinar el prompt adecuado." });
        }

        const promptBase = Array.isArray(prompts.respuesta_ejemplo)
            ? prompts.respuesta_ejemplo[0]
            : prompts.respuesta_ejemplo;

        const contexto = prompts.context || "";

        // Cargar análisis MIDI
        if (!fs.existsSync("./data/extended_midi_analysis.json")) {
            return res.status(500).json({ error: "Archivo de análisis MIDI no encontrado." });
        }

        let analysisData;
        try {
            analysisData = JSON.parse(fs.readFileSync("./data/extended_midi_analysis.json", "utf-8"));
        } catch (parseError) {
            console.error("Error al parsear el archivo JSON:", parseError);
            return res.status(500).json({ error: "Error al procesar el archivo de análisis MIDI." });
        }

        // Mensajes para OpenAI
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
        console.error("Error en análisis:", error.message, error.stack);
        if (error.response) {
            console.error("Respuesta de OpenAI:", error.response.data);
        }
        res.status(500).json({ error: "Error al procesar la solicitud." });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend funcionando en http://localhost:${PORT}`);
});