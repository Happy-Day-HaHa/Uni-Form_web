import { PASSWORD_RULES } from '../utils/validation'

// 만족: 체크 표시가 든 원, 미충족: 비어 있는 원 — 색만이 아니라 모양으로도 구분한다.
function StatusIcon({ met }) {
  return <svg className="password-checklist__icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
    {met
      ? <><circle cx="8" cy="8" r="7.5" fill="currentColor" /><path d="M4.6 8.2 7 10.5l4.4-4.6" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></>
      : <circle cx="8" cy="8" r="6.75" fill="none" stroke="currentColor" strokeWidth="1.5" />}
  </svg>
}

function ChecklistItem({ met, children }) {
  return <li className={met ? 'is-met' : undefined}><StatusIcon met={met} /><span>{children}</span><span className="password-checklist__state">{met ? ' (충족)' : ' (미충족)'}</span></li>
}

// 새 비밀번호 입력 칸 아래의 조건 목록(회원가입·비밀번호 재설정 공통). 입력 전에는 모두 회색이고, 빨간 오류 표시는 하지 않는다.
export default function PasswordChecklist({ id, password, label = '비밀번호 조건' }) {
  return <ul className="password-checklist" id={id} aria-label={label}>
    {PASSWORD_RULES.map((rule) => <ChecklistItem key={rule.id} met={rule.test(password)}>{rule.label}</ChecklistItem>)}
  </ul>
}

// 비밀번호 확인 칸 아래에 따로 보여주는 "비밀번호 일치". 확인 칸이 비어 있으면 미충족으로 본다.
export function PasswordMatch({ id, password, confirm }) {
  return <ul className="password-checklist" id={id} aria-label="비밀번호 확인">
    <ChecklistItem met={Boolean(confirm) && password === confirm}>비밀번호 일치</ChecklistItem>
  </ul>
}
