require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function checkModels() {
    if (!process.env.GEMINI_API_KEY) {
        console.error("Error: GEMINI_API_KEY is not set in .env");
        return;
    }

    try {
        console.log("Using API Key:", process.env.GEMINI_API_KEY.substring(0, 10) + "...");

        // Fetch models using REST API manually if SDK doesn't expose clean listing in this version,
        // OR try to just use a known model and see what happens.
        // But actually, let's try to query the models endpoint via fetch to be sure.

        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Available Models:");
        if (data.models) {
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name} (${m.displayName})`);
                }
            });
        } else {
            console.log("No models returned or format unexpected:", data);
        }

    } catch (error) {
        console.error("Failed to list models:", error);
    }
}

checkModels();
