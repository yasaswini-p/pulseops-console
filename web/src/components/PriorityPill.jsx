export default function PriorityPill({ priority }) {
  return <span className={`pill pill-${priority}`}>{priority}</span>;
}