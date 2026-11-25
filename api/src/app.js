// Express application: API routes, plus the built front-ends in production
const path = require("path");
const fs = require("fs");
const express = require("express");
const { getDb } = require("./config/db");
const requestLogger = require("./middleware/logger");
const { notFound, errorHandler } = require("./middleware/errors");

const app = express();
app.disable("x-powered-by");

app.use(express.json({ limit: "100kb" }));
app.use(requestLogger);

// ---------- REST API ----------
app.get("/api/health", async (req, res) => {
  await getDb().command({ ping: 1 });
  res.json({ status: "ok", database: "connected", uptimeSeconds: Math.round(process.uptime()) });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/incidents", require("./routes/incidents"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api", notFound);   // unknown API routes return JSON 404, never a web page

// ---------- Built front-ends (only if they have been built) ----------
const REACT_DIR = path.join(__dirname, "../../web/dist");
const ANGULAR_DIR = [
  path.join(__dirname, "../../admin/dist/admin/browser"),
  path.join(__dirname, "../../admin/dist/admin")
].find(dir => fs.existsSync(path.join(dir, "index.html")));

app.locals.frontends = { react: false, angular: false };

// Angular operator console at /console
if (ANGULAR_DIR) {
  app.use("/console", express.static(ANGULAR_DIR));
  // Any /console/... route the browser asks for is handled by Angular's router
  app.get("/console/{*path}", (req, res) => res.sendFile(path.join(ANGULAR_DIR, "index.html")));
  app.locals.frontends.angular = true;
}

// React manager dashboard at /
if (fs.existsSync(path.join(REACT_DIR, "index.html"))) {
  app.use(express.static(REACT_DIR));
  app.get("/{*path}", (req, res) => res.sendFile(path.join(REACT_DIR, "index.html")));
  app.locals.frontends.react = true;
}

app.use(errorHandler);

module.exports = app;