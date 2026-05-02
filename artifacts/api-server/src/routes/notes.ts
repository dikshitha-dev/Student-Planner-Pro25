import { Router } from "express";
import { db } from "@workspace/db";
import { notesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import { authenticate } from "../middlewares/authenticate.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req, res) => {
  const userId = req.user!.userId;
  const notes = await db
    .select()
    .from(notesTable)
    .where(eq(notesTable.userId, userId))
    .orderBy(desc(notesTable.createdAt));

  res.json(
    notes.map((n) => ({
      id: n.id,
      userId: n.userId,
      title: n.title,
      originalText: n.originalText,
      summary: n.summary,
      createdAt: n.createdAt.toISOString(),
    }))
  );
});

router.post("/", async (req, res) => {
  const userId = req.user!.userId;
  const { title, originalText } = req.body as {
    title: string;
    originalText: string;
  };

  if (!title || !originalText) {
    res.status(400).json({ error: "Title and text are required" });
    return;
  }

  // Generate summary using OpenAI
  let summary = "";
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 512,
      messages: [
        {
          role: "system",
          content:
            "You are a concise study assistant. Summarize the provided text into key bullet points and a brief overview. Keep it under 200 words. Format with a 1-2 sentence overview followed by bullet points.",
        },
        {
          role: "user",
          content: `Summarize this text:\n\n${originalText}`,
        },
      ],
    });
    summary = response.choices[0]?.message?.content ?? "Summary unavailable";
  } catch (err) {
    summary = "Summary could not be generated at this time.";
  }

  const [note] = await db
    .insert(notesTable)
    .values({ userId, title, originalText, summary })
    .returning();

  if (!note) {
    res.status(500).json({ error: "Failed to create note" });
    return;
  }

  res.status(201).json({
    id: note.id,
    userId: note.userId,
    title: note.title,
    originalText: note.originalText,
    summary: note.summary,
    createdAt: note.createdAt.toISOString(),
  });
});

router.get("/:id", async (req, res) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const [note] = await db
    .select()
    .from(notesTable)
    .where(and(eq(notesTable.id, id!), eq(notesTable.userId, userId)))
    .limit(1);

  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  res.json({
    id: note.id,
    userId: note.userId,
    title: note.title,
    originalText: note.originalText,
    summary: note.summary,
    createdAt: note.createdAt.toISOString(),
  });
});

router.delete("/:id", async (req, res) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  await db
    .delete(notesTable)
    .where(and(eq(notesTable.id, id!), eq(notesTable.userId, userId)));

  res.status(204).send();
});

export default router;
