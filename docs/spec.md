# 뭐라도해야지 — 데이터 모델 & 기능 명세

> 확정된 내용을 담는 living 문서. 마일스톤이 진행될 때마다 갱신한다. 원본 기획은 `/PLAN.md` 참고.

현재 상태: **M2 완료 → M3 진행 예정**

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
| `/login` | M0: 매직링크 구현 완료, 실제 배포 환경에서 로그인 확인됨. 구글 로그인은 이후 추가 |
| `/today` | M1: 할 일 CRUD·체크·순서변경·진행률 구현 완료. M2: 오늘 해당 루틴이 함께 표시되고 체크 가능, 스트릭 배지 표시 |
| `/routines` | M2: 루틴 생성·수정·보관 구현 완료 |
| `/stats` | 미구현 (M3) |
| `/settings` | 미구현 (M4) |

## M2에서의 설계 결정

- **오늘 화면에서 루틴은 체크만 가능**, 이름/반복주기 수정은 `/routines`에서만 한다. 템플릿 편집은 오늘 하루만의 일이 아니라 미래 전체에 영향을 주는 작업이라 화면을 분리했다.
- **오늘 목록에서 루틴은 상단(미완료 기준) 고정, 할 일은 그 아래 드래그 정렬 가능** 구조로 구현했다. 루틴과 할 일을 완전히 자유롭게 섞어서 드래그 정렬하려면 별도의 "그날의 순서" 테이블이 필요해 범위를 넘어선다고 판단, 하나의 화면(하나의 목록)으로 합쳐 보여주는 요구사항은 만족하되 정렬은 이 정도 선에서 절충했다.
- **주 N회 루틴은 특정 요일이 없어 매일 오늘 목록에 뜬다.** 몇 번을 채웠는지는 스트릭 계산에서 주 단위로만 판정한다.
