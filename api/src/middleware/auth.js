// Authentication (who are you?) and authorisation (are you allowed?) middleware
const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const [scheme, token] = (req.get("Authorization") || "").split(" ");
  if (scheme !== "Bearer" || !token) return res.status(401).json({ error: "Login required" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);   // attaches { sub, name, role, team }
    next();
  } catch {
    res.status(401).json({ error: "Session expired or invalid. Please log in again." });
  }
}

const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role)
    ? next()
    : res.status(403).json({ error: `This action requires the ${roles.join(" or ")} role` });

module.exports = { requireAuth, requireRole };