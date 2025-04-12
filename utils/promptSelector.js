// utils/promptSelector.js

const fs = require("fs").promises;
const path = require("path");
const KEYWORDS = require("./keywords");

const promptsCache = {};

function normalizarTexto(texto) {
  return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function detectarCategoria(mensaje) {
  const limpio = normalizarTexto(mensaje);
  for (const [tipo, lista] of Object.entries(KEYWORDS)) {
    if (lista.some(palabra => limpio.includes(palabra))) {
      return tipo;
    }
  }
  return "technical"; // Fallback
}

async function obtenerPromptPorMensaje(mensaje) {
  const categoria = detectarCategoria(mensaje);
  const archivo = `${categoria}_prompts.json`;
  const ruta = path.join(__dirname, "../data", archivo);

  if (promptsCache[categoria]) {
    return { categoria, prompts: promptsCache[categoria] };
  }

  try {
    const data = await fs.readFile(ruta, "utf8");
    const json = JSON.parse(data);
    promptsCache[categoria] = json;
    return { categoria, prompts: json };
  } catch (err) {
    console.error("Error al leer el archivo de prompts:", err);
    return { categoria: "technical", prompts: [] };
  }
}

module.exports = {
  obtenerPromptPorMensaje,
  detectarCategoria,
};

