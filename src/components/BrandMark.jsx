import '../styles/brand.css'

export default function BrandMark({ className = '', light = false, showName = false }) {
  return (
    <span className={`brand-mark ${light ? 'brand-mark--light' : ''} ${className}`.trim()} aria-label="UNI-FORM">
      <span className="brand-mark__seal" aria-hidden="true"><b>UN<em>I</em>FORM</b></span>
      {showName && <span className="brand-mark__name">UNI-FORM</span>}
    </span>
  )
}
