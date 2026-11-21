// Incident operations for the console. Writes the same documents the PulseOps Engine monitors.
const { getDb } = require("../config/db");
const { ApiError } = require("../middleware/errors");

const PRIORITIES = ["P1", "P2", "P3", "P4"];
const TEAMS = ["NET", "DB", "APP", "SEC"];
const incidents = () => getDb().collection("incidents");
const AFTER = { returnDocument: "after", projection: { _id: 0 } };

async function audit(event, incident, details, actor) {
  await getDb().collection("audit_logs").insertOne({
    event, incidentId: incident.incidentId, priority: incident.priority, team: incident.team,
    details, actor, source: "console", timestamp: new Date()
  });
}

async function nextIncidentId() {
  const last = await incidents().find({}, { projection: { incidentId: 1 } }).sort({ incidentId: -1 }).limit(1).toArray();
  const lastNum = last.length ? parseInt(last[0].incidentId.split("-")[1], 10) : NaN;
  return `INC-${(Number.isNaN(lastNum) || lastNum < 1000 ? 1000 : lastNum) + 1}`;
}

// Distinguish "not found" from "wrong state" after a conditional update fails
async function explainFailure(incidentId, action) {
  const existing = await incidents().findOne({ incidentId }, { projection: { status: 1 } });
  if (!existing) return new ApiError(404, `Incident ${incidentId} not found`);
  return new ApiError(409, `Cannot ${action} ${incidentId}: it is already ${existing.status}`);
}

// GET /api/incidents?status=&priority=&team=&assignee=me&sort=sla&limit=
async function list(req, res) {
  const query = {};
  for (const key of ["status", "priority", "team"]) {
    if (req.query[key]) query[key] = String(req.query[key]).toUpperCase();
  }
  if (req.query.status === "active") query.status = { $ne: "RESOLVED" };
  if (req.query.assignee === "me") query.assignee = req.user.sub;

  const sort = req.query.sort === "sla" ? { slaDueAt: 1 } : { createdAt: -1 };
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);

  const items = await incidents()
    .find(query, { projection: { _id: 0, history: 0 } })
    .sort(sort).limit(limit).toArray();
  res.json({ count: items.length, incidents: items });
}

// GET /api/incidents/:id — incident plus its work notes
async function getOne(req, res) {
  const incident = await incidents().findOne({ incidentId: req.params.id }, { projection: { _id: 0 } });
  if (!incident) throw new ApiError(404, `Incident ${req.params.id} not found`);

  const notes = await getDb().collection("work_notes")
    .find({ incidentId: req.params.id }, { projection: { _id: 0 } })
    .sort({ createdAt: 1 }).toArray();
  res.json({ ...incident, notes });
}

// POST /api/incidents
async function create(req, res) {
  const { title, priority, team, description } = req.body || {};
  const errors = [];
  if (typeof title !== "string" || title.trim().length < 3) errors.push("title must be at least 3 characters");
  if (!PRIORITIES.includes(priority)) errors.push(`priority must be one of ${PRIORITIES.join(", ")}`);
  if (!TEAMS.includes(team)) errors.push(`team must be one of ${TEAMS.join(", ")}`);
  if (errors.length) throw new ApiError(400, "Validation failed", errors);

  const policy = await getDb().collection("sla_policies").findOne({ priority });
  const scale = Number(process.env.SLA_TIME_SCALE) || 1;
  const now = new Date();

  const doc = {
    incidentId: await nextIncidentId(),
    title: title.trim(),
    description: (description || "").trim(),
    priority, team,
    status: "OPEN",
    assignee: null,
    slaMinutes: policy.resolveMinutes,
    slaDueAt: new Date(now.getTime() + (policy.resolveMinutes * 60000) / scale),
    slaWarned: false, slaBreached: false, escalated: false,
    createdBy: req.user.sub,
    createdAt: now, updatedAt: now, resolvedAt: null,
    history: [{ status: "OPEN", at: now, by: req.user.sub }],
    source: "console"
  };

  await incidents().insertOne(doc);
  delete doc._id;
  await audit("incident:created", doc, `Created via console: ${doc.title}`, req.user.sub);
  res.status(201).json(doc);
}

// POST /api/incidents/:id/assign — atomic: only succeeds if the incident is still OPEN
async function assignToMe(req, res) {
  const now = new Date();
  const updated = await incidents().findOneAndUpdate(
    { incidentId: req.params.id, status: "OPEN" },
    { $set: { status: "IN_PROGRESS", assignee: req.user.sub, updatedAt: now },
      $push: { history: { status: "IN_PROGRESS", at: now, by: req.user.sub } } },
    AFTER
  );
  if (!updated) throw await explainFailure(req.params.id, "take ownership of");

  await audit("incident:assigned", updated, `Assigned to ${req.user.sub}`, req.user.sub);
  res.json(updated);
}

// POST /api/incidents/:id/resolve  { resolution }
async function resolve(req, res) {
  const resolution = String(req.body?.resolution || "").trim();
  if (resolution.length < 5) throw new ApiError(400, "A resolution summary of at least 5 characters is required");

  const now = new Date();
  const updated = await incidents().findOneAndUpdate(
    { incidentId: req.params.id, status: { $in: ["OPEN", "IN_PROGRESS"] } },
    { $set: { status: "RESOLVED", resolvedAt: now, updatedAt: now, resolution, resolvedBy: req.user.sub },
      $push: { history: { status: "RESOLVED", at: now, by: req.user.sub } } },
    AFTER
  );
  if (!updated) throw await explainFailure(req.params.id, "resolve");

  const withinSla = now <= new Date(updated.slaDueAt);
  await audit("incident:resolved", updated, withinSla ? "Resolved within SLA" : "Resolved after SLA breach", req.user.sub);
  res.json({ ...updated, withinSla });
}

// POST /api/incidents/:id/notes  { text }
async function addNote(req, res) {
  const text = String(req.body?.text || "").trim();
  if (text.length < 2) throw new ApiError(400, "Note text is required");

  const exists = await incidents().findOne({ incidentId: req.params.id }, { projection: { _id: 1 } });
  if (!exists) throw new ApiError(404, `Incident ${req.params.id} not found`);

  const note = { incidentId: req.params.id, author: req.user.sub, authorName: req.user.name, text, createdAt: new Date() };
  await getDb().collection("work_notes").insertOne(note);
  delete note._id;
  res.status(201).json(note);
}

module.exports = { list, getOne, create, assignToMe, resolve, addNote };