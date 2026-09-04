# 뭐라도해야지 (mworado)

매일 해야 할 일을 등록하고 완료를 체크하며, 반복 루틴의 꾸준함을 잔디 그래프로 확인하는 개인용 데일리 체크 웹앱.

> 이 문서는 마일스톤이 진행될 때마다 함께 갱신됩니다. 현재 상태: **M0 — 셋업**

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
6. 왼쪽 메뉴 **Authentication → Sign In / Providers** 에서 **Email** provider가 켜져 있는지 확인. "Confirm email"은 매직링크 흐름에서는 꺼둬도 무방(매직링크 자체가 확인 역할을 한다).
7. 왼쪽 메뉴 **Authentication → URL Configuration** 에서:
   - **Site URL**: 로컬 개발 중엔 `http://localhost:3000`, 배포 후에는 Vercel 배포 URL로 교체.
   - **Redirect URLs**에 다음 두 개를 추가: `http://localhost:3000/auth/callback` 와 배포 후 `https://<vercel 도메인>/auth/callback`.

## 매직링크 이메일 발송

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
- **Supabase 기본 메일 발송 제한**: 시간당 발송 가능한 이메일 수가 매우 적다(정확한 한도는 프로젝트마다 다를 수 있음). 개인용으로는 대체로 충분하지만, 짧은 시간에 로그인을 여러 번 반복 시도하면 발송이 막힐 수 있다. 도메인을 구입하면 Resend 등 커스텀 SMTP로 전환해 이 제약을 없앨 수 있다(위 "매직링크 이메일 발송" 참고).
- **Vercel Hobby(무료) 티어**: 서버리스 함수 실행 시간·대역폭에 제한이 있다. 개인 프로젝트 트래픽 범위에서는 문제되지 않는다. Cron은 Hobby 플랜에서 하루 1회 빈도로 제한된다.
- **Supabase 무료 DB 용량**: 500MB — 개인 습관 데이터 규모에서는 사실상 문제되지 않는다.

## 스트릭 계산 규칙

> M2(루틴)에서 구현과 함께 이 섹션이 채워집니다.

## 프로젝트 구조 / 데이터 모델

자세한 내용은 [`docs/spec.md`](./docs/spec.md) 참고.
