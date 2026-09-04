import { describe, expect, it } from "vitest";
import {
  addDaysToDateString,
  diffInDays,
  getLocalDateString,
  getWeekday,
  isDateStringAfter,
  isDateStringBefore,
} from "../local-date";

const KST = "Asia/Seoul";

describe("getLocalDateString", () => {
  it("day_start_hour 이후면 당일 날짜를 반환한다", () => {
    // 2026-01-15 09:00 KST
    const instant = new Date("2026-01-15T00:00:00Z"); // UTC+9 => 09:00 KST
    expect(getLocalDateString(instant, KST, 4)).toBe("2026-01-15");
  });

  it("자정 직후(00:10)에 체크하면 전날로 집계된다 — 최종 검수 체크리스트 항목", () => {
    // 2026-01-15 00:10 KST
    const instant = new Date("2026-01-14T15:10:00Z"); // UTC+9 => 2026-01-15 00:10 KST
    expect(getLocalDateString(instant, KST, 4)).toBe("2026-01-14");
  });

  it("자정 직전(23:50)에 체크하면 당일로 집계된다 — 최종 검수 체크리스트 항목", () => {
    // 2026-01-14 23:50 KST
    const instant = new Date("2026-01-14T14:50:00Z"); // UTC+9 => 2026-01-14 23:50 KST
    expect(getLocalDateString(instant, KST, 4)).toBe("2026-01-14");
  });

  it("day_start_hour(새벽 4시) 정각은 당일로 집계된다", () => {
    // 2026-01-15 04:00 KST
    const instant = new Date("2026-01-14T19:00:00Z");
    expect(getLocalDateString(instant, KST, 4)).toBe("2026-01-15");
  });

  it("day_start_hour 3시 59분은 전날로 집계된다", () => {
    // 2026-01-15 03:59 KST
    const instant = new Date("2026-01-14T18:59:00Z");
    expect(getLocalDateString(instant, KST, 4)).toBe("2026-01-14");
  });

  it("월/연도 경계를 넘어가도 정확히 롤백된다", () => {
    // 2026-01-01 02:00 KST -> 2025-12-31
    const instant = new Date("2025-12-31T17:00:00Z");
    expect(getLocalDateString(instant, KST, 4)).toBe("2025-12-31");
  });

  it("day_start_hour=0 이면 자정부터 바로 당일로 집계된다", () => {
    const instant = new Date("2026-01-14T15:00:00Z"); // 2026-01-15 00:00 KST
    expect(getLocalDateString(instant, KST, 0)).toBe("2026-01-15");
  });
});

describe("addDaysToDateString", () => {
  it("일반적인 날짜 더하기/빼기", () => {
    expect(addDaysToDateString("2026-01-15", 1)).toBe("2026-01-16");
    expect(addDaysToDateString("2026-01-15", -1)).toBe("2026-01-14");
  });

  it("월 경계를 넘어간다", () => {
    expect(addDaysToDateString("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDaysToDateString("2026-02-01", -1)).toBe("2026-01-31");
  });

  it("연 경계를 넘어간다", () => {
    expect(addDaysToDateString("2025-12-31", 1)).toBe("2026-01-01");
  });

  it("윤년 2월을 올바르게 처리한다", () => {
    expect(addDaysToDateString("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDaysToDateString("2028-02-29", 1)).toBe("2028-03-01");
  });
});

describe("diffInDays / isDateStringBefore / isDateStringAfter", () => {
  it("두 날짜의 차이를 정확히 계산한다", () => {
    expect(diffInDays("2026-01-20", "2026-01-15")).toBe(5);
    expect(diffInDays("2026-01-15", "2026-01-20")).toBe(-5);
    expect(diffInDays("2026-01-15", "2026-01-15")).toBe(0);
  });

  it("전후 비교가 정확하다", () => {
    expect(isDateStringBefore("2026-01-14", "2026-01-15")).toBe(true);
    expect(isDateStringAfter("2026-01-16", "2026-01-15")).toBe(true);
    expect(isDateStringBefore("2026-01-15", "2026-01-15")).toBe(false);
  });
});

describe("getWeekday", () => {
  it("알려진 날짜의 요일을 정확히 반환한다", () => {
    // 2026-01-15 은 목요일(4)
    expect(getWeekday("2026-01-15")).toBe(4);
    // 2026-01-18 은 일요일(0)
    expect(getWeekday("2026-01-18")).toBe(0);
  });
});
