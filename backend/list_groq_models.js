const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function listModels() {
  try {
    const models = await groq.models.list();
    console.log(models.data.map(m => m.id));
  } catch (err) {
    console.error(err);
  }
}
listModels();
