{/*Phase 2: API & Frontend Integration*/}

import express from "express";
import { handleLLMQuery } from "../services/llmService";
import { z } from "zod";

const router = express.Router();

const QuerySchema = z.object({
  meterId: z.string(),
  question: z.string().min(3),
});

router.post("/query", async (req, res) => {
  try {
    const validated = QuerySchema.parse(req.body);
    const answer = await handleLLMQuery(validated);
    res.json({ answer });
  } catch (error) {
    console.error("LLM Error:", error);
    res.status(400).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

export default router;