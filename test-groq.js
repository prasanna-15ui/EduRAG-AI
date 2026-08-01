const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "your_api_key_here" });

async function main() {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: "hello" }],
      model: "llama3-8b-8192",
    });
    console.log("Success:", chatCompletion.choices[0].message.content);
  } catch (error) {
    console.error("Error:", error.message);
  }
}
main();
