/**
 * "오늘"이 언제인지 정의하는 단일 지점.
 *
 * 이 앱의 모든 날짜 관련 기능(오늘 목록, 루틴 자동 생성, 스트릭 계산)은
 * 반드시 이 모듈을 통해서만 "오늘 날짜"를 얻어야 한다. `new Date()`를 직접
 * 비교하거나 UTC 타임스탬프만으로 날짜를 판단하면 자정 근처(특히 한국시간
 * 자정~새벽)에 날짜가 하루 밀리는 버그가 생긴다.
 *
 * 규칙: 사용자가 설정한 "하루 시작 시각"(day_start_hour, 기본 새벽 4시) 이전에
 * 발생한 이벤트는 전날 날짜로 집계한다. 예) day_start_hour=4일 때 00:10에 체크한
 * 할 일은 전날 몫으로 기록된다.
 */

const DATE_STRING_RE = /^\d{4}-\d{2}-\d{2}$/;

/** YYYY-MM-DD 형식의 날짜 문자열. DB의 date 컬럼과 1:1로 대응한다. */
export type LocalDateString = string;

/**
 * 주어진 시각(instant)을 특정 타임존의 "달력 날짜"로 변환하되,
 * dayStartHour 이전이면 전날로 당긴다.
 */
export function getLocalDateString(
  instant: Date,
  timezone: string,
  dayStartHour: number,
): LocalDateString {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);

  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = get("hour");

  const dateStr = toDateString(year, month, day);

  if (hour < dayStartHour) {
    return addDaysToDateString(dateStr, -1);
  }

  return dateStr;
}

/** 지금 이 순간 기준의 "오늘" 날짜. */
export function getCurrentLocalDateString(
  timezone: string,
  dayStartHour: number,
): LocalDateString {
  return getLocalDateString(new Date(), timezone, dayStartHour);
}

/** dateStr에 days만큼 더한(음수면 뺀) 날짜 문자열을 반환. */
export function addDaysToDateString(
  dateStr: LocalDateString,
  days: number,
): LocalDateString {
  assertDateString(dateStr);
  const [y, m, d] = dateStr.split("-").map(Number);
  // 정오(UTC)를 기준으로 계산해 DST 등 타임존 이슈 없이 순수 달력 연산만 수행한다.
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  date.setUTCDate(date.getUTCDate() + days);
  return toDateString(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

/** 두 날짜 문자열 사이의 일수 차이(a - b). */
export function diffInDays(a: LocalDateString, b: LocalDateString): number {
  assertDateString(a);
  assertDateString(b);
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const aUtc = Date.UTC(ay, am - 1, ad, 12);
  const bUtc = Date.UTC(by, bm - 1, bd, 12);
  return Math.round((aUtc - bUtc) / (1000 * 60 * 60 * 24));
}

/** 날짜 문자열의 요일. 0=일요일 ... 6=토요일. */
export function getWeekday(dateStr: LocalDateString): number {
  assertDateString(dateStr);
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
}

export function isDateStringBefore(a: LocalDateString, b: LocalDateString): boolean {
  return diffInDays(a, b) < 0;
}

export function isDateStringAfter(a: LocalDateString, b: LocalDateString): boolean {
  return diffInDays(a, b) > 0;
}

function toDateString(year: number, month: number, day: number): LocalDateString {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function assertDateString(value: string): asserts value is LocalDateString {
  if (!DATE_STRING_RE.test(value)) {
    throw new Error(`Invalid LocalDateString: "${value}" (expected YYYY-MM-DD)`);
  }
}
