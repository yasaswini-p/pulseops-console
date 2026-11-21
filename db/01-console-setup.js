// PulseOps Console — Phase 1: new collections, indexes, role and user for the console API
// Run as the platform admin:
//   mongosh "mongodb://localhost:27017/admin" -u pulse_admin -p "Admin@123" --quiet db/01-console-setup.js

const DB_NAME = "pulseops";
const app = db.getSiblingDB(DB_NAME);

function resetUser(name) { if (app.getUser(name)) app.dropUser(name); }
function resetRole(name) { if (app.getRole(name)) app.dropRole(name); }

// Create a collection with validation, or update the validator if it already exists (collMod)
function ensureCollection(name, validator) {
  if (app.getCollectionNames().includes(name)) {
    app.runCommand({ collMod: name, validator, validationLevel: "strict" });
    print(`  ~ ${name}: validator updated (collMod)`);
  } else {
    app.createCollection(name, { validator });
    print(`  + ${name}: created with schema validation`);
  }
}

print("Managing collections:");

ensureCollection("users", {
  $jsonSchema: {
    bsonType: "object",
    required: ["username", "displayName", "role", "passwordHash", "createdAt"],
    properties: {
      username:     { bsonType: "string", pattern: "^[a-z0-9_]{3,20}$" },
      displayName:  { bsonType: "string" },
      role:         { enum: ["manager", "operator"] },
      team:         { enum: ["NET", "DB", "APP", "SEC", null] },
      passwordHash: { bsonType: "string" },
      createdAt:    { bsonType: "date" }
    }
  }
});
app.users.createIndex({ username: 1 }, { unique: true });

ensureCollection("work_notes", {
  $jsonSchema: {
    bsonType: "object",
    required: ["incidentId", "author", "text", "createdAt"],
    properties: {
      incidentId: { bsonType: "string" },
      author:     { bsonType: "string" },
      text:       { bsonType: "string", minLength: 2, maxLength: 2000 },
      createdAt:  { bsonType: "date" }
    }
  }
});
app.work_notes.createIndex({ incidentId: 1, createdAt: 1 });

// New index on the existing incidents collection to support "my incidents" queries
app.incidents.createIndex({ assignee: 1, status: 1 });
print("  + indexes: users.username (unique), work_notes.incidentId+createdAt, incidents.assignee+status");

// Least-privilege role for the console API
resetRole("consoleOperator");
app.createRole({
  role: "consoleOperator",
  privileges: [
    { resource: { db: DB_NAME, collection: "incidents" },    actions: ["find", "insert", "update"] },
    { resource: { db: DB_NAME, collection: "teams" },        actions: ["find"] },
    { resource: { db: DB_NAME, collection: "sla_policies" }, actions: ["find"] },
    { resource: { db: DB_NAME, collection: "audit_logs" },   actions: ["insert"] },
    { resource: { db: DB_NAME, collection: "users" },        actions: ["find", "insert", "update"] },
    { resource: { db: DB_NAME, collection: "work_notes" },   actions: ["find", "insert"] },
    { resource: { db: DB_NAME, collection: "" },             actions: ["listCollections", "collStats", "listIndexes"] }
  ],
  roles: []
});

resetUser("pulse_console");
app.createUser({ user: "pulse_console", pwd: "Console@123", roles: [{ role: "consoleOperator", db: DB_NAME }] });

print("\n✔ Role consoleOperator and user pulse_console created");
print("  Can:    read/write incidents, users, work_notes; insert audit logs; view collection stats");
print("  Cannot: delete anything, drop collections, read the audit trail");