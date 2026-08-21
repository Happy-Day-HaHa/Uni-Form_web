import { formatPoints } from '../utils/pointCalculator'

export default function PointBadge({ points }) { return <span className="point-badge" aria-label={`보유 포인트 ${formatPoints(points)}`}>● {formatPoints(points)}</span> }
