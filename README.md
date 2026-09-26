# UNI-FORM

설문 참여자는 포인트를 받고, 설문 생성자는 원하는 조건의 응답을 모집하는 React 기반 설문 플랫폼입니다.

## 실행

```bash
npm install
cp .env.example .env
npm run dev
```

프론트엔드는 Uni-Form NestJS 백엔드 API를 호출합니다. `.env`의 `VITE_API_BASE_URL`에 백엔드 주소(예: `http://134.185.108.221`, 끝의 `/` 없이)를 설정하세요. API 명세는 `<백엔드 주소>/api-docs`에서 확인할 수 있습니다.

`VITE_API_BASE_URL`을 비워 두고 실행하면 로그인 없이 데모 사용자와 샘플 설문으로 전체 UI를 둘러볼 수 있습니다.

현재는 인증(회원가입·이메일 인증·로그인)만 백엔드에 연결되어 있고, 설문·응답·리더보드 등은 백엔드 연동 전까지 샘플 데이터로 동작합니다.

## 배포

Cloudflare Pages 설정은 다음 값을 사용합니다.

- Production branch: `codex/live-work`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: 비워 둠

GitHub의 production branch에 push하면 Cloudflare Pages가 자동으로 새 빌드를 배포합니다. `.env`는 커밋하지 않으며 `VITE_API_BASE_URL`은 Cloudflare Pages의 Variables and Secrets에 별도로 등록합니다. 배포 사이트는 HTTPS이므로 백엔드도 HTTPS 주소여야 브라우저가 요청을 막지 않습니다(mixed content).

현재와 과거 랜딩페이지는 사이트의 `/versions` 또는 [VERSIONS.md](./VERSIONS.md)에서 각각 열람할 수 있습니다. 의미 있는 디자인 변경은 Git 태그와 Cloudflare 고유 배포 주소로 함께 보존합니다.

## 주요 명령

```bash
npm run dev
npm run build
npm run preview
```

기능 흐름과 파일별 역할, 데이터 구조는 [SEQUENCE.md](./SEQUENCE.md)를 참고하세요.
