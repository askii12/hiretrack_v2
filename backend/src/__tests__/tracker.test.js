import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import request from "supertest";

process.env.JWT_SECRET = "test-secret";
process.env.CLIENT_URL = "http://localhost:5173";

const prismaMock = {
  user: { findUnique: jest.fn() },
  jobApplication: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  activityLog: { create: jest.fn(), findMany: jest.fn() },
  job: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
  candidate: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
  hireApplication: { findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn(), groupBy: jest.fn() },
};

jest.unstable_mockModule("../config/prisma.js", () => ({ default: prismaMock }));

const { default: app } = await import("../app.js");

const token = jwt.sign({ userId: "user-1" }, process.env.JWT_SECRET);
const authHeader = { Authorization: `Bearer ${token}` };

describe("Tracker applications API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      name: "Nurlan",
      email: "nurlan@mail.com",
      role: "CANDIDATE",
      candidate: null,
    });
  });

  test("requires authentication", async () => {
    const response = await request(app).get("/api/tracker/applications");
    expect(response.status).toBe(401);
  });

  test("creates a personal tracker application", async () => {
    prismaMock.jobApplication.create.mockResolvedValue({
      id: "app-1",
      companyName: "QB Solutions",
      positionTitle: "Fullstack Developer",
      status: "Applied",
      priority: "High",
      userId: "user-1",
    });
    prismaMock.activityLog.create.mockResolvedValue({ id: "log-1" });

    const response = await request(app)
      .post("/api/tracker/applications")
      .set(authHeader)
      .send({
        companyName: "QB Solutions",
        positionTitle: "Fullstack Developer",
        status: "Applied",
        priority: "High",
      });

    expect(response.status).toBe(201);
    expect(response.body.companyName).toBe("QB Solutions");
  });
});
