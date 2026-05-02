import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const timetableEntriesTable = pgTable("timetable_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  subjectName: text("subject_name").notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  color: text("color").notNull().default("#6366F1"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTimetableEntrySchema = createInsertSchema(timetableEntriesTable).omit({ id: true, createdAt: true });
export type InsertTimetableEntry = z.infer<typeof insertTimetableEntrySchema>;
export type TimetableEntry = typeof timetableEntriesTable.$inferSelect;
