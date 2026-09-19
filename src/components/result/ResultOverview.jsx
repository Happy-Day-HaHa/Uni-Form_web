export default function ResultOverview({ survey, sampleCount, completionRate = 100, summary }) {
  const target = Math.max(Number(survey.target_count || 1), 1)
  const responses = Number(sampleCount ?? survey.response_count ?? 0)
  const achievement = Math.round((responses / target) * 100)
  return (
    <>
      <section className="result-stats">
        <article><span>전체 응답</span><strong>{responses}</strong><small>현재까지 수집된 응답</small></article>
        <article><span>목표 달성률</span><strong>{achievement}%</strong><small>{target}명 중 {responses}명</small></article>
        <article><span>응답 완성도</span><strong>{completionRate}%</strong><small>필수 문항에 답한 비율</small></article>
        <article><span>분석 문항</span><strong>{survey.questions?.length || 0}</strong><small>결과를 확인할 수 있는 문항</small></article>
      </section>
      <section className="result-summary"><div><p className="eyebrow">핵심 요약</p><h2>응답에서 먼저 볼 부분</h2></div><p>{summary}</p></section>
    </>
  )
}
