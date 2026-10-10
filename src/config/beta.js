// 베타 일정 설정. 랜딩 리더보드 미리보기와 고객센터 FAQ의 주차 안내가 모두 이 값에서 계산된다.
// 베타 1주차는 이 날부터 그다음 주 일요일까지 집계된다(시작일이 월요일이면 그 주 일요일까지 7일).
// 백엔드 주차 집계(Uni-Form_back src/common/utils/kst-date.util.ts의 EXTENDED_WEEKS)와 같은 일정이어야 한다.
export const BETA_START = '2026-10-04'

// 설문 목록 맨 위에 고정할 설문 id(운영팀 추천, 예: 'Uniform 실사용 후기 설문').
// 필터와 관계없이 항상 맨 위에 보이고(검색어와 안 맞으면 숨김), 마감·삭제되면 자동으로 빠진다. 바꾸려면 이 목록만 고치고 재배포.
export const PINNED_SURVEY_IDS = ['ea9ab008-f559-4acf-9e60-b4b891a94c0d'] // Uniform 실사용 후기 설문
