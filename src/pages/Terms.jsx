import LegalDocument, { Pending } from '../components/LegalDocument'

// 이용약관 초안 — 섹션 구조만 잡아 두었다. 각 조항 본문은 운영팀이 채운다.
const sections = [
  { id: 'purpose', heading: '제1조 (목적)', body: <p>이 약관은 UniForm(이하 “서비스”)의 이용 조건과 절차, 회원과 운영팀의 권리·의무를 정합니다. <Pending /></p> },
  { id: 'definitions', heading: '제2조 (용어의 정의)', body: <ul><li>회원: <Pending /></li><li>설문 / 응답: <Pending /></li><li>팀: <Pending /></li><li>FormMate: <Pending /></li></ul> },
  { id: 'effect', heading: '제3조 (약관의 효력과 변경)', body: <p><Pending /></p> },
  { id: 'account', heading: '제4조 (회원가입과 계정 관리)', body: <p><Pending /></p> },
  { id: 'service', heading: '제5조 (서비스의 내용)', body: <ul><li>설문 제작·게시와 응답 참여: <Pending /></li><li>FormMate(AI 설문 작성 도우미): <Pending /></li><li>팀 관리: <Pending /></li></ul> },
  { id: 'leaderboard', heading: '제6조 (리더보드와 보상)', body: <p><Pending /></p> },
  { id: 'duties', heading: '제7조 (회원의 의무와 금지 행위)', body: <p><Pending /></p> },
  { id: 'content', heading: '제8조 (설문 콘텐츠의 관리)', body: <p><Pending /></p> },
  { id: 'restriction', heading: '제9조 (이용 제한과 회원 탈퇴)', body: <p><Pending /></p> },
  { id: 'liability', heading: '제10조 (책임의 제한)', body: <p><Pending /></p> },
  { id: 'dispute', heading: '제11조 (분쟁 해결)', body: <p><Pending /></p> },
  { id: 'addendum', heading: '부칙', body: <p>이 약관은 <Pending>시행일</Pending>부터 시행합니다.</p> },
]

export default function Terms() {
  return <LegalDocument title="이용약관" intro="UniForm 서비스를 이용하기 전에 아래 내용을 확인해주세요." sections={sections} />
}
