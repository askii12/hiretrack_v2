import express from "express";
import protect from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import {
  createHireApplication,
  getHireApplications,
  getHireApplicationById,
  updateHireApplication,
  deleteHireApplication,
} from "../controllers/hireApplicationController.js";

const router = express.Router();

router.use(protect);

router.route("/").get(getHireApplications).post(createHireApplication);
router
  .route("/:id")
  .get(getHireApplicationById)
  .put(authorize("ADMIN", "RECRUITER"), updateHireApplication)
  .delete(deleteHireApplication);

export default router;
