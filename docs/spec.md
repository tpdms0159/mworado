# 뭐라도해야지 — 데이터 모델 & 기능 명세

> 확정된 내용을 담는 living 문서. 마일스톤이 진행될 때마다 갱신한다. 원본 기획은 `/PLAN.md` 참고.

현재 상태: **M5(검수) 완료** — 검수 결과는 [`qa-checklist.md`](./qa-checklist.md) 참고.

## 데이터 모델

### profiles

`auth.users`와 1:1. 신규 가입 시 트리거로 자동 생성된다 (`0001_profiles.sql`).

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | auth.users(id) 참조 |
| timezone | text | 기본 `Asia/Seoul` |
| day_start_hour | smallint | 하루 시작 시각(0~23), 기본 4 |
| theme | text | `system` / `light` / `dark` |

### routines (루틴 템플릿)

반복 할 일의 "정의"만 담는다. 그날그날의 완료 여부는 `routine_logs`에 별도 저장 — 템플릿을 수정/보관/삭제해도 과거 기록은 훼손되지 않는다.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| name | text | 1~100자 |
| repeat_type | text | `daily` / `weekday` / `weekly_n` / `every_other_day` |
| repeat_config | jsonb | 아래 참고 |
| sort_order | int | |
| archived_at | timestamptz \| null | 보관 — 활성 목록에서만 제외, 기록 유지 |
| deleted_at | timestamptz \| null | soft delete — 물리 삭제 없음 |

`repeat_config` 형태:
- `daily`: `{}`
- `weekday`: `{ "weekdays": [1,3,5] }` (0=일 ~ 6=토)
- `weekly_n`: `{ "times_per_week": 3 }`
- `every_other_day`: `{ "anchor_date": "2026-01-01" }`

### routine_logs (루틴의 그날 기록)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| routine_id | uuid FK → routines | |
| user_id | uuid FK | RLS 단순화를 위해 비정규화 |
| log_date | date | **사용자 로컬 날짜**. UTC 타임스탬프 아님 |
| completed | boolean | |
| completed_at | timestamptz | |

unique(routine_id, log_date)

### todos (일회성 할 일)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| title | text | 1~200자 |
| todo_date | date | 사용자 로컬 날짜 |
| completed | boolean | |
| completed_at | timestamptz | |
| sort_order | int | |
| deleted_at | timestamptz \| null | soft delete — 5초 실행취소 + 내보내기 무결성 |

### RLS

모든 테이블에 RLS 활성화, `auth.uid() = user_id` (profiles는 `= id`) 패턴. 정책 SQL: `supabase/migrations/0005_rls_policies.sql`.

### 오늘 목록 (통합 조회)

저장은 `todos`(해당 날짜)와 `routines`(오늘 해당하는 것) + `routine_logs`(오늘 완료 여부)로 분리되어 있지만, 사용자에게는 하나의 정렬된 목록으로 합쳐서 보여준다. 구현 위치: `src/server/queries/today.ts` (M1에서 작성).

### 잔디 그래프 집계

저장 뷰 없이 요청 시점에 `todos`/`routine_logs`를 `log_date`/`todo_date` 기준으로 GROUP BY하여 계산한다. 사용자당 1년(365일) 규모라 인덱스(`idx_routine_logs_user_date`, `idx_todos_user_date`)만으로 충분히 빠르다.

## 날짜 처리

모든 "오늘"은 `src/lib/date/local-date.ts`의 `getCurrentLocalDateString(timezone, dayStartHour)`를 통해서만 얻는다. `new Date()`를 직접 비교하지 않는다.

규칙: `day_start_hour`(기본 새벽 4시) 이전에 발생한 이벤트는 전날 날짜로 집계한다. 예) 00:10에 체크 → 전날 몫. 23:50에 체크 → 당일 몫.

## 스트릭 계산 규칙

README "스트릭 계산 규칙" 절 참고. 구현: `src/lib/date/streak.ts`, 판정 로직: `src/lib/date/recurrence.ts`.

## 화면 / 기능 상태

| 화면 | 상태 |
|---|---|
| `/` 랜딩 | M0: 자리표시. M4에서 실제 스크린샷/카피로 완성 |
| `/demo` | 미구현 (M4) |
| `/login` | 이메일 + 비밀번호 로그인. 구글 로그인은 이후 추가 |
| `/signup` | 이메일로 가입 링크 발송 (2026-09-07 추가) |
| `/forgot-password` | 비밀번호 재설정 링크 발송 (2026-09-07 추가) |
| `/account/set-password` | 가입/재설정 링크로 도착해 비밀번호 설정. 설정 화면의 "비밀번호 변경"에서도 진입 (2026-09-07 추가) |
| `/today` | M1: 할 일 CRUD·체크·순서변경·진행률 구현 완료. M2: 오늘 해당 루틴이 함께 표시되고 체크 가능, 스트릭 배지 표시 |
| `/routines` | M2: 루틴 생성·수정·보관 구현 완료 |
| `/stats` | M3: 잔디 그래프, 현재/최장 연속일, 최근 30일 완료율, 루틴별 달성률 막대, 빈 상태 구현 완료. 2026-09-07: 잔디 칸 클릭 시 그 날짜에 등록됐던 할 일·루틴 목록(완료 여부 포함)을 펼쳐 보여줌 |
| `/settings` | M4: 하루 시작 시각, 테마, JSON 내보내기, 계정 삭제 구현 완료. 2026-09-07: "비밀번호 변경" 링크 추가 |

## 지난 날짜 할 일 조회 — 2026-09-07 추가

`/today`는 "오늘"만 보여줘서 하루가 지나면 그날 할 일을 볼 수 없었다. 별도 날짜 이동 화면(P1)을 만드는 대신, **기록(`/stats`)의 잔디 그래프 칸을 눌러** 그 날짜에 등록됐던 항목을 확인하는 방식으로 처리.

- `getStatsView`가 반환하는 `dayDetails: Record<날짜, { todos, routines }>` — 항목이 하나라도 있던 날짜만 키로 담는다. 각 항목은 `{ title, completed }`.
- 잔디 범위(최근 365일) 내 todos를 `title, completed, sort_order`까지 조회해 날짜별로 묶고, 루틴은 기존 "그날 due 판정" 루프에서 이름·완료여부를 같이 수집한다. 추가 쿼리 없음.
- `GrassGraph`(클라이언트): 칸 클릭 시 그 아래에 상세 패널(요일 표시 + 루틴/할 일 그룹, 완료 항목은 체크 + 취소선). 같은 칸을 다시 누르거나 × 로 닫는다. hover는 기존처럼 한 줄 요약만 갱신.
- 읽기 전용 — 여기서 과거 할 일을 체크/수정하지는 않는다.

## 인증(로그인) 흐름 — 2026-09-07 개편

매직링크 전용에서 **이메일 + 비밀번호** 방식으로 전환. "매번 메일 받기"가 번거롭고 Supabase 기본 메일의 시간당 발송 한도에 자주 걸리는 문제를 해결하기 위함.

- **가입** (`/signup` → `sendSignUpLink`): `signInWithOtp({ shouldCreateUser: true })`로 링크 발송. 매직링크 메커니즘을 그대로 재사용하되 `emailRedirectTo`를 `/auth/callback?next=/account/set-password`로 지정.
- **콜백** (`/auth/callback`): `exchangeCodeForSession`으로 세션 수립 후 `next`로 이동. `next`는 `/`로 시작하고 `//`가 아닌 내부 경로만 허용(open redirect 방지). 실패 시 `/login?error=auth`.
- **비밀번호 설정** (`/account/set-password` → `setPassword`): 세션이 있는 상태에서 `updateUser({ password })`. 8자 이상 + 확인 일치 검증. 성공 시 `/today`. 이 화면은 가입·재설정·(설정에서) 비밀번호 변경 세 경우가 공유한다.
- **로그인** (`/login` → `signInWithPassword`): 이메일+비밀번호. 성공 시 `next`(기본 `/today`)로 `redirect()`. 프록시가 붙여준 `?next=`를 hidden input으로 전달.
- **비밀번호 재설정** (`/forgot-password` → `sendPasswordResetLink`): `resetPasswordForEmail`. 계정 존재 여부를 노출하지 않기 위해 에러가 없으면 항상 "보냈어요"로 응답.
- **프록시**(`src/proxy.ts`): 보호 프리픽스에 `/account` 추가. 이미 로그인한 사용자가 `/login`·`/signup`·`/forgot-password`에 오면 `/today`로 보냄(`/account/set-password`는 제외 — 로그인 상태에서 접근하는 화면이라서).
- 서버 액션은 기존 코드 스타일에 맞춰 zod 없이 수동 검증. 관련 파일: `src/server/actions/auth.ts`, `src/components/auth/*`.
- Supabase 대시보드: Email provider의 "Confirm email"과 비밀번호 로그인이 켜져 있어야 함. 가입 링크는 "Magic Link" 이메일 템플릿을 쓰므로 문구를 다듬는 게 좋음(README 참고).

## M4에서의 설계 결정

- **포인트 컬러 도입**: shadcn 초기화 시 기본값이 완전 무채색이라 PLAN.md의 "포인트 컬러 1개 + 무채색" 요구와 어긋나 있었다. 차분한 세이지 그린(`oklch(0.52 0.1 152)`, 다크모드 `oklch(0.75 0.13 152)`)을 `--primary`로 지정해 버튼·체크·잔디 농도 전부에 일관되게 반영되게 했다.
- **파비콘/앱 아이콘**: "뭐" 한 글자 대신 체크 아이콘(둥근 사각형 배경 + 체크 마크)을 채택. Next.js의 `icon.tsx`/`apple-icon.tsx`/`opengraph-image.tsx` 파일 컨벤션으로 동적 생성해 별도 이미지 에셋 파일 없이 처리했다.
- **랜딩 페이지 시각 자료**: 실제 스크린샷 대신 `GrassGraph` 컴포넌트를 예시 데이터로 재사용해 보여준다. 실제 화면 스크린샷으로 교체하는 건 쉬운 후속 작업으로 남겨둔다.
- **데모 모드(`/demo`)**: 오늘 화면과 UI 컴포넌트(`TodoRow`, `SortableTodoList`, `RoutineRow` 등)는 그대로 재사용하되, 상태 관리는 서버 액션 없이 순수 로컬 `useState`로 완전히 분리했다(`DemoExperience`). 로그인 화면과 로직을 공유하지 않아 실수로 실제 데이터를 건드릴 위험이 없다.
- **테마**: `next-themes` + Tailwind `.dark` 클래스로 라이트/다크/기기설정 3단 전환을 구현. 사용자별 선호를 DB(`profiles.theme`)에 동기화하는 건 범위를 넘어선다고 보고 이번엔 로컬(브라우저) 저장만 지원한다.
- **타임존**: `/settings`에서 Asia/Seoul로 고정 표시하고 편집 UI는 만들지 않았다. 다국가 지원은 이 프로젝트 범위 밖이라 커스텀 타임존 선택 UI를 만드는 비용 대비 효용이 낮다고 판단했다.
- **반응형/Lighthouse**: 375px 기준 코드 레벨로 점검(overflow, truncate 등)했지만, 실제 기기·Chrome Lighthouse 측정은 이 세션에서 브라우저 도구를 사용하지 않아 수행하지 못했다. 배포 후 Chrome DevTools의 Lighthouse(모바일) 탭에서 실측을 권장한다.

## M3에서의 설계 결정

- **잔디 칸 완료율 계산**: 그날 `todos` + 그날 해당하는 루틴의 개수를 분모, 완료 개수를 분자로 삼아 5단계(0~4)로 나눈다. **0단계는 "그날 계획이 없었던 날"과 "계획은 있었지만 하나도 못한 날"을 구분하지 않는다** — 완료 못 한 걸 티 나게 표시하지 않는다는 제품 톤(PLAN.md)에 따른 의도적 선택.
- **전체 스트릭(현재/최장)**: 특정 루틴에 종속되지 않고 "그날 뭐라도 하나 완료했는지"를 기준으로 계산한다(daily 스트릭 규칙 재사용). 완벽하지 않아도 뭐라도 하면 스트릭이 이어진다는 서비스 철학과 일치.
- **최장 연속일은 잔디 그래프와 동일하게 최근 1년 범위 안에서만 계산**한다. 그 이상 과거 데이터를 조회하는 화면이 없어서 범위를 넘어서는 계산은 하지 않는다.
- **루틴별 달성률(최근 30일)에는 보관된 루틴도 포함**한다. 보관은 "오늘 목록에서 숨김"일 뿐 기록 삭제가 아니므로, 최근에 보관을 했어도 그 전 30일간의 실제 수행 기록은 통계에 남아야 한다는 원칙(PLAN.md 데이터 모델 원칙 1)을 따랐다. 화면에는 "(보관됨)" 표시로 구분한다.
- **날짜 칸 hover/tap 요약은 셀마다 팝오버를 띄우는 대신, 그래프 아래 한 줄로 표시**한다. 팝업 365개를 개별 관리하는 것보다 가볍고, 모바일 탭에서도 위치 계산 없이 바로 보여서 접근성도 더 낫다고 판단했다.

## M2에서의 설계 결정

- **오늘 화면에서 루틴은 체크만 가능**, 이름/반복주기 수정은 `/routines`에서만 한다. 템플릿 편집은 오늘 하루만의 일이 아니라 미래 전체에 영향을 주는 작업이라 화면을 분리했다.
- **오늘 목록에서 루틴은 상단(미완료 기준) 고정, 할 일은 그 아래 드래그 정렬 가능** 구조로 구현했다. 루틴과 할 일을 완전히 자유롭게 섞어서 드래그 정렬하려면 별도의 "그날의 순서" 테이블이 필요해 범위를 넘어선다고 판단, 하나의 화면(하나의 목록)으로 합쳐 보여주는 요구사항은 만족하되 정렬은 이 정도 선에서 절충했다.
- **주 N회 루틴은 특정 요일이 없어 매일 오늘 목록에 뜬다.** 몇 번을 채웠는지는 스트릭 계산에서 주 단위로만 판정한다.
