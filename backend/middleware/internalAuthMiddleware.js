const internalAuthMiddleware = (req, res, next) => {
  const secret = req.headers["x-internal-secret"];

  if (!secret || secret !== process.env.TOTP_INTERNAL_SECRET) {
    return res.status(403).json({ message: "Forbidden" });
  }

  next();
};

module.exports = internalAuthMiddleware;
