export default function ResultOverview({ survey, sampleCount }) {
  const target = Math.max(Number(survey.target_count || 1), 1)
  const responses = Number(sampleCount ?? survey.response_count ?? 0)
  const achievement = Math.round((responses / target) * 100)
  return (
    <>
      <section className="result-stats">
        <article><span>총 응답</span><strong>{responses}</strong><small>현재까지 제출된 응답</small></article>
        <article><span>목표</span><strong>{target}</strong><small>설정한 목표 응답 수</small></article>
        <article><span>달성률</span><strong>{achievement}%</strong><small>{target}명 중 {responses}명</small></article>
      </section>
    </>
  )
}
