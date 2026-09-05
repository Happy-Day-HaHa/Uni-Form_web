import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Header from '../components/Header'
import { useAuth } from '../hooks/useAuth'
import { getOwnedSurveyResults } from '../services/responseService'

function analyzeQuestion(question, responses) {
  const values = responses.map((response) => response.answers?.[question.id]).filter((value) => value !== undefined && value !== '')
  if (question.type === 'text') return { type: 'text', values }
  const options = question.type === 'scale'
    ? Array.from({ length: question.max - question.min + 1 }, (_, index) => question.min + index)
    : question.options || []
  const counts = options.map((option) => ({ option, count: values.filter((value) => String(value) === String(option)).length }))
  return { type: question.type, values, counts, max: Math.max(1, ...counts.map((item) => item.count)) }
}

export default function SurveyResults() {
  const { surveyId } = useParams()
  const { user } = useAuth()
  const [result, setResult] = useState(null)
  const [message, setMessage] = useState('결과를 분석하고 있어요.')

  useEffect(() => {
    getOwnedSurveyResults(surveyId, user.id).then(setResult).catch((error) => setMessage(error.message))
  }, [surveyId, user.id])

  const analyses = useMemo(() => result?.survey.questions?.map((question) => analyzeQuestion(question, result.responses)) || [], [result])
  if (!result) return <><Header /><main className="app-main"><div className="empty-state result-gate"><b>RESULT ACCESS</b><p>{message}</p><Link to="/dashboard">← 내 설문으로 돌아가기</Link></div></main></>

  const { survey, responses } = result
  const completion = Math.min(100, Math.round((survey.response_count / survey.target_count) * 100))

  return <><Header /><main className="app-main result-page">
    <Link className="back-link" to="/dashboard">← 내 설문</Link>
    <header className="result-hero"><div><p className="eyebrow">SURVEY REPORT</p><h1>{survey.title}</h1><p>모인 응답을 이해하기 쉬운 수치와 요약으로 정리했어요.</p></div><span>정리 완료</span></header>
    <section className="result-stats"><article><span>전체 응답</span><strong>{survey.response_count}</strong><small>현재까지 수집된 응답</small></article><article><span>목표 달성률</span><strong>{completion}%</strong><small>{survey.target_count}명 중 {survey.response_count}명</small></article><article><span>분석 가능한 샘플</span><strong>{responses.length}</strong><small>현재 불러온 응답 데이터</small></article></section>
    <section className="result-summary"><div><p className="eyebrow">AI SUMMARY</p><h2>응답에서 먼저 볼 부분</h2></div><p>{analyses[0]?.counts?.length ? `첫 번째 문항에서는 ‘${[...analyses[0].counts].sort((a, b) => b.count - a.count)[0].option}’ 응답이 가장 많아요.` : '주관식 답변에서 반복되는 의견을 문항별로 확인해보세요.'} 표본이 더 모일수록 결과의 의미가 선명해집니다.</p></section>
    <section className="result-questions"><div className="section-title"><div><p className="eyebrow">QUESTION BREAKDOWN</p><h2>문항별 결과</h2></div></div>{survey.questions?.map((question, index) => {
      const analysis = analyses[index]
      return <article className="result-question" key={question.id}><header><span>{String(index + 1).padStart(2, '0')}</span><h3>{question.title}</h3><small>{analysis.values.length}개 응답</small></header>{analysis.type === 'text' ? <ul className="text-answers">{analysis.values.map((answer, answerIndex) => <li key={`${question.id}-${answerIndex}`}>{answer}</li>)}</ul> : <div className="result-distribution">{analysis.counts.map(({ option, count }) => <div key={option}><span>{option}</span><i><b style={{ width: `${(count / analysis.max) * 100}%` }} /></i><strong>{count}</strong></div>)}</div>}</article>
    })}</section>
  </main></>
}
