 const OpenAI = require("openai");

 const client = new OpenAI({
   apiKey: process.env.OPENAI_API_KEY });

 async function getEmbedding(text) {
  const res = await client.embeddings.create({
    model: "text-embedding-3-small",
   input: text
  });
  return res.data[0].embedding;
}
 module.exports = { getEmbedding };

// services/embedding.service.js
/*const axios = require("axios");

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

async function getEmbedding(text) {
  try {
    const response = await axios.post(
      "https://openrouter.ai/v1/embeddings", // OpenRouter endpoint
      {
        model: "text-embedding-3-small", // نفس الموديل متاع OpenAI
        input: text
      },
      {
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    // OpenRouter يعطينا النتيجة هنا
    return response.data.data[0].embedding;
  } catch (err) {
    console.error("OpenRouter embedding error:", err.response?.data || err.message);
    throw new Error("Failed to get embedding from OpenRouter");
  }
}

module.exports = { getEmbedding };*/

// services/embedding.service.js
/*const { OpenRouter } = require("@openrouter/sdk");
require('dotenv').config();

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY
});

async function getEmbedding(text) {
  const prompt = `
Convert this text into an array of 10 numerical values representing semantic vector:
"${text}"
`;

  try {
    const res = await openrouter.chat.send({
      model: "deepseek/deepseek-v3.2",
      messages: [{ role: "user", content: prompt }],
      stream: false
    });

    const output = res.choices[0].message.content;

    // Parse JSON vector
    return JSON.parse(output);
  } catch (err) {
    console.error("OpenRouter embedding error:", err.response?.data || err.message);
    throw new Error("Failed to get embedding from OpenRouter");
  }
}

module.exports = { getEmbedding };*/
/*const { OpenRouter } = require("@openrouter/sdk");
require('dotenv').config();

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY
});

async function getEmbedding(text) {
  const prompt = `
Convert this text into an array of 10 numerical values representing semantic vector:
"${text}"
`;

  try {
    const res = await openrouter.chat.send({
      model: "deepseek/deepseek-v3.2",
      messages: [{ role: "user", content: prompt }],
      stream: false
    });

    const output = res.choices[0].message.content;
    return JSON.parse(output); // vector numerical
  } catch (err) {
    console.error("OpenRouter embedding error:", err.response?.data || err.message);
    throw new Error("Failed to get embedding from OpenRouter");
  }
}

module.exports = { getEmbedding };
*/


