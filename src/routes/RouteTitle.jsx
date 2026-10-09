import { useEffect } from 'react'
import { matchPath, useLocation } from 'react-router-dom'

// 경로별 브라우저 탭 제목. 위에서부터 처음 맞는 항목을 쓰고, 없으면 index.html의 기본 제목을 쓴다.
const SITE = 'Uni-Form'
const DEFAULT_TITLE = 'Uni-Form | 대학생 설문, 응답까지 무료로'
const titles = [
  ['/', null],
  ['/login', '로그인'],
  ['/signup', '회원가입'],
  ['/verify-email', '이메일 인증'],
  ['/reset-password', '비밀번호 재설정'],
  ['/support', '고객센터'],
  ['/terms', '이용약관'],
  ['/privacy', '개인정보 처리방침'],
  ['/versions', '랜딩 버전 기록'],
  ['/restricted', '이용 제한 안내'],
  ['/dashboard', '대시보드'],
  ['/surveys', '설문 목록'],
  ['/surveys/:surveyId/results', '설문 결과'],
  ['/surveys/:surveyId', '설문 참여'],
  ['/formmate', '설문 만들기'],
  ['/my-surveys', '내 설문'],
  ['/my-surveys/:surveyId/manage', '설문 관리'],
  ['/my-responses', '내 응답'],
  ['/leaderboard', '리더보드'],
  ['/team', '팀 관리'],
  ['/team/join/:token', '팀 참여'],
  ['/settings', '설정'],
  ['/admin/forbidden', '접근 권한 없음'],
  ['/admin/*', '관리자'],
]

export default function RouteTitle({ notFound = false }) {
  const { pathname } = useLocation()
  useEffect(() => {
    const match = notFound ? [null, '페이지를 찾을 수 없어요'] : titles.find(([pattern]) => matchPath(pattern, pathname))
    document.title = match?.[1] ? `${match[1]} | ${SITE}` : DEFAULT_TITLE
  }, [notFound, pathname])
  return null
}
