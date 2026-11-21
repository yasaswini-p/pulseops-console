// Collection management view: documents, storage size and indexes for each collection
const { getDb } = require("../config/db");

async function collections(req, res) {
  const db = getDb();
  const list = await db.listCollections({}, { nameOnly: true, authorizedCollections: true }).toArray();
  const result = [];

  for (const { name } of list.sort((a, b) => a.name.localeCompare(b.name))) {
    const stats = await db.command({ collStats: name }).catch(() => null);
    const indexes = await db.collection(name).indexes().catch(() => []);
    result.push({
      name,
      documents: stats?.count ?? null,
      sizeKB: stats ? Math.round((stats.size / 1024) * 10) / 10 : null,
      indexes: indexes.map(i => i.name)
    });
  }
  res.json({ database: db.databaseName, collections: result });
}

module.exports = { collections };