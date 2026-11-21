// Creates demo login accounts with bcrypt-hashed passwords (safe to re-run)
const bcrypt = require("bcryptjs");
const { MongoClient } = require("mongodb");

const USERS = [
  { username: "meera", displayName: "Meera Nair",   role: "manager",  team: null,  password: "Manager@123" },
  { username: "arjun", displayName: "Arjun Rao",    role: "operator", team: "NET", password: "Operator@123" },
  { username: "kavya", displayName: "Kavya Shetty", role: "operator", team: "APP", password: "Operator@123" }
];

async function main() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const users = client.db(process.env.DB_NAME || "pulseops").collection("users");

  for (const u of USERS) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await users.updateOne(
      { username: u.username },
      { $set: { displayName: u.displayName, role: u.role, team: u.team, passwordHash },
        $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
    console.log(`✔ ${u.username.padEnd(6)} ${u.role.padEnd(9)} password: ${u.password}`);
  }
  await client.close();
}

main().catch(err => { console.error("✖ Seeding failed:", err.message); process.exit(1); });