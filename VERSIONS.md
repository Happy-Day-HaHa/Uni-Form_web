# UNI-FORM 랜딩페이지 버전

대표 주소인 <https://uni-form-go.pages.dev/>는 항상 최신 배포를 표시합니다. 아래 고유 주소는 새 버전이 배포되어도 당시 화면을 그대로 유지합니다.

| 버전 | Git 커밋 | 화면 열기 |
| --- | --- | --- |
| Dandy Landing | `landing-v4-dandy` | <https://uni-form-go.pages.dev/> |
| Journey Landing | `e7cf0cc` | <https://32f4eea9.uni-form-go.pages.dev/> |
| Playful Landing | `6c54f93` | <https://677882ca.uni-form-go.pages.dev/> |

## 보존 방식

- 의미 있는 디자인 변경 전 현재 커밋에 `landing-vN` Git 태그를 지정합니다.
- 변경 후 GitHub에 푸시하면 Cloudflare가 새 고유 배포 주소를 생성합니다.
- 새 고유 주소를 이 문서와 사이트의 `/versions` 화면에 추가합니다.
- 과거 코드를 다시 사용하려면 해당 태그에서 새 브랜치를 만들며, 기존 기록은 삭제하지 않습니다.
