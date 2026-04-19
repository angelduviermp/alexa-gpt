const express = require("express");
const OpenAI = require("openai");

const app = express();
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("Servidor Alexa GPT activo");
});

app.post("/ask", async (req, res) => {
  try {
    const question = req.body.question || "Hola";
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `Responde en español y de forma breve: ${question}`
    });

    const answer = response.output_text || "No pude responder.";
    res.json({ answer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error consultando OpenAI" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor corriendo en puerto ${port}`);
});
