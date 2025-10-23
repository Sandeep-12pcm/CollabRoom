import { Router, Request, Response } from "express";
import Groq from "groq-sdk";
const router = Router();
import dotenv from "dotenv";
dotenv.config();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post("/", async (req: Request, res: Response) => {
  try {
    const { code, language, action } = req.body;

    if (!code) {
      return res.status(400).json({ error: "code is required" });
    }

    const userPrompt = `
You are an AI code assistant.
Action: ${action}
Language: ${language}
Code:
${code}
    `;

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are a helpful AI coding assistant." },
        { role: "user", content: userPrompt }
      ]
    });

    const answer = response.choices[0]?.message?.content || "No response";
    res.json({ response: answer });

  } catch (err) {
    console.error("AI Route Error:", err);
    res.status(500).json({ error: "AI route failed", details: (err as Error).message });
  }
});

export default router;
