import express from "express";
import protect from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { getHiringStats, exportStatsCsv } from "../controllers/statsController.js";

const router = express.Router();

router.use(protect);
router.get("/", authorize("ADMIN", "RECRUITER"), getHiringStats);
router.get("/export/csv", authorize("ADMIN", "RECRUITER"), exportStatsCsv);

export default router;
