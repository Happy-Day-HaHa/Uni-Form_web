# UNI-FORM 랜딩페이지 버전

의미 있는 랜딩페이지 디자인은 Git 태그로 보존합니다.

| 버전 | Git 태그 | 커밋 |
| --- | --- | --- |
| Dandy Landing | `landing-v4-dandy` | `00b7c80` |
| Journey Landing | `landing-v2-journey` | `e7cf0cc` |
| Playful Landing | `landing-v1-playful` | `6c54f93` |

## 보존 방식

- 의미 있는 디자인 변경 전 현재 커밋에 `landing-vN` Git 태그를 지정합니다.
- 과거 화면을 다시 보려면 해당 태그를 체크아웃해 로컬에서 실행합니다(`git checkout landing-v2-journey` → `npm run dev`).
- 과거 코드를 다시 사용하려면 해당 태그에서 새 브랜치를 만들며, 기존 기록은 삭제하지 않습니다.
