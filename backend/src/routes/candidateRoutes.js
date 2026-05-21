import express from "express";
import protect from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import {
  createCandidate,
  getCandidates,
  getCandidateById,
  updateCandidate,
  deleteCandidate,
  exportCandidatesPdf,
} from "../controllers/candidateController.js";

const router = express.Router();

router.use(protect);

router.get(
  "/export/pdf",
  authorize("ADMIN", "RECRUITER", "CANDIDATE"),
  exportCandidatesPdf,
);
router
  .route("/")
  .get(getCandidates)
  .post(authorize("ADMIN", "RECRUITER"), createCandidate);
router
  .route("/:id")
  .get(getCandidateById)
  .put(updateCandidate)
  .delete(authorize("ADMIN", "RECRUITER"), deleteCandidate);

export default router;
