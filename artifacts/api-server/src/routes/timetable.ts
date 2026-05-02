import { Router } from "express";
import { db } from "@workspace/db";
import { timetableEntriesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authenticate } from "../middlewares/authenticate.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req, res) => {
  const userId = req.user!.userId;
  const entries = await db
    .select()
    .from(timetableEntriesTable)
    .where(eq(timetableEntriesTable.userId, userId));

  res.json(
    entries.map((e) => ({
      id: e.id,
      userId: e.userId,
      subjectName: e.subjectName,
      dayOfWeek: e.dayOfWeek,
      startTime: e.startTime,
      endTime: e.endTime,
      color: e.color,
      createdAt: e.createdAt.toISOString(),
    }))
  );
});

router.post("/", async (req, res) => {
  const userId = req.user!.userId;
  const { subjectName, dayOfWeek, startTime, endTime, color } = req.body as {
    subjectName: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    color: string;
  };

  const [entry] = await db
    .insert(timetableEntriesTable)
    .values({ userId, subjectName, dayOfWeek, startTime, endTime, color })
    .returning();

  if (!entry) {
    res.status(500).json({ error: "Failed to create timetable entry" });
    return;
  }

  res.status(201).json({
    id: entry.id,
    userId: entry.userId,
    subjectName: entry.subjectName,
    dayOfWeek: entry.dayOfWeek,
    startTime: entry.startTime,
    endTime: entry.endTime,
    color: entry.color,
    createdAt: entry.createdAt.toISOString(),
  });
});

router.put("/:id", async (req, res) => {
  const userId = req.user!.userId;
  const { id } = req.params;
  const { subjectName, dayOfWeek, startTime, endTime, color } = req.body as {
    subjectName?: string;
    dayOfWeek?: number;
    startTime?: string;
    endTime?: string;
    color?: string;
  };

  const updates: Record<string, unknown> = {};
  if (subjectName !== undefined) updates.subjectName = subjectName;
  if (dayOfWeek !== undefined) updates.dayOfWeek = dayOfWeek;
  if (startTime !== undefined) updates.startTime = startTime;
  if (endTime !== undefined) updates.endTime = endTime;
  if (color !== undefined) updates.color = color;

  const [entry] = await db
    .update(timetableEntriesTable)
    .set(updates)
    .where(
      and(eq(timetableEntriesTable.id, id!), eq(timetableEntriesTable.userId, userId))
    )
    .returning();

  if (!entry) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }

  res.json({
    id: entry.id,
    userId: entry.userId,
    subjectName: entry.subjectName,
    dayOfWeek: entry.dayOfWeek,
    startTime: entry.startTime,
    endTime: entry.endTime,
    color: entry.color,
    createdAt: entry.createdAt.toISOString(),
  });
});

router.delete("/:id", async (req, res) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  await db
    .delete(timetableEntriesTable)
    .where(
      and(eq(timetableEntriesTable.id, id!), eq(timetableEntriesTable.userId, userId))
    );

  res.status(204).send();
});

export default router;
