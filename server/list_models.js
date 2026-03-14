const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            const geminiModels = data.models
                .filter(m => m.name.includes('gemini'))
                .map(m => m.name);
            console.log("Available Gemini Models:");
            console.log(geminiModels.join('\n'));
        } else {
            console.log("No models found or error:", data);
        }

    } catch (error) {
        console.error(error);
    }
}

listModels();
