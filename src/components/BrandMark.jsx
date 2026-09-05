import '../styles/brand.css'

export default function BrandMark({ className = '', light = false }) {
  return (
    <span className={`brand-mark ${light ? 'brand-mark--light' : ''} ${className}`.trim()} aria-label="UNIFORM">
      <span className="brand-mark__word" aria-hidden="true">UNIFORM</span>
    </span>
  )
}
