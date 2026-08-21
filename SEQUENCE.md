# UNI-FORM 동작 흐름

## 사용자 흐름

1. `Login.jsx`, `Signup.jsx`에서 Supabase Auth로 로그인하거나 가입합니다.
2. `Profile.jsx`에서 연령대, 지역, 관심 분야를 저장합니다.
3. `SurveyList.jsx`가 공개 설문을 가져온 뒤 `surveyFilter.js`로 프로필 조건을 확인합니다.
4. `SurveyResponse.jsx`가 질문을 표시하고 응답을 제출합니다.
5. `submit_survey_response` DB 함수가 응답 저장과 포인트 지급을 하나의 트랜잭션으로 처리합니다.
6. `SurveyCreate.jsx`에서 제목, 질문, 목표 응답 수, 리워드를 설정합니다.
7. 모집 조건은 `audience` JSON에 저장합니다.
8. `create_survey_with_budget` DB 함수가 총 모집 예산을 차감하고 설문을 생성합니다.
9. 모든 포인트 이동은 `point_transactions` 원장에 기록됩니다.
10. `Dashboard.jsx`에서 모집 진행률과 최근 포인트 내역을 확인합니다.

## 폴더 역할

- `pages/`: URL별 화면과 사용자 상호작용
- `components/`: 여러 화면에서 재사용하는 UI
- `services/`: Supabase Auth, 테이블, RPC 호출
- `hooks/`: 로그인 세션과 포인트 조회 상태
- `utils/`: 조건 매칭, 표시용 계산, 입력 검증
- `routes/`: 공개/보호 라우트
- `database/`: 테이블, 함수, RLS 정책, 샘플 데이터

## 데이터 관계

```text
auth.users 1 ── 1 public.users
public.users 1 ── N surveys
public.users 1 ── N responses
surveys     1 ── N responses
public.users 1 ── N point_transactions
```

`users.point_balance`는 빠른 잔액 조회용이며, 변화의 근거는 항상 `point_transactions`에 함께 기록합니다. 리워드 지급과 설문 예산 차감은 클라이언트가 직접 잔액을 수정하지 않고 보안 정의자 RPC에서 행 잠금과 함께 처리합니다.
