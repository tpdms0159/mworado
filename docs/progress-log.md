# 진행 기록

마일스톤별 산출물은 `README.md`/`docs/spec.md`에 정리되어 있고, 이 문서는 **세션 단위로 무슨 일이 있었는지, 왜 그렇게 결정했는지**를 시간순으로 남겨서 다음에 이어서 진행할 때 맥락을 빨리 되찾기 위한 기록입니다.

---

## 2026-09-04

### 오늘 완료한 것

- **M0 — 셋업**: Next.js 16 + TS + Tailwind + shadcn/ui 스캐폴드, Supabase 프로젝트 연결(마이그레이션 6개, RLS 포함), 매직링크 로그인, GitHub(`tpdms0159/mworado`) + Vercel(`https://mworado.vercel.app`) 배포까지 완료.
- **M1 — 오늘 화면**: 할 일 추가/체크/인라인수정/삭제(5초 실행취소)/드래그 순서변경/진행률 바. `useOptimistic` 기반 낙관적 업데이트.
- **M2 — 루틴**: 루틴 생성/수정/보관(`/routines`), 반복 주기 4종(매일/특정요일/주N회/격일), 오늘 화면에 자동 표시, 스트릭 계산 + 🔥 배지. 날짜/스트릭 로직 단위테스트 33개 전부 통과.

### 오늘 겪은 문제와 해결 과정 (다음에 비슷한 문제가 또 나오면 참고)

1. **npm 프로젝트명이 대문자라 create-next-app 실패** → `mworado` 하위 폴더에 생성 후 루트로 이동.
2. **GitHub push 인증 실패**(HTTPS, 비대화형 세션이라 자격증명 입력 불가) → 기존 로컬 SSH 키를 GitHub 계정에 등록하는 방식으로 전환, 이후 SSH remote로 push.
3. **로그인 메일이 계속 500 에러** → 원인을 하나씩 좁혀감:
   - `NEXT_PUBLIC_SUPABASE_URL`에 `/rest/v1/` 경로가 잘못 붙어있었음 → 프로젝트 URL만 남기고 수정.
   - Vercel 환경변수 Type을 "Secret"으로 잘못 선택해서 저장이 막힘 → `NEXT_PUBLIC_` 값은 "Config" 타입으로 바꿔야 함(공개돼도 안전한 값이라 경고가 뜨는 것).
   - 그다음엔 Resend 커스텀 SMTP 연동 시도 → Resend의 무료 테스트 발신 주소(`onboarding@resend.dev`)는 **본인 가입 이메일로만 발송 가능**하다는 제약을 발견(도메인 미인증 상태). 이 프로젝트는 커스텀 도메인 없이 가기로 했었기 때문에, **Resend를 포기하고 Supabase 기본 내장 메일로 되돌림** — 임의 이메일 발송은 되지만 시간당 발송 한도가 낮다는 트레이드오프를 README에 명시.
   - 디버깅 과정에서 Supabase Auth API(`/auth/v1/otp`)를 curl로 직접 호출해서 실제 에러 바디(`{"msg":"Error sending confirmation email"}`)를 확인하는 방식이 Vercel/Supabase 대시보드 로그를 눈으로 훑는 것보다 훨씬 빨랐음.
4. **비밀번호 방식 로그인으로 바꿀지 고민** → PLAN.md에 "비밀번호 방식은 안 씀"이라고 명시돼 있어서 트레이드오프를 짚어드리고 확인받은 뒤, 매직링크 유지 + Supabase 기본 메일로 확정.
5. **`환경변수_정보.txt`에 DB 비밀번호가 평문으로 저장된 걸 발견** → git에 올라가지 않게 `.gitignore`에 패턴 추가(커밋된 적 없음, 안전). 이 파일은 로컬에만 있고 필요 없으면 삭제해도 됨.
6. **Supabase 기본 메일 발송 시간당 한도 초과(429)** → 오늘 테스트를 많이 해서 걸린 것, 버그 아님. 시간이 지나면(보통 1시간 단위) 자동 해제.

### 현재 배포 상태

- 배포 주소: https://mworado.vercel.app
- GitHub: `tpdms0159/mworado` (main 브랜치, 이 세션에서 커밋 4개: M0 셋업, SMTP 전환, M1, M2)
- M0(로그인)까지는 실제 배포 환경에서 동작 확인 완료. **M1/M2는 코드상 빌드·타입체크·린트·단위테스트는 전부 통과했지만, 위 이메일 발송 제한 때문에 사용자가 실제 화면에서 아직 클릭 테스트를 못 한 상태.**

### 다음에 할 일

1. 로그인 메일 제한 풀리면 `/today`, `/routines`에서 실제 클릭 테스트 (루틴 만들기 → 오늘 화면에 뜨는지 → 체크 → 스트릭 올라가는지 등)
2. 이상 없으면 **M3(기록 — 잔디 그래프, 통계, 빈 상태)** 진행
3. 이후 M4(랜딩/데모모드/설정/다크모드), M5(최종 검수) 순서로 진행 (PLAN.md 9번 마일스톤 참고)
4. 여유 있을 때: 구글 로그인 추가, 커스텀 도메인 구입 여부 재검토(구입하면 Resend로 다시 전환해 이메일 발송 제한 해소 가능)

---

## 2026-09-05

### 오늘 완료한 것

- **M3 — 기록**: 잔디 그래프(최근 1년, 5단계, hover/tap 요약), 현재/최장 연속일, 최근 30일 완료율, 루틴별 달성률 막대 차트, 빈 상태.
- **M4 — 마감**: 다크모드(next-themes), 포인트 컬러(세이지 그린) 적용, 랜딩 페이지, `/demo`(로그인 없이 로컬 state 체험), `/settings`(하루 시작 시각/테마/JSON 내보내기/계정 삭제), 파비콘·OG 이미지·manifest·sitemap·robots.
- **M5 — 검수**: PLAN.md 체크리스트 9개 항목 점검 → `docs/qa-checklist.md`에 정리. 점검 중 **오프라인 상태에서 서버 액션 호출 자체가 실패할 때 에러 토스트가 안 뜨던 버그**를 발견해 `src/lib/safe-action.ts`로 모든 클라이언트 액션 호출을 감싸 수정.
- README/spec.md 최종 정리 (화면 구성표, "지금 안 되는 것" 섹션, 검수 결과 링크 추가).

### 알아둘 것

- 테마 색상이 기존 무채색에서 세이지 그린 포인트 컬러로 바뀜(PLAN.md "포인트 컬러 1개" 요구사항 반영 — M0~M2 때는 반영이 안 돼있었던 걸 M4에서 뒤늦게 발견하고 고침).
- 계정 삭제 기능은 `SUPABASE_SERVICE_ROLE_KEY`가 Vercel 환경변수에 있어야 동작함(이미 등록돼 있을 것으로 예상되나 재확인 요청드림).
- 이번 세션엔 브라우저 자동화 도구를 안 썼기 때문에 실제 Lighthouse 점수 측정, 두 계정 RLS 교차 확인, 375px 실기기 확인은 못 했음 — `docs/qa-checklist.md`에 "사용자 확인 필요" 항목으로 표시해둠.

### 다음에 할 일

1. `docs/qa-checklist.md`의 "⏳ 사용자 확인 필요" 3개 항목 직접 확인 (특히 RLS 교차 확인은 꼭 해보는 걸 권장)
2. Chrome DevTools Lighthouse(모바일)로 실제 성능/접근성 점수 확인
3. 전체 마일스톤(M0~M5) 완료 상태 — 이후는 여유될 때 P1(날짜 이동, PWA, 메모/태그) 또는 구글 로그인·커스텀 도메인 등 후속 작업

---

## 2026-09-07

### 오늘 완료한 것

- **로그인 방식 전환: 매직링크 → 이메일 + 비밀번호.** "사이트 들어올 때마다 메일 받는" 번거로움과 Supabase 기본 메일 시간당 발송 한도 문제를 해소하기 위함. PLAN.md에 원래 "비밀번호 방식은 안 씀"으로 못박혀 있었으나 이번 요청으로 뒤집고, PLAN.md에 변경 이력을 남김.
  - 새 화면: `/signup`(가입 링크 발송), `/forgot-password`(재설정 링크 발송), `/account/set-password`(링크 도착 후 비밀번호 설정 — 가입·재설정·설정화면의 "비밀번호 변경" 3경우가 공유).
  - `/login`은 이메일+비밀번호 폼으로 교체. `signInWithPassword` 성공 시 `next`(기본 `/today`)로 이동.
  - 메커니즘: 가입은 `signInWithOtp({ shouldCreateUser: true })`(매직링크 재사용) → `/auth/callback?next=/account/set-password` → `updateUser({ password })`. 재설정은 `resetPasswordForEmail`.
  - `src/proxy.ts`: 보호 프리픽스에 `/account` 추가, 로그인 상태로 `/login`·`/signup`·`/forgot-password` 방문 시 `/today`로 리다이렉트.
  - `/auth/callback`의 `next` 파라미터에 open-redirect 방어(내부 경로만 허용) 추가.
  - `/settings` 계정 카드에 "비밀번호 변경" 링크 추가. 랜딩 "시작하기" CTA는 `/signup`으로.
- 빌드·타입체크·린트·단위테스트(33개) 전부 통과. 빌드 중 "함수 prop을 Server→Client로 못 넘김" 에러 만나서 `EmailLinkForm`의 `sentDescription`을 함수 → `{email}` 치환 문자열로 바꿔 해결.
- 문서 갱신: README(로그인 방식 절 신설, Supabase 설정 6~8단계, 화면표), `docs/spec.md`(인증 흐름 절 신설, 화면표), PLAN.md.
- 여기까지 커밋 `72680ca`로 main에 푸시 → Vercel 자동 배포 완료. `/signup`·`/login`·`/forgot-password` 200, 보호 경로 307 확인.

- **지난 날짜 할 일 조회**: `/today`가 "오늘"만 보여줘 하루 지나면 그날 할 일을 못 봤다. 날짜 이동 화면(P1)을 새로 만드는 대신, **기록(`/stats`)의 잔디 칸을 누르면 그 날짜에 등록됐던 할 일·루틴을 펼쳐 보여주도록** 함.
  - `getStatsView`에 `dayDetails: Record<날짜, { todos, routines }>` 추가(항목 있던 날짜만). todos 조회에 `title, sort_order` 포함, 루틴은 기존 due 판정 루프에서 이름·완료여부 같이 수집 — **추가 쿼리 없음**.
  - `GrassGraph`에 클릭 시 상세 패널(요일 + 루틴/할 일 그룹, 완료 항목 체크+취소선, × 로 닫기). 읽기 전용.
  - 랜딩 페이지의 예시 잔디는 `dayDetails` 없이 그대로 — 클릭하면 "항목 없음"만 뜸(무해).

### 사용자가 해야 할 것 (Supabase 대시보드)

1. **Authentication → Sign In / Providers → Email**: "Confirm email"과 비밀번호 로그인(Enable password auth)이 켜져 있는지 확인.
2. (권장) **Authentication → Emails**: "Magic Link" 템플릿 문구를 "로그인" → "가입을 마치려면"처럼 다듬기 (가입 링크가 이 템플릿을 씀).
3. **URL Configuration**의 Redirect URLs에 `/auth/callback`이 이미 있으면 추가 작업 없음.

### 다음에 할 일

1. 배포 후 실제로 가입 → 메일 링크 클릭 → 비밀번호 설정 → 로그아웃 → 이메일/비밀번호로 재로그인 전체 흐름 클릭 테스트.
2. 기존 매직링크로만 가입했던 계정(비밀번호 미설정)이 있다면 `/forgot-password`로 비밀번호를 설정해야 로그인 가능 — 안내 필요.
3. `/stats`에서 잔디 칸 눌러 지난 날짜 할 일이 제대로 뜨는지 확인 (며칠 전 날짜에 할 일 만들어두고 다음 날 확인하는 식).
4. 지난 날짜를 **읽기만** 하는 게 답답하면, 그때 가서 P1 "날짜 이동"(그날로 가서 편집)까지 확장 검토.
5. 이전 항목들(qa-checklist 3개, Lighthouse, 구글 로그인/커스텀 도메인)은 그대로 유효.
