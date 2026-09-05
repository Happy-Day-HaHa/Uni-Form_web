export default function ProgressBar({ value, max, label = '모집 진행률' }) {
  const percent = Math.min(100, Math.round((Number(value) / Math.max(1, Number(max))) * 100))
  return <div className="progress"><div className="progress__label"><span>{label}</span><strong>{value}/{max}</strong></div><div className="progress__track"><span style={{ width: `${percent}%` }} /></div></div>
}
