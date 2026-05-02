import { Router } from "express";
import { db } from "@workspace/db";
import { habitLogsTable } from "@workspace/db";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { authenticate } from "../middlewares/authenticate.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req, res) => {
  const userId = req.user!.userId;
  const { startDate, endDate } = req.query as {
    startDate?: string;
    endDate?: string;
  };

  let query = db
    .select()
    .from(habitLogsTable)
    .where(eq(habitLogsTable.userId, userId));

  const conditions = [eq(habitLogsTable.userId, userId)];
  if (startDate) conditions.push(gte(habitLogsTable.date, startDate));
  if (endDate) conditions.push(lte(habitLogsTable.date, endDate));

  const logs = await db
    .select()
    .from(habitLogsTable)
    .where(and(...conditions))
    .orderBy(desc(habitLogsTable.date));

  res.json(
    logs.map((l) => ({
      id: l.id,
      userId: l.userId,
      date: l.date,
      studyHours: l.studyHours,
      waterIntake: l.waterIntake,
      sleepHours: l.sleepHours,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    }))
  );
});

router.post("/", async (req, res) => {
  const userId = req.user!.userId;
  const { date, studyHours, waterIntake, sleepHours } = req.body as {
    date: string;
    studyHours: number;
    waterIntake: number;
    sleepHours: number;
  };

  const existing = await db
    .select()
    .from(habitLogsTable)
    .where(and(eq(habitLogsTable.userId, userId), eq(habitLogsTable.date, date)))
    .limit(1);

  let log;
  if (existing.length > 0) {
    const [updated] = await db
      .update(habitLogsTable)
      .set({ studyHours, waterIntake, sleepHours, updatedAt: new Date() })
      .where(eq(habitLogsTable.id, existing[0]!.id))
      .returning();
    log = updated;
  } else {
    const [created] = await db
      .insert(habitLogsTable)
      .values({ userId, date, studyHours, waterIntake, sleepHours })
      .returning();
    log = created;
  }

  if (!log) {
    res.status(500).json({ error: "Failed to save habit log" });
    return;
  }

  res.json({
    id: log.id,
    userId: log.userId,
    date: log.date,
    studyHours: log.studyHours,
    waterIntake: log.waterIntake,
    sleepHours: log.sleepHours,
    createdAt: log.createdAt.toISOString(),
    updatedAt: log.updatedAt.toISOString(),
  });
});

router.get("/streak", async (req, res) => {
  const userId = req.user!.userId;

  const logs = await db
    .select({ date: habitLogsTable.date })
    .from(habitLogsTable)
    .where(eq(habitLogsTable.userId, userId))
    .orderBy(desc(habitLogsTable.date));

  const dates = logs.map((l) => l.date).sort().reverse();
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < dates.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().split("T")[0];

    if (dates[i] === expectedStr) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Calculate longest streak
  for (let i = 0; i < dates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prev = new Date(dates[i - 1]!);
      const curr = new Date(dates[i]!);
      const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  res.json({
    currentStreak,
    longestStreak,
    lastActiveDate: dates[0] ?? null,
  });
});

router.get("/weekly", async (req, res) => {
  const userId = req.user!.userId;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekAgoStr = weekAgo.toISOString().split("T")[0]!;

  const logs = await db
    .select()
    .from(habitLogsTable)
    .where(
      and(
        eq(habitLogsTable.userId, userId),
        gte(habitLogsTable.date, weekAgoStr)
      )
    )
    .orderBy(habitLogsTable.date);

  // Fill in missing days with zeros
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0]!;
    const log = logs.find((l) => l.date === dateStr);
    result.push({
      date: dateStr,
      studyHours: log?.studyHours ?? 0,
      waterIntake: log?.waterIntake ?? 0,
      sleepHours: log?.sleepHours ?? 0,
    });
  }

  res.json(result);
});

export default router;
