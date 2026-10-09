import LegalDocument from '../components/LegalDocument'
import source from '../content/legal/privacy.md?raw'

// 개인정보 처리방침 원문: src/content/legal/privacy.md (문구는 원문 파일에서만 고친다)
export default function Privacy() {
  return <LegalDocument source={source} />
}
