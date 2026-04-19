const express = require("express");
const Alexa = require("ask-sdk-core");
const { ExpressAdapter } = require("ask-sdk-express-adapter");

const app = express();

// --------- Tu funcion IA ----------
async function preguntarIA(question) {
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
          content: "Responde en espanol, breve, clara y natural."
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
    throw new Error("HF no devolvio JSON");
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || "Error de HuggingFace");
  }

  return data.choices?.[0]?.message?.content || "No pude responder.";
}

// --------- Alexa handlers ----------
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest";
  },
  handle(handlerInput) {
    const speakOutput = "Hola, soy tu asistente virtual. Puedes decir, pregunta que es un transistor.";
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt("Di tu pregunta.")
      .getResponse();
  }
};

const PreguntaIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
      && Alexa.getIntentName(handlerInput.requestEnvelope) === "PreguntaIntent";
  },
  async handle(handlerInput) {
    const pregunta =
      handlerInput.requestEnvelope.request.intent.slots?.pregunta?.value || "hola";

    try {
      const respuesta = await preguntarIA(pregunta);

      return handlerInput.responseBuilder
        .speak(respuesta)
        .reprompt("Puedes hacer otra pregunta.")
        .getResponse();
    } catch (error) {
      console.error("ERROR IA:", error);
      return handlerInput.responseBuilder
        .speak("Hubo un problema consultando la inteligencia artificial.")
        .getResponse();
    }
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
      && Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.HelpIntent";
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak("Puedes decir, pregunta que es un transistor.")
      .reprompt("Di tu pregunta.")
      .getResponse();
  }
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
      && (
        Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.CancelIntent" ||
        Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.StopIntent"
      );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak("Hasta luego.")
      .getResponse();
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.error("ERROR ALEXA:", error);
    return handlerInput.responseBuilder
      .speak("Lo siento, ocurrio un error.")
      .getResponse();
  }
};

const skill = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    PreguntaIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler
  )
  .addErrorHandlers(ErrorHandler)
  .create();

const adapter = new ExpressAdapter(skill, false, false);

app.get("/", (req, res) => {
  res.send("Servidor Alexa activo");
});

// Endpoint para Alexa
app.post("/alexa", adapter.getRequestHandlers());

// Tu endpoint actual de prueba
app.post("/ask", express.json(), async (req, res) => {
  try {
    const question = req.body.question || "Hola";
    const answer = await preguntarIA(question);
    res.json({ answer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error con HuggingFace" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Servidor corriendo en puerto", port);
});
