export default function ResultOverview({ survey, sampleCount, summary }) {
  const target = Math.max(Number(survey.target_count || 1), 1)
  const responses = Number(survey.response_count || 0)
  const completion = Math.min(100, Math.round((responses / target) * 100))
  return (
    <>
      <section className="result-stats">
        <article><span>전체 응답</span><strong>{responses}</strong><small>현재까지 수집된 응답</small></article>
        <article><span>목표 달성률</span><strong>{completion}%</strong><small>{target}명 중 {responses}명</small></article>
        <article><span>분석 가능한 샘플</span><strong>{sampleCount}</strong><small>현재 불러온 응답 데이터</small></article>
      </section>
      <section className="result-summary"><div><p className="eyebrow">AI SUMMARY</p><h2>응답에서 먼저 볼 부분</h2></div><p>{summary}</p></section>
    </>
  )
}
