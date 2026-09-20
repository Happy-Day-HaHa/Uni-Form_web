import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ResultOverview from '../components/result/ResultOverview'
import ServiceShell from '../components/ServiceShell'
import { useAuth } from '../hooks/useAuth'
import { getOwnedSurveyResults } from '../services/responseService'
import { downloadQuestionChart, isChartable } from '../utils/chartExport'

const PIE_COLORS = ['#40abfc', '#82ccff', '#b9e4ff', '#94a3b8', '#cbd5e1']

function buildConicGradient(counts, total) {
  if (!total) return '#eef1f6'
  let cursor = 0
  const stops = counts.map((item, index) => {
    const start = cursor
    cursor += (item.count / total) * 100
    return `${PIE_COLORS[index % PIE_COLORS.length]} ${start}% ${cursor}%`
  })
  return `conic-gradient(${stops.join(',')})`
}

function valuesFor(question, responses) {
  return responses.flatMap((response) => {
    const value = response.answers?.[question.id]
    if (value === undefined || value === '' || value === null) return []
    return Array.isArray(value) ? value : [value]
  })
}

function analyzeQuestion(question, responses) {
  const values = valuesFor(question, responses)
  const responseCount = responses.filter((response) => {
    const answer = response.answers?.[question.id]
    return answer !== undefined && answer !== null && answer !== '' && (!Array.isArray(answer) || answer.length > 0)
  }).length
  if (question.type === 'text' || question.type === 'long') return { type: 'text', values, responseCount }
  const options = question.type === 'scale'
    ? Array.from({ length: Number(question.max || 5) - Number(question.min || 1) + 1 }, (_, index) => Number(question.min || 1) + index)
    : question.options || []
  const counts = options.map((option) => ({ option, count: values.filter((value) => String(value) === String(option)).length }))
  const average = question.type === 'scale' && values.length ? values.reduce((sum, value) => sum + Number(value), 0) / values.length : null
  return { type: question.type, values, responseCount, counts, average, max: Math.max(1, ...counts.map((item) => item.count)) }
}

function ResultSkeleton() {
  return <div className="result-skeleton" aria-label="결과를 불러오는 중"><div className="result-skeleton__heading skeleton-block" /><div className="result-skeleton__metrics">{[0, 1, 2, 3].map((item) => <div className="skeleton-block" key={item} />)}</div><div className="result-skeleton__chart skeleton-block" /><div className="result-skeleton__rows">{[0, 1].map((item) => <div className="skeleton-block" key={item} />)}</div></div>
}

function ResultState({ code, onRetry, surveyId }) {
  const states = {
    FORBIDDEN: ['이 결과를 확인할 권한이 없습니다.', '설문 제작자만 원본 응답과 상세 분석을 확인할 수 있어요.'],
    NOT_FOUND: ['설문을 찾을 수 없습니다.', '삭제되었거나 주소가 올바르지 않은 설문입니다.'],
    NETWORK: ['결과를 불러오지 못했습니다.', '잠시 후 다시 시도해주세요.'],
  }
  const [title, copy] = states[code] || states.NETWORK
  return <section className="result-state"><span>{code === 'FORBIDDEN' ? '!' : code === 'NOT_FOUND' ? '?' : '↻'}</span><h1>{title}</h1><p>{copy}</p><div>{code === 'NETWORK' && <button className="ui-button" onClick={onRetry}>다시 시도</button>}<Link className="ui-button ui-button--secondary" to="/my-surveys">내 설문으로 돌아가기</Link>{code === 'FORBIDDEN' && <Link className="ui-button ui-button--secondary" to={`/surveys/${surveyId}`}>설문 보기</Link>}</div></section>
}

function QuestionAnalysis({ question, analysis, index }) {
  const total = analysis.responseCount
  return <article className="result-analysis">
    <header><span>Q{index + 1}.</span><div><h2>{question.title}{question.required !== false && <em>*</em>}</h2><p>응답 {total.toLocaleString()}개{analysis.average !== null ? ` · 평균 ${analysis.average.toFixed(1)} / ${question.max || 5}` : ''}</p></div>{isChartable(question) && <button className="result-analysis__png" type="button" onClick={() => downloadQuestionChart(question, analysis, index)}>이미지로 저장</button>}</header>
    {analysis.type === 'text' ? <div className="result-text-list">{analysis.values.slice(0, 8).map((answer, answerIndex) => <p key={`${question.id}-${answerIndex}`}>{answer}</p>)}</div>
      : question.type === 'single' ? <div className="result-pie-wrap">
          <div className="result-pie" style={{ background: buildConicGradient(analysis.counts, total) }}><span>{total}<small>응답</small></span></div>
          <ul className="result-pie-legend">{analysis.counts.map((item, colorIndex) => <li key={item.option} style={{ '--tone': PIE_COLORS[colorIndex % PIE_COLORS.length] }}><i /><span>{item.option}</span><b>{item.count} ({total ? Math.round((item.count / total) * 100) : 0}%)</b></li>)}</ul>
        </div>
      : question.type === 'scale' ? <div className="result-vbars">{analysis.counts.map((item) => { const percent = total ? Math.round((item.count / total) * 100) : 0; return <div key={item.option}><i style={{ '--bar': `${percent}%` }} /><b>{item.option}</b><small>{item.count}명</small></div> })}</div>
      : <div className="result-bars">{analysis.counts.map(({ option, count }) => { const percent = total ? Math.round((count / total) * 100) : 0; return <div key={option}><span>{option}</span><i><b style={{ '--bar': `${percent}%` }} /></i><strong>{percent}%</strong><small>{count}명</small></div> })}</div>}
  </article>
}

export default function SurveyResults() {
  const { surveyId } = useParams()
  const { user } = useAuth()
  const [state, setState] = useState({ status: 'loading', result: null, error: null })
  const [tab, setTab] = useState('questions')

  const load = useCallback(() => {
    setState({ status: 'loading', result: null, error: null })
    getOwnedSurveyResults(surveyId, user.id)
      .then((result) => setState({ status: 'ready', result, error: null }))
      .catch((error) => setState({ status: 'error', result: null, error }))
  }, [surveyId, user.id])

  useEffect(load, [load])

  const analyses = useMemo(() => state.result?.survey.questions?.map((question) => analyzeQuestion(question, state.result.responses)) || [], [state.result])

  if (state.status === 'loading') return <ServiceShell activePath="/my-surveys"><ResultSkeleton /></ServiceShell>
  if (state.status === 'error') return <ServiceShell activePath="/my-surveys"><ResultState code={state.error?.code} onRetry={load} surveyId={surveyId} /></ServiceShell>

  const { survey, responses } = state.result
  const questions = survey.questions || []
  const target = Math.max(1, Number(survey.target_count || 1))

  return <ServiceShell activePath="/my-surveys"><div className="result-dashboard">
    <nav className="result-dashboard__breadcrumb" aria-label="현재 위치"><Link to="/my-surveys">내 설문</Link><span>/</span><Link to={`/my-surveys/${survey.id}/manage`}>{survey.title}</Link><span>/</span><strong>결과</strong></nav>
    <header className="result-dashboard__header"><div><div className="result-dashboard__title"><div><h1>{survey.title}</h1><p>{survey.description}</p></div></div><ul><li>응답 {responses.length.toLocaleString()}개</li><li>목표 {target.toLocaleString()}명</li><li>{survey.status === 'active' ? '모집 중' : '모집 종료'}</li></ul></div><div><Link className="result-action" to={`/my-surveys/${survey.id}/manage`}>관리로 돌아가기</Link></div></header>

    {responses.length === 0 ? <section className="result-empty"><span>◎</span><h2>아직 응답이 없어요.</h2><p>응답이 제출되면 이곳에서 문항별 결과를 확인할 수 있습니다.</p><Link className="ui-button ui-button--secondary" to={`/my-surveys/${survey.id}/manage`}>관리로 돌아가기</Link></section> : <>
      <nav className="result-tabs" aria-label="결과 보기 방식">{[['questions', '문항별 결과'], ['summary', '요약']].map(([value, label]) => <button className={tab === value ? 'active' : ''} type="button" onClick={() => setTab(value)} key={value}>{label}</button>)}</nav>

      {tab === 'summary' && <section className="result-summary-view"><ResultOverview survey={survey} sampleCount={responses.length} /></section>}
      {tab === 'questions' && <section className="result-analysis-list">{questions.map((question, index) => <QuestionAnalysis key={question.id} question={question} analysis={analyses[index]} index={index} />)}</section>}
    </>}
  </div></ServiceShell>
}
