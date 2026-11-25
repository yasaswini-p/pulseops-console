// Entry point: connect to MongoDB, then start Express
const app = require("./app");
const { connect, close } = require("./config/db");

const PORT = process.env.PORT || 4000;

connect()
  .then(() => {
    console.log("✔ Connected to MongoDB as pulse_console");
    const server = app.listen(PORT, () => {
      const { react, angular } = app.locals.frontends;
      console.log(`✔ PulseOps Console running on port ${PORT}`);
      console.log(`  API               http://localhost:${PORT}/api/health`);
      console.log(`  Manager dashboard ${react ? `http://localhost:${PORT}/` : "(not built — run npm run build)"}`);
      console.log(`  Operator console  ${angular ? `http://localhost:${PORT}/console/` : "(not built — run npm run build)"}`);
    });

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