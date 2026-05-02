import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import habitsRouter from "./habits.js";
import notesRouter from "./notes.js";
import plannerRouter from "./planner.js";
import timetableRouter from "./timetable.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/habits", habitsRouter);
router.use("/notes", notesRouter);
router.use("/planner", plannerRouter);
router.use("/timetable", timetableRouter);

export default router;
