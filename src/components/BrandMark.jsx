import { Link } from 'react-router-dom'
import '../styles/brand.css'

export default function BrandMark({ className = '', light = false, showName = true }) {
  return (
    <Link className={`brand-mark ${light ? 'brand-mark--light' : ''} ${className}`.trim()} to="/" aria-label="UNI-FORM 홈">
      <span className="brand-mark__seal" aria-hidden="true"><i>Uni</i><b>FORM</b></span>
      {showName && <span className="brand-mark__name">UNI-FORM</span>}
    </Link>
  )
}
