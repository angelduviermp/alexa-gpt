const express = require("express");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Servidor Alexa GPT (HF) activo");
});

app.post("/ask", async (req, res) => {
  try {
    const question = req.body.question || "Hola";

    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/google/flan-t5-base",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: question
        })
      }
    );

    const text = await response.text();
    console.log("HF RAW:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(500).json({
        error: "HuggingFace devolvio HTML y no JSON"
      });
    }

    if (data.error) {
      return res.json({
        answer: `HF error: ${data.error}`
      });
    }

    let answer = "No pude responder";

    if (Array.isArray(data)) {
      answer = data[0]?.generated_text || answer;
    }

    res.json({ answer });
  } catch (error) {
    console.error("ERROR HF:", error);
    res.status(500).json({ error: "Error con HuggingFace" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Servidor corriendo en puerto", port);
});
