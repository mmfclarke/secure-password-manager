const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const internalAuthMiddleware = require("../middleware/internalAuthMiddleware");

const router = express.Router();

router.use(internalAuthMiddleware);

// Get TOTP secret
router.get("/users/:userId/totp-secret", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("totpSecret");

    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.totpSecret) return res.status(400).json({ message: "TOTP not set up" });

    res.json({ totpSecret: user.totpSecret });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Save TOTP secret
router.put("/users/:userId/totp", async (req, res) => {
  try {
    const { totpSecret } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { totpSecret },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "TOTP secret saved" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Complete MFA and issue JWT
router.post("/users/:userId/complete-mfa", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { mfaEnabled: true },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;