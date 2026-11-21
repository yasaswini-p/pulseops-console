// Entry point: connect to MongoDB, then start Express
const app = require("./app");
const { connect, close } = require("./config/db");

const PORT = process.env.PORT || 4000;

connect()
  .then(() => {
    console.log("✔ Connected to MongoDB as pulse_console");
    const server = app.listen(PORT, () =>
      console.log(`✔ PulseOps Console API running at http://localhost:${PORT}`));

    process.on("SIGINT", async () => {
      console.log("\nShutting down...");
      server.close();
      await close();
      process.exit(0);
    });
  })
  .catch(err => {
    console.error("✖ Startup failed:", err.message);
    process.exit(1);
  });