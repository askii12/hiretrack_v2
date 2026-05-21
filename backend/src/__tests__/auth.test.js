import { jest } from "@jest/globals";
import request from "supertest";

process.env.JWT_SECRET = "test-secret";
process.env.CLIENT_URL = "http://localhost:5173";

const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  jobApplication: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  activityLog: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
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

  test("registers a new user", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: "user-1",
      name: "Nurlan",
      email: "nurlan@mail.com",
      password: "hashed",
    });

    const response = await request(app).post("/api/auth/register").send({
      name: "Nurlan",
      email: "nurlan@mail.com",
      password: "123456",
    });

    expect(response.status).toBe(201);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe("nurlan@mail.com");
  });
});
