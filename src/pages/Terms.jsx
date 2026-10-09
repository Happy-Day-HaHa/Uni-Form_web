import LegalDocument from '../components/LegalDocument'
import source from '../content/legal/terms.md?raw'

// 이용약관 원문: src/content/legal/terms.md (문구는 원문 파일에서만 고친다)
export default function Terms() {
  return <LegalDocument source={source} />
}
