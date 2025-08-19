// gemini.js

// This file handles all interactions with the Google Gemini API.
// It uses the official Google Generative AI JavaScript SDK.

import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

const GEMINI_API_KEY = "AIzaSyDpwjd5WndEmXUEy1DiYZUILNht7qpI-6A";

/**
 * Initializes the Gemini model client.
 * @returns {import('@google/generative-ai').GenerativeModel | null} The GenerativeModel instance or null if the API key is missing.
 */
function getGeminiModel() {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_API_KEY') {
        console.error("Gemini API key is not configured. Please add your API key to gemini.js.");
        return null;
    }
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    return genAI.getGenerativeModel({ model: "gemini-pro" });
}

/**
 * Sends a prompt to the Gemini API and returns the generated text.
 * @param {string} prompt The text prompt to send to the model.
 * @returns {Promise<string>} A promise that resolves with the generated text, or rejects with an error.
 */
export async function generateText(prompt) {
    const model = getGeminiModel();
    if (!model) {
        throw new Error("Gemini API is not available due to missing configuration.");
    }
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return text;
    } catch (error) {
        console.error("Error calling the Gemini API:", error);
        throw new Error("Failed to generate content. Please try again later.");
    }
}
