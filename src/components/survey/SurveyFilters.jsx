export const surveyCategories = ['전체', '교육', '라이프스타일', '소비', '테크', '문화']

export default function SurveyFilters({ query, onQueryChange, category, onCategoryChange, sort, onSortChange, duration, onDurationChange }) {
  return (
    <section className="catalog-tools">
      <label className="catalog-search">
        <span aria-hidden="true">⌕</span>
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="설문 제목이나 키워드로 검색해보세요." />
      </label>
      <div className="catalog-filter-rail" aria-label="설문 필터">
        {surveyCategories.map((item) => <button key={item} type="button" className={category === item ? 'is-active' : ''} onClick={() => onCategoryChange(item)}>{item}</button>)}
        <select aria-label="정렬" value={sort} onChange={(event) => onSortChange(event.target.value)}><option>추천순</option><option>인기순</option><option>최신순</option><option>소요시간순</option></select>
        <select aria-label="소요시간" value={duration} onChange={(event) => onDurationChange(event.target.value)}><option>전체 시간</option><option>3분 이내</option><option>5분 이내</option><option>6분 이상</option></select>
      </div>
    </section>
  )
}
