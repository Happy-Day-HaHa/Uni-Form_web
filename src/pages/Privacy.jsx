import LegalDocument, { Pending } from '../components/LegalDocument'
import { SUPPORT_EMAIL } from '../constants'

// 개인정보 처리방침 초안 — 섹션 구조와 확정된 사실(수집 항목·문의처)만 채워 두었다. 나머지 본문은 운영팀이 채운다.
const collectedItems = [
  ['이메일', '필수', '회원가입·로그인, 인증 메일과 문의 답변 발송'],
  ['닉네임', '필수', '서비스 내 표시(리더보드, 팀)'],
  ['성별', '선택', '설문 응답 통계'],
  ['학년', '선택', '설문 응답 통계'],
  ['전공 계열', '선택', '설문 응답 통계'],
  ['재학 상태', '선택', '설문 응답 통계'],
]

const sections = [
  { id: 'items', heading: '1. 수집하는 개인정보 항목', body: <>
    <p>UniForm은 회원가입과 서비스 이용을 위해 아래 항목을 수집합니다. 필수·선택 구분과 이용 목적은 확정 전 초안입니다.</p>
    <div className="legal-table-wrap"><table className="legal-table"><thead><tr><th scope="col">항목</th><th scope="col">구분</th><th scope="col">이용 목적</th></tr></thead><tbody>{collectedItems.map(([item, kind, use]) => <tr key={item}><th scope="row">{item}</th><td>{kind}</td><td>{use}</td></tr>)}</tbody></table></div>
  </> },
  { id: 'purpose', heading: '2. 수집·이용 목적', body: <p><Pending /></p> },
  { id: 'retention', heading: '3. 보유 및 이용 기간', body: <p><Pending /></p> },
  { id: 'destruction', heading: '4. 파기 절차 및 방법', body: <ul><li>파기 절차: <Pending /></li><li>파기 방법: <Pending /></li></ul> },
  { id: 'third-party', heading: '5. 제3자 제공', body: <p><Pending /></p> },
  { id: 'entrustment', heading: '6. 처리 위탁', body: <p><Pending /></p> },
  { id: 'rights', heading: '7. 이용자의 권리와 행사 방법', body: <p><Pending /></p> },
  { id: 'contact', heading: '8. 개인정보 보호 문의처', body: <p>개인정보와 관련한 문의는 아래 이메일로 보내주세요.<br /><a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p> },
  { id: 'changes', heading: '9. 처리방침의 변경', body: <p>이 처리방침은 <Pending>시행일</Pending>부터 적용됩니다. <Pending /></p> },
]

export default function Privacy() {
  return <LegalDocument title="개인정보 처리방침" intro="UniForm이 어떤 개인정보를 왜 수집하고 어떻게 관리하는지 안내합니다." sections={sections} />
}
