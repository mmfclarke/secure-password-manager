const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      masterPasswordHash: hashedPassword,
    });

    res.status(201).json({
      message: "User created",
      userId: user._id
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if account is locked 
    if (user.lockoutUntil && user.lockoutUntil > Date.now()) {
      return res.status(403).json({
        message: "Account locked due to too many failed attempts. Try again later."
      });
    }

    // Reset lockout if expired
    if (user.lockoutUntil && user.lockoutUntil <= Date.now()) {
      user.failedLoginAttempts = 0;
      user.lockoutUntil = null;
      await user.save();
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.masterPasswordHash);

    if (!isMatch) {
      const updated = await User.findOneAndUpdate(
        { _id: user._id },
        { $inc: { failedLoginAttempts: 1 } },
        { new: true }
    );

    if (updated.failedLoginAttempts >= 5) {
      updated.lockoutUntil = Date.now() + 15 * 60 * 1000;
      await updated.save();

      return res.status(403).json({
        message: "Account locked due to too many failed attempts."
      });
    }

  return res.status(401).json({ message: "Invalid credentials" });
}
    // Successful login and reset counters
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;

    await user.save();

    // MFA logic
    if (user.mfaEnabled) {
      return res.json({ requireMFA: true, userId: user._id });
    }

    return res.json({ requireMFASetup: true, userId: user._id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;