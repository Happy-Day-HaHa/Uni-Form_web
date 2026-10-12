# Uni-Form 프론트엔드

대학(원)생이 서로의 설문에 응답하고, FormMate(AI)와 대화하며 설문을 만드는 서비스 Uni-Form의 웹 프론트엔드입니다.

- 백엔드: [JMandoo1014/Uniform-backend](https://github.com/JMandoo1014/Uniform-backend) (NestJS)

## 기술 스택

| 구분 | 사용 기술 (package.json 기준) |
|---|---|
| UI | React 19.2.8, React DOM 19.2.8 |
| 라우팅 | React Router DOM 7.18.2 |
| 애니메이션 | GSAP ^3.15.0 |
| 빌드 | Vite 8.2.2, @vitejs/plugin-react 6.1.0 |
| 호스팅 | Cloudflare Pages |

Node.js는 `^20.19.0` 또는 `>=22.12.0`이 필요합니다(Vite 8 요구 사항).

## 환경

| 브랜치 | 배포 | 주소 | API |
|---|---|---|---|
| `main` | Cloudflare Pages 운영 | `uni-form-go.pages.dev` | `api.uniform-app.com` |
| `develop` | Cloudflare Pages 프리뷰 | `develop.uni-form-go.pages.dev` | `api-dev.uniform-app.com` |
| 그 밖의 브랜치 | Cloudflare Pages 프리뷰 | `<브랜치>.uni-form-go.pages.dev` | 프리뷰 환경변수 값 |

- `develop`을 포함한 모든 프리뷰 주소는 Cloudflare Access 뒤에 있어 팀원만 접속할 수 있습니다.
- 브랜치에 push하면 Cloudflare Pages가 자동으로 빌드·배포합니다.

## 로컬 실행

```bash
npm install
cp .env.example .env.local   # 예시 값은 로컬 백엔드 http://localhost:3000
npm run dev                  # http://localhost:5173
```

- 기본은 **로컬 백엔드(`http://localhost:3000`)** 를 함께 띄워서 씁니다. 백엔드 실행 방법은 백엔드 저장소 README를 보세요.
- 운영 API(`api.uniform-app.com`)는 CORS에서 운영 주소만, 개발 API(`api-dev.uniform-app.com`)는 develop 프리뷰 주소만 허용하므로, 로컬(`localhost:5173`)에서 바로 붙이면 브라우저가 요청을 막습니다.
- `.env.local`은 커밋하지 않습니다(`.gitignore` 대상).

그 밖의 명령:

```bash
npm run build      # 운영용 빌드 → dist/
npm run preview    # 빌드 결과를 로컬에서 미리 보기
```

## 환경변수

| 이름 | 설명 |
|---|---|
| `VITE_API_BASE_URL` | 백엔드 API 주소(끝의 `/` 없이). 코드에서는 `src/services/apiClient.js` 한 곳에서만 읽습니다. |

- `VITE_`로 시작하는 값은 **빌드할 때 번들에 그대로 들어갑니다.** Cloudflare Pages에서 값을 바꾸면 다시 빌드(재배포)해야 반영됩니다.
- 값이 없으면 기본 주소로 대신 연결하지 않고, 앱 대신 "서비스 설정이 필요해요" 안내 화면만 보입니다.
- 배포 사이트가 HTTPS이므로 API 주소도 `https://`여야 합니다.

## 이용약관 · 개인정보 처리방침

- 원문: `src/content/legal/terms.md`, `src/content/legal/privacy.md` — `/terms`, `/privacy` 화면은 이 파일을 그대로 렌더링합니다. 문구는 원문 파일에서만 고칩니다.
- 시행일: `src/constants.js`의 `POLICY_EFFECTIVE_DATE`(`YYYY-MM-DD`). 문서 버전·시행일 표시와 회원가입 때 보내는 동의 약관 버전에 함께 쓰입니다.
- 시행일을 바꿀 때는 **백엔드 환경변수 `TERMS_VERSION`도 같은 값으로 함께 바꿔야 합니다.** 백엔드는 회원이 동의한 버전과 `TERMS_VERSION`이 다르면 재동의 대상으로 보므로, 바꾸면 기존 회원에게 재동의 창이 뜹니다.

## 보안 헤더 (`public/_headers`, 모든 경로)

- `X-Frame-Options: DENY` — 다른 사이트가 iframe으로 넣지 못하게 막음
- `X-Content-Type-Options: nosniff` — 파일 형식 추측 방지
- `Referrer-Policy: strict-origin-when-cross-origin` — 다른 사이트로 이동할 때 경로·쿼리를 보내지 않음
- `Permissions-Policy` — 카메라·마이크·위치·결제 등 쓰지 않는 브라우저 기능 차단
- `Content-Security-Policy-Report-Only` — **Report-Only**: 막지 않고 위반만 브라우저 콘솔에 남김. API 연결은 운영·개발 API(`api.uniform-app.com`, `api-dev.uniform-app.com`)만 허용. 확인이 끝나면 `Content-Security-Policy`로 바꿔 실제 적용
- HTML·`/assets/*`는 `Cache-Control: no-cache`로 항상 새 버전을 받음

## 작업 · 배포 흐름

1. `develop`에서 기능 브랜치를 만든다.
2. 기능 브랜치 → `develop` PR, 머지하면 develop 프리뷰에 자동 배포
3. develop 프리뷰에서 확인
4. `develop` → `main` PR
5. `main`에 머지하면 운영(`uni-form-go.pages.dev`)에 자동 배포

## 디렉터리 구조

```
src/
├─ components/   공통 컴포넌트(모달, 레이아웃, 약관 문서, 재동의 창 등)
│  ├─ admin/       관리자 화면 구성 요소
│  ├─ formmate/    FormMate 대화·설문 편집기
│  ├─ result/      설문 결과 화면 구성 요소
│  └─ survey/      설문 목록·응답 구성 요소
├─ config/       베타 일정 등 설정값(beta.js)
├─ content/      약관·개인정보 처리방침 원문(legal/)
├─ hooks/        인증·초안 자동 저장 등 커스텀 훅
├─ pages/        화면 단위 컴포넌트(admin/ 포함)
├─ routes/       라우터, 로그인·관리자 접근 가드, 페이지 제목
├─ services/     백엔드 API 호출(apiClient.js 기반)
├─ styles/       화면별 CSS
├─ utils/        검증·날짜 계산 등 유틸리티
├─ constants.js  문의 이메일, 약관 시행일 등 상수
├─ App.jsx
└─ main.jsx
```
