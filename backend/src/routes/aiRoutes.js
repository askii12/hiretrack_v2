import express from "express";
import protect from "../middlewares/authMiddleware.js";
import { generateJobDescription, matchResume } from "../controllers/aiController.js";

const router = express.Router();

router.use(protect);
router.post("/job-description", generateJobDescription);
router.post("/resume-match", matchResume);

export default router;
