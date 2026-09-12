import { useEffect, useRef, useState } from 'react'

export const surveyCategories = ['전체', '교육', '라이프스타일', '소비', '테크', '문화']

export default function SurveyFilters({ query, onQueryChange, category, onCategoryChange, sort, onSortChange, duration, onDurationChange }) {
  const [open, setOpen] = useState(false)
  const popoverRef = useRef(null)
  useEffect(() => {
    const close = (event) => !popoverRef.current?.contains(event.target) && setOpen(false)
    const escape = (event) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape) }
  }, [])
  return <section className="catalog-tools">
    <label className="catalog-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="설문 제목이나 키워드로 검색해보세요." aria-label="설문 검색" /></label>
    <div className="catalog-selects">
      <label><span className="sr-only">카테고리</span><select value={category} onChange={(event) => onCategoryChange(event.target.value)}>{surveyCategories.map((item) => <option key={item} value={item}>{item === '전체' ? '전체 카테고리' : item}</option>)}</select></label>
      <label><span className="sr-only">정렬</span><select value={sort} onChange={(event) => onSortChange(event.target.value)}><option>추천순</option><option>인기순</option><option>최신순</option><option>소요시간순</option></select></label>
      <div className="catalog-filter-popover" ref={popoverRef}><button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>☷ 필터</button>{open && <div role="dialog" aria-label="상세 필터"><strong>예상 소요시간</strong>{['전체 시간', '3분 이내', '5분 이내', '6분 이상'].map((item) => <label key={item}><input type="radio" name="duration" checked={duration === item} onChange={() => onDurationChange(item)} /> {item}</label>)}<button className="ui-button" type="button" onClick={() => setOpen(false)}>적용하기</button></div>}</div>
    </div>
  </section>
}
