// 베타 일정 설정. 랜딩 리더보드 미리보기와 고객센터 FAQ의 주차 안내가 모두 이 값에서 계산된다.
// 베타 1주차는 이 날부터 그다음 주 일요일까지 집계된다(시작일이 월요일이면 그 주 일요일까지 7일).
// 백엔드 주차 집계(Uni-Form_back src/common/utils/kst-date.util.ts의 EXTENDED_WEEKS)와 같은 일정이어야 한다.
export const BETA_START = '2026-10-04'
