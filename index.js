const express = require("express");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Servidor Alexa GPT (HuggingFace) activo");
});

app.post("/ask", async (req, res) => {
  try {
    const question = req.body.question || "Hola";

    const response = await fetch(
      "https://api-inference.huggingface.co/models/google/flan-t5-base",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: question
        })
      }
    );

    const data = await response.json();

    let answer = "No pude responder";

    if (Array.isArray(data)) {
      answer = data[0]?.generated_text || answer;
    }

    res.json({ answer });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error con HuggingFace" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor corriendo en puerto ${port}`);
});
