import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import request from "supertest";

process.env.JWT_SECRET = "test-secret";
process.env.CLIENT_URL = "http://localhost:5173";

const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  activityLog: { create: jest.fn(), findMany: jest.fn() },
  job: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
  candidate: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
  hireApplication: { findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn(), groupBy: jest.fn() },
  jobApplication: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
};

jest.unstable_mockModule("../config/prisma.js", () => ({ default: prismaMock }));

const { default: app } = await import("../app.js");

describe("Auth API", () => {
  beforeEach(() => jest.clearAllMocks());

  test("rejects registration when required fields are missing", async () => {
    const response = await request(app).post("/api/auth/register").send({ email: "test@mail.com" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("All fields are required");
  });

  test("registers the first user as admin", async () => {
    prismaMock.user.count.mockResolvedValue(0);
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: "admin-1",
      name: "Admin",
      email: "admin@mail.com",
      password: "hashed",
      role: "ADMIN",
      candidate: null,
    });

    const response = await request(app).post("/api/auth/register").send({
      name: "Admin",
      email: "admin@mail.com",
      password: "123456",
    });

    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe("ADMIN");
    expect(response.body.token).toBeDefined();
  });

  test("logs in an existing user", async () => {
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash("123456", 10);

    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      name: "Recruiter",
      email: "rec@mail.com",
      password: hashedPassword,
      role: "RECRUITER",
      candidate: null,
    });

    const response = await request(app).post("/api/auth/login").send({
      email: "rec@mail.com",
      password: "123456",
    });

    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe("RECRUITER");
    expect(response.body.token).toBeDefined();
  });

  test("returns current user profile", async () => {
    const token = jwt.sign({ userId: "user-1" }, process.env.JWT_SECRET);

    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      name: "Nurlan",
      email: "nurlan@mail.com",
      role: "CANDIDATE",
      candidate: { id: "cand-1" },
    });

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user.candidateId).toBe("cand-1");
  });
});
