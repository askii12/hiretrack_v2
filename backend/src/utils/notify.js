export const notifyUser = (req, userId, notification) => {
  const io = req.app.get("io");
  if (!io) return;

  io.to(`user:${userId}`).emit("notification", {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...notification,
  });
};
