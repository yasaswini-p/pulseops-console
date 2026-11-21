// Manager analytics — aggregation pipelines over the shared incidents collection
const { getDb } = require("../config/db");

const incidents = () => getDb().collection("incidents");
const ACTIVE = { status: { $ne: "RESOLVED" } };

// GET /api/analytics/summary
async function summary(req, res) {
  const now = new Date();
  const [byPriority, breachedOpen, escalatedOpen, compliance] = await Promise.all([
    incidents().aggregate([
      { $match: ACTIVE },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray(),
    incidents().countDocuments({ ...ACTIVE, slaDueAt: { $lt: now } }),
    incidents().countDocuments({ ...ACTIVE, escalated: true }),
    incidents().aggregate([
      { $match: { status: "RESOLVED" } },
      { $group: {
          _id: null,
          total: { $sum: 1 },
          met: { $sum: { $cond: [{ $lte: ["$resolvedAt", "$slaDueAt"] }, 1, 0] } }
      } }
    ]).toArray()
  ]);

  const c = compliance[0] || { total: 0, met: 0 };
  res.json({
    open: byPriority.reduce((sum, p) => sum + p.count, 0),
    openByPriority: Object.fromEntries(byPriority.map(p => [p._id, p.count])),
    breachedOpen,
    escalatedOpen,
    resolved: c.total,
    compliancePct: c.total ? Math.round((c.met / c.total) * 1000) / 10 : null,
    generatedAt: now
  });
}

// GET /api/analytics/teams — per-team workload and compliance, joined with team details
async function teams(req, res) {
  const rows = await incidents().aggregate([
    { $group: {
        _id: "$team",
        open: { $sum: { $cond: [{ $ne: ["$status", "RESOLVED"] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ["$status", "RESOLVED"] }, 1, 0] } },
        met: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "RESOLVED"] }, { $lte: ["$resolvedAt", "$slaDueAt"] }] }, 1, 0] } }
    } },
    { $lookup: { from: "teams", localField: "_id", foreignField: "code", as: "info" } },
    { $project: {
        _id: 0,
        code: "$_id",
        name: { $first: "$info.name" },
        lead: { $first: "$info.lead" },
        open: 1,
        resolved: 1,
        compliancePct: {
          $cond: [{ $gt: ["$resolved", 0] },
            { $round: [{ $multiply: [{ $divide: ["$met", "$resolved"] }, 100] }, 1] }, null]
        }
    } },
    { $sort: { compliancePct: 1 } }
  ]).toArray();
  res.json({ teams: rows });
}

// GET /api/analytics/escalations — most recent live escalations
async function escalations(req, res) {
  const items = await incidents()
    .find({ escalated: true, escalatedAt: { $exists: true } },
          { projection: { _id: 0, incidentId: 1, title: 1, priority: 1, team: 1, status: 1, escalatedTo: 1, escalatedAt: 1 } })
    .sort({ escalatedAt: -1 }).limit(8).toArray();
  res.json({ escalations: items });
}

module.exports = { summary, teams, escalations };