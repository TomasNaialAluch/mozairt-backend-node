const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();

// Cargar variables de entorno
require('dotenv').config();
console.log("Clave cargada:", process.env.OPENAI_API_KEY ? "✅ Sí" : "❌ No");

// Verificación de la clave de API
if (!process.env.OPENAI_API_KEY) {
    console.error("Clave de API de OpenAI no encontrada.");
    process.exit(1);
}

// Configuración de CORS
const corsOptions = {
    origin: [
        'https://mozairt-app.vercel.app',
        'https://mozairt-app-git-main-naials-projects.vercel.app'
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('/*', cors(corsOptions)); // Preflight requests

// Middleware para analizar JSON
app.use(express.json());

// Ruta de salud
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Ruta para analizar el prompt del usuario
app.post("/analyze", async (req, res) => {
    try {
        // Acceder al campo 'prompt' del objeto JSON
        const userInput = req.body.prompt?.trim();
        if (!userInput) {
            return res.status(400).json({ error: "El texto no puede estar vacío." });
        }

        // Construir mensajes para OpenAI
        const messages = [
            { role: "system", content: "Eres un asistente musical especializado en responder preguntas relacionadas con música clásica y MIDI." },
            { role: "user", content: userInput }
        ];

        // Enviar solicitud a OpenAI
        const openaiResponse = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4", // Cambia a "gpt-3.5-turbo" si prefieres un modelo más económico
                messages,
                max_tokens: 200, // Limitar la longitud de la respuesta
                temperature: 0.7 // Controlar la creatividad de la respuesta
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        // Extraer y devolver la respuesta de OpenAI
        const responseText = openaiResponse.data.choices[0].message.content.trim();
        res.json({ response: responseText });

    } catch (error) {
        console.error("Error en análisis:", error.message, error.stack);
        if (error.response) {
            console.error("Respuesta de OpenAI:", error.response.data);
        }
        res.status(500).json({ error: "Error al procesar la solicitud." });
    }
});

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend funcionando en http://localhost:${PORT}`);
});