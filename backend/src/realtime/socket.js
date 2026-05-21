import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

export const initSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Missing auth token"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user) return next(new Error("User not found"));

      socket.user = { id: user.id, email: user.email, name: user.name };
      next();
    } catch (error) {
      next(new Error("Invalid auth token"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.user.id}`);
    socket.emit("notification", {
      id: crypto.randomUUID(),
      type: "SYSTEM",
      title: "Connected to real-time updates",
      message: "HireTrack notifications are active.",
      createdAt: new Date().toISOString(),
    });
  });
};
