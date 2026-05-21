import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import request from "supertest";

process.env.JWT_SECRET = "test-secret";
process.env.CLIENT_URL = "http://localhost:5173";

const prismaMock = {
  user: { findUnique: jest.fn() },
  job: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  activityLog: { create: jest.fn(), findMany: jest.fn() },
  candidate: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
  hireApplication: { findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn(), groupBy: jest.fn() },
  jobApplication: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
};

jest.unstable_mockModule("../config/prisma.js", () => ({ default: prismaMock }));

const { default: app } = await import("../app.js");

const recruiterToken = jwt.sign({ userId: "rec-1" }, process.env.JWT_SECRET);
const recruiterHeader = { Authorization: `Bearer ${recruiterToken}` };

describe("Jobs API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.user.findUnique.mockResolvedValue({
      id: "rec-1",
      name: "Recruiter",
      email: "rec@mail.com",
      role: "RECRUITER",
      candidate: null,
    });
  });

  test("creates a job as recruiter", async () => {
    prismaMock.job.create.mockResolvedValue({
      id: "job-1",
      title: "Backend Developer",
      status: "OPEN",
      recruiterId: "rec-1",
      recruiter: { id: "rec-1", name: "Recruiter", email: "rec@mail.com" },
    });
    prismaMock.activityLog.create.mockResolvedValue({ id: "log-1" });

    const response = await request(app)
      .post("/api/jobs")
      .set(recruiterHeader)
      .send({ title: "Backend Developer", status: "OPEN" });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe("Backend Developer");
  });

  test("lists open jobs for candidates", async () => {
    const candidateToken = jwt.sign({ userId: "cand-user" }, process.env.JWT_SECRET);

    prismaMock.user.findUnique.mockResolvedValue({
      id: "cand-user",
      name: "Candidate",
      email: "cand@mail.com",
      role: "CANDIDATE",
      candidate: { id: "cand-1" },
    });

    prismaMock.job.findMany.mockResolvedValue([
      { id: "job-1", title: "Frontend Dev", status: "OPEN", recruiterId: "rec-1", _count: { applications: 1 } },
    ]);

    const response = await request(app)
      .get("/api/jobs")
      .set("Authorization", `Bearer ${candidateToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(prismaMock.job.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "OPEN" }),
      }),
    );
  });
});
