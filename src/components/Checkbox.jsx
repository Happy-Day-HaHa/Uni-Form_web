import { useEffect, useRef } from 'react'

export default function Checkbox({ checked, indeterminate = false, onChange, children, className = '', ...props }) {
  const inputRef = useRef(null)

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate
  }, [indeterminate])

  return <label className={`ui-checkbox ${className}`.trim()}>
    <input ref={inputRef} type="checkbox" checked={checked} onChange={onChange} {...props} />
    <span className="ui-checkbox__box" aria-hidden="true" />
    <span className="ui-checkbox__label">{children}</span>
  </label>
}
