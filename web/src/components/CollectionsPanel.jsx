export default function CollectionsPanel({ data }) {
  if (!data) return <p className="muted">Loading collection statistics…</p>;
  return (
    <>
      <p className="muted small">Database: {data.database}</p>
      <table className="table">
        <thead>
          <tr><th>Collection</th><th>Documents</th><th>Size (KB)</th><th>Indexes</th></tr>
        </thead>
        <tbody>
          {data.collections.map(c => (
            <tr key={c.name}>
              <td><code>{c.name}</code></td>
              <td>{c.documents ?? "—"}</td>
              <td>{c.sizeKB ?? "—"}</td>
              <td className="small">{c.indexes.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}