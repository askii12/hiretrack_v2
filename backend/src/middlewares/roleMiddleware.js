export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user?.role) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role ${req.user.role} is not allowed to perform this action`,
      });
    }

    next();
  };
