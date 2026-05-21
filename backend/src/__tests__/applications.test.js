import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import request from "supertest";

process.env.JWT_SECRET = "test-secret";
process.env.CLIENT_URL = "http://localhost:5173";

const prismaMock = {
  user: { findUnique: jest.fn(), findMany: jest.fn() },
  job: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
  candidate: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
  hireApplication: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  activityLog: { create: jest.fn(), findMany: jest.fn() },
  jobApplication: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
};

jest.unstable_mockModule("../config/prisma.js", () => ({ default: prismaMock }));
jest.unstable_mockModule("../utils/notifications.js", () => ({
  notifyRecruitersForJob: jest.fn(),
  dispatchHireNotification: jest.fn(),
}));

const { default: app } = await import("../app.js");

const candidateToken = jwt.sign({ userId: "cand-user" }, process.env.JWT_SECRET);
const candidateHeader = { Authorization: `Bearer ${candidateToken}` };

describe("Hire applications API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.user.findUnique.mockResolvedValue({
      id: "cand-user",
      name: "Candidate",
      email: "cand@mail.com",
      role: "CANDIDATE",
      candidate: { id: "cand-1" },
    });
  });

  test("requires authentication", async () => {
    const response = await request(app).get("/api/applications");
    expect(response.status).toBe(401);
  });

  test("candidate applies to an open job", async () => {
    prismaMock.job.findUnique.mockResolvedValue({
      id: "job-1",
      title: "Backend Developer",
      status: "OPEN",
      recruiterId: "rec-1",
    });
    prismaMock.hireApplication.findUnique.mockResolvedValue(null);
    prismaMock.hireApplication.create.mockResolvedValue({
      id: "ha-1",
      jobId: "job-1",
      candidateId: "cand-1",
      status: "APPLIED",
      job: { id: "job-1", title: "Backend Developer", status: "OPEN", recruiterId: "rec-1" },
      candidate: { id: "cand-1", name: "Candidate", email: "cand@mail.com", skills: "Node.js" },
    });
    prismaMock.activityLog.create.mockResolvedValue({ id: "log-1" });
    prismaMock.user.findMany.mockResolvedValue([]);

    const response = await request(app)
      .post("/api/applications")
      .set(candidateHeader)
      .send({ jobId: "job-1", coverLetter: "I am interested" });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("APPLIED");
    expect(prismaMock.hireApplication.create).toHaveBeenCalled();
  });

  test("recruiter updates application status to interview", async () => {
    const recruiterToken = jwt.sign({ userId: "rec-1" }, process.env.JWT_SECRET);

    prismaMock.user.findUnique.mockResolvedValue({
      id: "rec-1",
      name: "Recruiter",
      email: "rec@mail.com",
      role: "RECRUITER",
      candidate: null,
    });

    prismaMock.hireApplication.findUnique.mockResolvedValue({
      id: "ha-1",
      jobId: "job-1",
      candidateId: "cand-1",
      status: "APPLIED",
      interviewAt: null,
      job: { id: "job-1", title: "Backend Developer", recruiterId: "rec-1" },
      candidate: { id: "cand-1", name: "Candidate", email: "cand@mail.com", userId: "cand-user" },
    });

    prismaMock.hireApplication.update.mockResolvedValue({
      id: "ha-1",
      jobId: "job-1",
      candidateId: "cand-1",
      status: "INTERVIEW",
      interviewAt: null,
      job: { id: "job-1", title: "Backend Developer", recruiterId: "rec-1" },
      candidate: { id: "cand-1", name: "Candidate", email: "cand@mail.com", userId: "cand-user" },
    });

    prismaMock.activityLog.create.mockResolvedValue({ id: "log-1" });
    prismaMock.user.findMany.mockResolvedValue([]);

    const response = await request(app)
      .put("/api/applications/ha-1")
      .set("Authorization", `Bearer ${recruiterToken}`)
      .send({ status: "INTERVIEW" });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("INTERVIEW");
  });
});
