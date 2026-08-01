const { GoogleGenerativeAI } = require("@google/generative-ai");

// Paste your actual Gemini API key here
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "your_api_key_here");

async function main() {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const result = await model.generateContent("Hello");
    console.log(result.response.text());
  } catch (err) {
    console.error(err);
  }
}

main();
