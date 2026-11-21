// Express application: middleware pipeline and route mounting
const express = require("express");
const { getDb } = require("./config/db");
const requestLogger = require("./middleware/logger");
const { notFound, errorHandler } = require("./middleware/errors");

const app = express();
app.disable("x-powered-by");

app.use(express.json({ limit: "100kb" }));   // parses JSON bodies into req.body
app.use(requestLogger);

app.get("/api/health", async (req, res) => {
  await getDb().command({ ping: 1 });
  res.json({ status: "ok", database: "connected", uptimeSeconds: Math.round(process.uptime()) });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/incidents", require("./routes/incidents"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/admin", require("./routes/admin"));

app.use("/api", notFound);
app.use(errorHandler);

module.exports = app;