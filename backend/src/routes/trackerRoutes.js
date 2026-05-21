import express from "express";
import protect from "../middlewares/authMiddleware.js";
import {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
  getApplicationStats,
  exportApplicationsCsv,
  exportApplicationsPdf,
  emailApplication,
} from "../controllers/applicationController.js";

const router = express.Router();

router.use(protect);

router.get("/stats", getApplicationStats);
router.get("/export/csv", exportApplicationsCsv);
router.get("/export/pdf", exportApplicationsPdf);

router.route("/").post(createApplication).get(getApplications);
router
  .route("/:id")
  .get(getApplicationById)
  .put(updateApplication)
  .delete(deleteApplication);

router.post("/:id/email", emailApplication);

export default router;
