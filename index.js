const express = require("express");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Servidor Alexa GPT (HF) activo");
});

app.post("/ask", async (req, res) => {
  try {
    const question = req.body.question || "Hola";

    const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "katanemo/Arch-Router-1.5B:hf-inference",
        messages: [
          {
            role: "system",
            content: "Responde en espanol, breve y claro."
          },
          {
            role: "user",
            content: question
          }
        ],
        max_tokens: 120,
        temperature: 0.7
      })
    });

    const text = await response.text();
    console.log("HF RAW:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(500).json({ error: "HF devolvio algo que no es JSON" });
    }

    if (!response.ok) {
      return res.status(500).json({
        error: data.error || data.message || "Error de HuggingFace"
      });
    }

    const answer =
      data.choices?.[0]?.message?.content ||
      "No pude responder.";

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
