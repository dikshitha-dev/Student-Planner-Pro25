import { pgTable, text, timestamp, uuid, integer, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const plannerSubjectsTable = pgTable("planner_subjects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  examDate: date("exam_date").notNull(),
  priority: integer("priority").notNull().default(1),
  hoursNeeded: real("hours_needed").notNull().default(2),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPlannerSubjectSchema = createInsertSchema(plannerSubjectsTable).omit({ id: true, createdAt: true });
export type InsertPlannerSubject = z.infer<typeof insertPlannerSubjectSchema>;
export type PlannerSubject = typeof plannerSubjectsTable.$inferSelect;
