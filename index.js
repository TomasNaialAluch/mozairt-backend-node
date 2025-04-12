app.post("/analyze", async (req, res) => {
  try {
      // Log para verificar si los datos del frontend llegan correctamente
      console.log("Texto recibido del frontend:", req.body);

      const userInput = req.body || ""; // Texto plano directamente en req.body
      if (!userInput.trim()) {
          console.error("El texto está vacío o no válido.");
          return res.status(400).json({ error: "El texto no puede estar vacío." });
      }

      // Determinar el modo basado en el texto
      const modo = determinarModo(userInput);
      console.log("Modo detectado:", modo);

      // Construir mensajes para OpenAI según el modo
      let contexto = "";
      if (modo === "identity") {
          contexto = "El usuario está buscando información sobre su identidad o características personales.";
      } else if (modo === "emotional") {
          contexto = "El usuario está expresando o preguntando sobre emociones o estados de ánimo.";
      } else {
          contexto = "El usuario está haciendo una pregunta general.";
      }

      // Cargar análisis MIDI (si es necesario)
      if (!fs.existsSync("./data/extended_midi_analysis.json")) {
          console.error("Archivo de análisis MIDI no encontrado.");
          return res.status(500).json({ error: "Archivo de análisis MIDI no encontrado." });
      }

      let analysisData;
      try {
          analysisData = JSON.parse(fs.readFileSync("./data/extended_midi_analysis.json", "utf-8"));
          console.log("Datos de análisis MIDI cargados:", analysisData);
      } catch (parseError) {
          console.error("Error al parsear el archivo JSON:", parseError);
          return res.status(500).json({ error: "Error al procesar el archivo de análisis MIDI." });
      }

      // Construir mensajes para OpenAI
      const messages = [
          { role: "system", content: contexto },
          { role: "user", content: `${userInput}\n\nAnálisis:\n${JSON.stringify(analysisData)}` }
      ];

      console.log("Mensajes enviados a OpenAI:", messages);

      // Enviar solicitud a OpenAI
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

      console.log("Respuesta de OpenAI:", openaiResponse.data);

      res.json(openaiResponse.data.choices[0].message.content.trim());

  } catch (error) {
      console.error("Error en análisis:", error.message, error.stack);
      if (error.response) {
          console.error("Respuesta de OpenAI:", error.response.data);
      }
      res.status(500).json({ error: "Error al procesar la solicitud." });
  }
});