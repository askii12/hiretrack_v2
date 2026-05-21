import express from "express";
import protect from "../middlewares/authMiddleware.js";
import {
  generateJobDescription,
  matchResume,
  analyzeCandidateSkills,
} from "../controllers/aiController.js";

const router = express.Router();

router.use(protect);
router.post("/job-description", generateJobDescription);
router.post("/resume-match", matchResume);
router.post("/skill-analysis", analyzeCandidateSkills);

export default router;
