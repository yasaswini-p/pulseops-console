// Logs every request once the response has been sent
module.exports = function requestLogger(req, res, next) {
  const started = Date.now();
  res.on("finish", () => {
    const who = req.user ? ` [${req.user.sub}]` : "";
    console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - started} ms)${who}`);
  });
  next();
};