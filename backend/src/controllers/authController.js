import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

const ALLOWED_ROLES = ["ADMIN", "RECRUITER", "CANDIDATE"];

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  candidateId: user.candidate?.id || null,
});

const resolveRole = (requestedRole, actorRole) => {
  if (actorRole === "ADMIN" && requestedRole && ALLOWED_ROLES.includes(requestedRole)) {
    return requestedRole;
  }

  return "CANDIDATE";
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, resume, skills } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const userCount = await prisma.user.count();
    const finalRole =
      userCount === 0 ? "ADMIN" : resolveRole(role, req.user?.role);
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: finalRole,
        ...(finalRole === "CANDIDATE"
          ? {
              candidate: {
                create: {
                  name,
                  email,
                  phone: phone || null,
                  resume: resume || null,
                  skills: skills || null,
                },
              },
            }
          : {}),
      },
      include: { candidate: true },
    });

    const token = generateToken(user.id);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { candidate: true },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user.id);

    res.status(200).json({
      message: "Login successful",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

export const getMe = async (req, res) => {
  res.status(200).json({
    user: req.user,
  });
};
