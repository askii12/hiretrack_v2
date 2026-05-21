import express from "express";
import protect from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  exportJobsCsv,
} from "../controllers/jobController.js";

const router = express.Router();

router.use(protect);

router.get("/export/csv", authorize("ADMIN", "RECRUITER"), exportJobsCsv);
router
  .route("/")
  .get(getJobs)
  .post(authorize("ADMIN", "RECRUITER"), createJob);
router
  .route("/:id")
  .get(getJobById)
  .put(authorize("ADMIN", "RECRUITER"), updateJob)
  .delete(authorize("ADMIN", "RECRUITER"), deleteJob);

export default router;
