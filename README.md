# UNI-FORM

설문 참여자는 포인트를 받고, 설문 생성자는 원하는 조건의 응답을 모집하는 React 기반 설문 플랫폼입니다.

## 실행

```bash
npm install
cp .env.example .env
npm run dev
```

Supabase 없이 실행하면 데모 사용자와 샘플 설문으로 전체 UI를 둘러볼 수 있습니다. 실제 데이터를 연결하려면 `.env`에 프로젝트 URL과 Publishable Key를 설정하고 `database/`의 SQL을 순서대로 실행합니다.

1. `database/schema.sql`
2. `database/policies.sql`
3. 필요할 때 `database/seed.sql`

## 배포

Cloudflare Pages 설정은 다음 값을 사용합니다.

- Production branch: `codex/live-work`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: 비워 둠

GitHub의 production branch에 push하면 Cloudflare Pages가 자동으로 새 빌드를 배포합니다. `.env`는 커밋하지 않으며 실제 Supabase 값은 Cloudflare Pages의 Variables and Secrets에 별도로 등록합니다.

## 주요 명령

```bash
npm run dev
npm run build
npm run preview
```

기능 흐름과 파일별 역할, 데이터 구조는 [SEQUENCE.md](./SEQUENCE.md)를 참고하세요.
