const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('⚠️ Warning: GEMINI_API_KEY is not defined in environment variables.');
}

const genAI = new GoogleGenerativeAI(apiKey || 'DUMMY_KEY');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

module.exports = { model };
