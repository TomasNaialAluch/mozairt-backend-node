const express = require("express");
const fs = require("fs");
const axios = require("axios");
const cors = require("cors"); // ✅ agregá esto
const app = express();

require('dotenv').config();
app.use(cors({
    origin: [
        "https://mozairt-app-git-main-naials-projects.vercel.app",
        "https://mozairt-app.vercel.app",
        "https://mozairt-app-naials-projects.vercel.app" // Agrega todas las variantes posibles
    ],
    methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
    preflightContinue: true // Añade esta línea
}));

// Manejo explícito de OPTIONS
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(204).send();
});
  
  // Preflight handler explícito
  app.options("*", cors());
  
  
app.use(express.json());


// Ruta para analizar el MIDI y generar sugerencias
app.post("/analyze", async (req, res) => {
    try {
        // Leer el JSON de análisis y el prompt
        const analysisData = JSON.parse(fs.readFileSync("./data/extended_midi_analysis.json", "utf-8"));
        const prompt = fs.readFileSync("./data/prompt_midi_analysis.txt", "utf-8");

        // Llamada a OpenAI API para generar respuestas
        const openaiResponse = await axios.post(
            "https://api.openai.com/v1/completions", 
            {
                model: "gpt-4", // O usa gpt-3.5 si prefieres
                prompt: `${prompt}\n${JSON.stringify(analysisData)}`,
                max_tokens: 500,
                temperature: 0.7,
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
  // Reemplaza con tu clave de API
                    "Content-Type": "application/json",
                }
            }
        );

        // Respuesta con las sugerencias generadas
        res.json({ suggestions: openaiResponse.data.choices[0].text.trim() });
    } catch (error) {
        console.error("Error en análisis:", error);
        res.status(500).send("Error al procesar la solicitud.");
    }
});

// Iniciar el servidor
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Backend funcionando en http://localhost:${PORT}`);
});
