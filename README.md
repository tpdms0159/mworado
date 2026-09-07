# 뭐라도해야지 (mworado)

매일 해야 할 일을 등록하고 완료를 체크하며, 반복 루틴의 꾸준함을 잔디 그래프로 확인하는 개인용 데일리 체크 웹앱.

> 이 문서는 마일스톤이 진행될 때마다 함께 갱신됩니다. 현재 상태: **M5(검수) 완료** · 로그인 방식을 매직링크 → 이메일+비밀번호로 전환

## 배포 주소

https://mworado.vercel.app

## 화면 구성

| 경로 | 설명 | 로그인 필요 |
|---|---|---|
| `/` | 랜딩 | 아니오 |
| `/demo` | 로그인 없이 로컬 상태로 체험하는 데모 (새로고침 시 초기화) | 아니오 |
| `/signup` | 이메일로 가입 링크 받기 | 아니오 |
| `/login` | 이메일 + 비밀번호 로그인 | 아니오 |
| `/forgot-password` | 비밀번호 재설정 링크 받기 | 아니오 |
| `/account/set-password` | 가입/재설정 링크로 도착해 비밀번호 설정 | 링크 필요 |
| `/today` | 오늘의 할 일 + 루틴, 체크, 진행률 | 예 |
| `/routines` | 루틴 생성·수정·보관 | 예 |
| `/stats` | 잔디 그래프, 연속일, 루틴별 달성률 | 예 |
| `/settings` | 하루 시작 시각, 테마, 데이터 내보내기, 계정 삭제 | 예 |

## 로그인 방식

- **가입**: `/signup`에서 이메일 주소만 입력 → 가입 링크가 메일로 발송된다. 링크를 누르면 세션이 만들어지고 `/account/set-password`로 이동해 비밀번호를 정한다. (Supabase `signInWithOtp` + `shouldCreateUser`)
- **로그인**: 이후부터는 `/login`에서 이메일(아이디) + 비밀번호로 로그인한다. 매번 메일을 받을 필요 없다. (`signInWithPassword`)
- **비밀번호 재설정**: `/forgot-password`에서 재설정 링크를 받아 같은 `/account/set-password` 화면에서 새 비밀번호를 설정한다. (`resetPasswordForEmail`)
- **비밀번호 변경**: 로그인 상태에서 `/settings` → "비밀번호 변경" 링크로 `/account/set-password`에 접근할 수 있다.
- 메일 링크는 모두 `/auth/callback`으로 도착해 `code`를 세션으로 교환한 뒤 `next` 경로로 이동한다. `next`는 open redirect 방지를 위해 사이트 내부 경로(`/`로 시작, `//` 제외)만 허용한다.

## 지금 안 되는 것 (의도적으로 미룬 범위)

- **구글 로그인**: 이메일+비밀번호만 구현했다. Supabase Auth는 provider를 나중에 추가해도 기존 로그인 흐름에 영향이 없어서, 필요할 때 Google Cloud Console에서 OAuth 클라이언트를 발급받아 붙이면 된다.
- **이메일 인증(가입 시 확인 메일 별도 클릭)**: 가입 링크 클릭 자체가 이메일 소유 확인을 겸하므로 별도 확인 단계는 두지 않았다.
- **커스텀 도메인**: Vercel 기본 주소(`mworado.vercel.app`)로 운영 중. 도메인을 사면 이메일 발송 제약(아래 참고)도 함께 개선할 수 있다.
- **타임존 변경 UI**: `/settings`에 Asia/Seoul 고정 표시만 있고 편집 UI는 없다.
- **PWA(홈 화면 추가, 오프라인 조회), 다크모드 자동 동기화(기기 간)**: manifest/아이콘은 있지만 오프라인 캐싱(Service Worker)까지는 구현하지 않았다.
- **알림·푸시, 협업·공유, 캘린더 연동, 하위 할 일, 첨부파일, 결제**: 기획 단계에서부터 이번 범위에서 제외(PLAN.md P2).

## 기술 스택

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Postgres + Auth) — 무료 티어
- Vercel — 무료 티어, GitHub 연동 자동 배포
- Vitest — 단위 테스트

## 로컬 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 접속.

단위 테스트 실행:

```bash
npm test
```

## 환경변수

`.env.example`을 참고해 `.env.local`을 채운다 (`.env.local`은 git에 커밋되지 않는다).

| 변수 | 설명 | 어디서 얻는가 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | Supabase 대시보드 → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 공개(anon) API 키 — 클라이언트에 노출되어도 되는 키 | Supabase 대시보드 → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | **서버 전용** 관리자 키 — 클라이언트에 절대 노출 금지 (`src/lib/supabase/admin.ts`에서만 사용, `server-only` 패키지로 실수 유입을 빌드 타임에 차단) | Supabase 대시보드 → Settings → API |
| `CRON_SECRET` | Vercel Cron이 `/api/cron/keepalive`를 호출할 때 검증하는 임의의 비밀 문자열 | 아무 랜덤 문자열이나 직접 생성 |

## Supabase 프로젝트 설정 (클릭 순서)

1. https://supabase.com 접속 → 로그인 → **New project** 클릭.
2. 조직(Organization) 선택 → 프로젝트 이름 `mworado` 입력 → 데이터베이스 비밀번호 설정(안전한 곳에 보관) → Region은 **Northeast Asia (Seoul)** 선택 → **Create new project**.
3. 프로젝트가 준비되면 왼쪽 메뉴 **Project Settings(톱니바퀴 아이콘) → API** 로 이동.
   - `Project URL` → `.env.local`의 `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` 키 → `SUPABASE_SERVICE_ROLE_KEY` (절대 다른 곳에 공유하지 않기)
4. 왼쪽 메뉴 **SQL Editor** → **New query**로 이동.
5. 이 저장소의 `supabase/migrations/` 폴더 안 파일을 **파일명 순서대로**(`0001_...` → `0006_...`) 하나씩 열어서 내용을 SQL Editor에 붙여넣고 **Run** 클릭. (마이그레이션은 순서가 중요하다 — 나중 파일이 앞 파일의 테이블을 참조한다.)
6. 왼쪽 메뉴 **Authentication → Sign In / Providers** 에서 **Email** provider가 켜져 있고, 그 안의 **"Confirm email"** 과 **비밀번호 로그인(Enable password auth)** 이 켜져 있는지 확인한다. (가입 링크·재설정 링크·비밀번호 로그인이 모두 이 provider를 쓴다. "Confirm email"이 꺼져 있어도 가입 링크 클릭으로 세션은 생기지만, 켜두면 미확인 계정으로 비밀번호 로그인이 되는 걸 막아준다.)
7. 왼쪽 메뉴 **Authentication → URL Configuration** 에서:
   - **Site URL**: 로컬 개발 중엔 `http://localhost:3000`, 배포 후에는 Vercel 배포 URL로 교체.
   - **Redirect URLs**에 다음 두 개를 추가: `http://localhost:3000/auth/callback` 와 배포 후 `https://<vercel 도메인>/auth/callback`.
8. (선택) 왼쪽 메뉴 **Authentication → Emails** 에서 **"Magic Link"** / **"Reset Password"** 템플릿 문구를 상황에 맞게 다듬는다. 가입 링크는 "Magic Link" 템플릿을 사용하므로 "로그인" 대신 "가입을 마치려면"처럼 바꿔두면 이용자 혼란이 줄어든다.

## 인증 메일 발송

**Supabase 기본 내장 메일 발송을 그대로 사용한다** (Custom SMTP 미사용). 별도 설정 없이 Authentication → Emails에서 Custom SMTP를 꺼둔 상태(기본값)면 된다.

> **왜 Resend 대신 기본 메일을 쓰는가**: 처음엔 무료 티어인 Resend를 커스텀 SMTP로 연결하려 했으나, Resend의 무료 테스트 발신 주소(`onboarding@resend.dev`)는 도메인을 인증하기 전까지 **Resend 가입자 본인 이메일로만 발송이 가능**하다는 제약이 있다(임의의 사용자 이메일로는 발송 자체가 거부됨). 이 프로젝트는 커스텀 도메인 없이 진행하기로 했기 때문에, 도메인 인증 없이 임의의 이메일로 실제 발송이 가능한 Supabase 기본 메일 발송으로 되돌렸다. 대신 시간당 발송 가능 횟수가 적다는 제약을 그대로 안고 간다 — 자세한 내용은 "무료 티어 제약과 한계" 참고.

> 나중에 도메인을 구입하게 되면, 그때 Resend(또는 다른 SMTP)로 다시 전환해 발송 제한을 완화할 수 있다.

## Vercel 배포 (클릭 순서)

1. 이 프로젝트를 GitHub 저장소로 푸시 (저장소 이름: `mworado`).
2. https://vercel.com 로그인 → **Add New → Project** → 방금 만든 GitHub 저장소 선택 → **Import**.
3. Framework Preset은 Next.js로 자동 인식됨. **Environment Variables**에 `.env.local`의 4개 값을 모두 등록(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`).
4. **Deploy** 클릭. 배포가 끝나면 `https://<프로젝트명>.vercel.app` 형태의 URL이 발급된다.
5. Supabase **Authentication → URL Configuration**의 Site URL / Redirect URLs에 이 배포 URL을 추가(위 "Supabase 프로젝트 설정" 7번 참고).
6. `vercel.json`에 정의된 Cron(`/api/cron/keepalive`, 매일 1회)이 자동으로 등록된다 — Vercel 대시보드의 **Cron Jobs** 탭에서 확인 가능.

## 무료 티어 제약과 한계

- **Supabase 프로젝트 일시정지**: 무료 프로젝트는 약 7일간 API 호출이 없으면 자동으로 일시정지된다. `vercel.json`의 Cron이 매일 `/api/cron/keepalive`를 호출해 이를 방지한다. 그럼에도 오래 방치하면(Vercel Cron 자체가 오래 비활성 배포에서 멈출 수 있음) 일시정지될 수 있으며, 이 경우 Supabase 대시보드에서 **Restore project** 버튼으로 수동 복구해야 한다(데이터는 보존됨).
- **Supabase 기본 메일 발송 제한**: 시간당 발송 가능한 이메일 수가 매우 적다(정확한 한도는 프로젝트마다 다를 수 있음). 이제 메일은 **가입/비밀번호 재설정 때만** 발송되고 평소 로그인은 비밀번호로 하므로 이 제약에 걸릴 일이 크게 줄었다. 그래도 짧은 시간에 가입/재설정을 여러 번 시도하면 발송이 막힐 수 있다. 도메인을 구입하면 Resend 등 커스텀 SMTP로 전환해 이 제약을 없앨 수 있다(위 "인증 메일 발송" 참고).
- **Vercel Hobby(무료) 티어**: 서버리스 함수 실행 시간·대역폭에 제한이 있다. 개인 프로젝트 트래픽 범위에서는 문제되지 않는다. Cron은 Hobby 플랜에서 하루 1회 빈도로 제한된다.
- **Supabase 무료 DB 용량**: 500MB — 개인 습관 데이터 규모에서는 사실상 문제되지 않는다.

## 스트릭 계산 규칙

구현: `src/lib/date/streak.ts` (단위 테스트: `src/lib/date/__tests__/streak.test.ts`)

공통 원칙:
- "오늘"은 아직 하루가 끝나지 않았으므로, 오늘 체크를 안 했다고 스트릭이 끊기지는 않는다. 다만 오늘 체크하면 당연히 포함된다.
- 미래 날짜는 스트릭 계산에 포함하지 않는다.

반복 유형별 규칙:
- **매일**: 오늘부터 거슬러 올라가며 연속 완료 일수를 센다. 하루라도 빠지면 그 지점에서 끊긴다.
- **특정 요일**: 지정된 요일만 "해당 날짜"로 보고 연속 완료 여부를 센다. 해당하지 않는 요일은 건너뛴다(스트릭에 영향 없음).
- **격일**: 루틴 생성일(anchor_date)로부터 이틀 간격의 날짜만 "해당 날짜"로 본다. 나머지는 특정 요일과 동일하게 처리.
- **주 N회**: 특정 요일이 정해져 있지 않아 "일" 단위가 아니라 "주"(월~일) 단위로 집계한다. 그 주 완료 횟수가 목표(N) 이상이면 그 주는 "성공". 연속 스트릭 = 연속으로 성공한 주의 수. 진행 중인 이번 주는 아직 목표를 못 채웠어도 실패로 보지 않고 계산에서 제외한다(주가 끝나야 성공/실패가 확정된다).

루틴을 수정(이름 변경 등)하거나 보관해도 `routine_logs`(그날의 완료 기록)는 그대로 남아있어 과거 스트릭·잔디 기록이 훼손되지 않는다.

## 프로젝트 구조 / 데이터 모델

자세한 내용은 [`docs/spec.md`](./docs/spec.md) 참고.

## 최종 검수 결과

[`docs/qa-checklist.md`](./docs/qa-checklist.md)에 PLAN.md 최종 검수 체크리스트 9개 항목을 하나씩 점검한 결과가 있다. 코드/테스트로 확인 가능한 항목은 검증 완료했고, RLS 교차 확인처럼 실제 두 계정이 필요한 항목은 사용자가 직접 확인해야 한다고 표시해뒀다.
