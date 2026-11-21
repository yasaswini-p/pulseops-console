// Login: verifies the password hash and issues a signed JWT
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getDb } = require("../config/db");
const { ApiError } = require("../middleware/errors");

async function login(req, res) {
  const { username, password } = req.body || {};
  if (!username || !password) throw new ApiError(400, "username and password are required");

  const users = getDb().collection("users");
  const user = await users.findOne({ username: String(username).toLowerCase().trim() });
  const valid = user && (await bcrypt.compare(String(password), user.passwordHash));
  if (!valid) throw new ApiError(401, "Invalid username or password");

  const profile = { sub: user.username, name: user.displayName, role: user.role, team: user.team || null };
  const token = jwt.sign(profile, process.env.JWT_SECRET, { expiresIn: "8h" });
  await users.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });

  res.json({ token, user: profile });
}

function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { login, me };