import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ServiceShell, { MetricCard, ServiceHeading } from '../components/ServiceShell'
import { useAuth } from '../hooks/useAuth'
import { useCountUp } from '../hooks/useCountUp'
import { useReveal } from '../hooks/useReveal'
import { getMySurveys } from '../services/surveyService'

const chart = [72, 98, 112, 136, 162, 148, 121]
const activities = [['▤','AI 서비스 사용 경험 조사에 참여했어요.','2시간 전'],['✓','설문 응답이 정상적으로 제출됐어요.','3시간 전'],['✦','새로운 설문이 등록됐어요.','1일 전'],['▥','캠퍼스 생활 설문 결과가 준비됐어요.','2일 전']]

export default function Dashboard() {
  const { user } = useAuth()
  const [surveys, setSurveys] = useState([])
  const rootRef = useReveal([surveys.length])
  useEffect(() => { getMySurveys(user.id).then(setSurveys).catch(() => setSurveys([])) }, [user.id])
  const responses = surveys.reduce((sum, survey) => sum + Number(survey.response_count || 0), 0)
  const countActive = useCountUp(surveys.filter((survey) => survey.status === 'active').length || 3)
  const countResponses = useCountUp(responses || 348)
  const countAnalyzable = useCountUp(surveys.filter((survey) => survey.response_count > 0).length || 2)
  const countParticipated = useCountUp(8)
  return <ServiceShell activePath="/dashboard"><div ref={rootRef}>
    <ServiceHeading icon="▦" title="대시보드" description="지금, 필요한 설문과 주요 활동을 한눈에 확인해보세요." />
    <section className="service-metrics"><MetricCard icon="▤" label="진행 중인 설문" value={countActive} unit="개" note="현재 응답을 모으고 있어요."/><MetricCard tone="violet" icon="◎" label="누적 응답 수" value={countResponses} unit="건" note="내 설문에 모인 전체 응답이에요."/><MetricCard tone="mint" icon="▥" label="분석 가능한 설문" value={countAnalyzable} unit="개" note="결과를 확인할 수 있어요."/><MetricCard tone="amber" icon="↗" label="이번 주 참여 횟수" value={countParticipated} unit="회" note="지난주보다 2회 늘었어요."/></section>
    <section className="service-grid"><article className="service-panel ui-card" data-motion-reveal><div className="service-panel__head"><div><h2>주간 설문 참여 추이</h2><p>최근 7일간 서비스 활동 흐름입니다.</p></div><button type="button">최근 7일⌄</button></div><div className="mini-chart" aria-label="주간 설문 참여 막대 그래프">{chart.map((value,index)=><span key={`${value}-${index}`} className={index===4?'is-current':''} style={{'--bar':`${(value/180)*100}%`,'--delay':`${index*55}ms`}}><b>{value}</b></span>)}</div></article><article className="service-panel ui-card" data-motion-reveal style={{'--delay':'70ms'}}><div className="service-panel__head"><div><h2>최근 활동</h2><p>참여한 설문과 주요 안내입니다.</p></div><Link to="/activity">전체보기 →</Link></div><div className="service-list">{activities.map(([icon,title,time],index)=><div className="service-list-row" key={title}><span className={`service-list-row__icon service-tone--${index%2?'mint':'blue'}`}>{icon}</span><div><h3>{title}</h3><p>{index%2?'처리가 완료되었습니다.':'새로운 내용을 확인해보세요.'}</p></div><time>{time}</time></div>)}</div></article></section>
    <section className="service-grid service-grid--equal"><article className="service-panel ui-card" data-motion-reveal><div className="service-panel__head"><div><h2>빠른 시작</h2><p>원하는 작업으로 바로 이동하세요.</p></div></div><div className="quick-actions"><Link to="/surveys/create">설문 등록하기 <span>→</span></Link><Link to="/surveys">설문 참여하기 <span>→</span></Link></div></article><article className="service-panel ui-card" data-motion-reveal style={{'--delay':'70ms'}}><div className="service-panel__head"><div><h2>내 설문 바로가기</h2><p>최근 만든 설문을 확인하세요.</p></div><Link to="/my-surveys">전체보기 →</Link></div><div className="service-list">{(surveys.length?surveys.slice(0,3):[{id:'campus-life',title:'더 나은 캠퍼스 라이프를 위한 설문',response_count:82,target_count:120}]).map(survey=><div className="service-list-row" key={survey.id}><span className="service-list-row__icon">▤</span><div><h3>{survey.title}</h3><p>응답 {survey.response_count||0} / {survey.target_count||0}</p></div><Link to={survey.response_count?`/surveys/${survey.id}/results`:'/my-surveys'}>→</Link></div>)}</div></article></section>
  </div></ServiceShell>
}
