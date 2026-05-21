import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import candidateRoutes from "./routes/candidateRoutes.js";
import hireApplicationRoutes from "./routes/hireApplicationRoutes.js";
import trackerRoutes from "./routes/trackerRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(morgan("dev"));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "HireTrack API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/applications", hireApplicationRoutes);
app.use("/api/tracker/applications", trackerRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/stats", statsRoutes);

export default app;
