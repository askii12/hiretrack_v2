import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import request from "supertest";

process.env.JWT_SECRET = "test-secret";
process.env.CLIENT_URL = "http://localhost:5173";

const prismaMock = {
  user: { findUnique: jest.fn() },
  candidate: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  activityLog: { create: jest.fn(), findMany: jest.fn() },
  job: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
  hireApplication: { findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn(), groupBy: jest.fn() },
  jobApplication: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
};

jest.unstable_mockModule("../config/prisma.js", () => ({ default: prismaMock }));

const { default: app } = await import("../app.js");

const adminToken = jwt.sign({ userId: "admin-1" }, process.env.JWT_SECRET);
const adminHeader = { Authorization: `Bearer ${adminToken}` };

describe("Candidates API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.user.findUnique.mockResolvedValue({
      id: "admin-1",
      name: "Admin",
      email: "admin@mail.com",
      role: "ADMIN",
      candidate: null,
    });
  });

  test("creates a candidate as admin", async () => {
    prismaMock.candidate.create.mockResolvedValue({
      id: "cand-1",
      name: "Jane Doe",
      email: "jane@mail.com",
    });
    prismaMock.activityLog.create.mockResolvedValue({ id: "log-1" });

    const response = await request(app)
      .post("/api/candidates")
      .set(adminHeader)
      .send({ name: "Jane Doe", email: "jane@mail.com", skills: "React, Node.js" });

    expect(response.status).toBe(201);
    expect(response.body.email).toBe("jane@mail.com");
  });

  test("lists candidates for recruiter", async () => {
    prismaMock.candidate.findMany.mockResolvedValue([
      { id: "cand-1", name: "Jane Doe", email: "jane@mail.com", _count: { applications: 2 } },
    ]);

    const response = await request(app).get("/api/candidates").set(adminHeader);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });
});
