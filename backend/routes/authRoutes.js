const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");

const router = express.Router();

// INPUT VALIDATION 
function validateAuthInput(body, { strongPassword }) {

  // Ensure request body exists
  if (!body || typeof body !== "object") {
    return "Invalid request body";
  }

  const { email, password } = body;

  // Prevent NoSQL injection / invalid types
  if (typeof email !== "string" || typeof password !== "string") {
    return "Email and password must be strings";
  }

  // Normalize email
  const normalizedEmail = email.trim().toLowerCase();

  // Empty email check
  if (normalizedEmail.length === 0) {
    return "Email is required";

  }

  // Prevent oversized email input
  if (normalizedEmail.length > 254) {
    return "Email is too long";
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return "Invalid email format";
  }

  // Password length limits
  if (password.length < 1 || password.length > 128) {
    return "Invalid password length";
  }

  // Strong password requirements for registration
  if (strongPassword) {

    if (password.length < 12) {
      return "Password must be at least 12 characters long";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return "Password must contain at least one special character";
    }
  }

  return  {
    email: normalizedEmail,
    password
  };
}

// REGISTER
router.post("/register", async (req, res) => {
  try {
    // Validate request input
    const result = validateAuthInput(req.body, {
      strongPassword: true
     });

    // Validation failed
    if (typeof result === "string") {
      return res.status(400).json({ 
        message: result
    });
  }
    const { email, password } = result;

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

    // Validate request input
    const result = validateAuthInput(req.body, {
      strongPassword: false
     });

    // Validation failed
    if (typeof result === "string") {
      return res.status(400).json({
        message: result
    });
  }
    const { email, password } = result;

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
    const isMatch = await bcrypt.compare(
      password, 
      user.masterPasswordHash
    );

    if (!isMatch) {

      // Log failed attempt with email and IP
      console.warn(
        `Failed login attempt for ${email} from IP ${req.ip}`
    );

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