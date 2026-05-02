import { Router } from "express";
import { db } from "@workspace/db";
import { plannerSubjectsTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { authenticate } from "../middlewares/authenticate.js";

const router = Router();
router.use(authenticate);

router.get("/subjects", async (req, res) => {
  const userId = req.user!.userId;
  const subjects = await db
    .select()
    .from(plannerSubjectsTable)
    .where(eq(plannerSubjectsTable.userId, userId))
    .orderBy(asc(plannerSubjectsTable.examDate));

  res.json(
    subjects.map((s) => ({
      id: s.id,
      userId: s.userId,
      name: s.name,
      examDate: s.examDate,
      priority: s.priority,
      hoursNeeded: s.hoursNeeded,
      createdAt: s.createdAt.toISOString(),
    }))
  );
});

router.post("/subjects", async (req, res) => {
  const userId = req.user!.userId;
  const { name, examDate, priority, hoursNeeded } = req.body as {
    name: string;
    examDate: string;
    priority: number;
    hoursNeeded: number;
  };

  const [subject] = await db
    .insert(plannerSubjectsTable)
    .values({ userId, name, examDate, priority, hoursNeeded })
    .returning();

  if (!subject) {
    res.status(500).json({ error: "Failed to create subject" });
    return;
  }

  res.status(201).json({
    id: subject.id,
    userId: subject.userId,
    name: subject.name,
    examDate: subject.examDate,
    priority: subject.priority,
    hoursNeeded: subject.hoursNeeded,
    createdAt: subject.createdAt.toISOString(),
  });
});

router.delete("/subjects/:id", async (req, res) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  await db
    .delete(plannerSubjectsTable)
    .where(
      and(eq(plannerSubjectsTable.id, id!), eq(plannerSubjectsTable.userId, userId))
    );

  res.status(204).send();
});

router.post("/generate", async (req, res) => {
  const userId = req.user!.userId;

  const subjects = await db
    .select()
    .from(plannerSubjectsTable)
    .where(eq(plannerSubjectsTable.userId, userId))
    .orderBy(asc(plannerSubjectsTable.examDate));

  if (subjects.length === 0) {
    res.json([]);
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the latest exam date
  const latestExam = subjects.reduce((latest, s) => {
    const d = new Date(s.examDate);
    return d > latest ? d : latest;
  }, today);

  const totalDays = Math.max(
    1,
    Math.ceil((latestExam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Build daily plan
  const plan: Array<{
    date: string;
    sessions: Array<{ subjectId: string; subjectName: string; hours: number }>;
  }> = [];

  for (let day = 0; day < Math.min(totalDays, 30); day++) {
    const date = new Date(today);
    date.setDate(date.getDate() + day);
    const dateStr = date.toISOString().split("T")[0]!;

    // Filter subjects still relevant for this day
    const relevantSubjects = subjects.filter((s) => {
      const examDate = new Date(s.examDate);
      return examDate >= date;
    });

    if (relevantSubjects.length === 0) continue;

    const sessions = [];

    if (totalDays <= 3) {
      // Last minute: prioritize by priority score, cap at 2h per subject
      const sorted = [...relevantSubjects].sort((a, b) => b.priority - a.priority);
      for (const s of sorted.slice(0, 3)) {
        sessions.push({
          subjectId: s.id,
          subjectName: s.name,
          hours: Math.min(2, s.hoursNeeded),
        });
      }
    } else {
      // Distribute evenly based on hours needed and days until exam
      for (const s of relevantSubjects) {
        const examDate = new Date(s.examDate);
        const daysLeft = Math.max(
          1,
          Math.ceil((examDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
        );
        const hoursPerDay = s.hoursNeeded / daysLeft;
        if (hoursPerDay > 0.25) {
          sessions.push({
            subjectId: s.id,
            subjectName: s.name,
            hours: Math.round(hoursPerDay * 4) / 4, // round to 15 min
          });
        }
      }
    }

    if (sessions.length > 0) {
      plan.push({ date: dateStr, sessions });
    }
  }

  res.json(plan);
});

export default router;
