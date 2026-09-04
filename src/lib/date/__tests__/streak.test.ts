import { describe, expect, it } from "vitest";
import { calcCurrentStreak } from "../streak";

describe("calcCurrentStreak — daily", () => {
  it("오늘까지 연속 완료면 그 일수만큼 스트릭이다", () => {
    const dates = new Set(["2026-01-13", "2026-01-14", "2026-01-15"]);
    expect(calcCurrentStreak("daily", {}, dates, "2026-01-15")).toBe(3);
  });

  it("오늘 아직 안 했어도 끊기지 않는다(유예)", () => {
    const dates = new Set(["2026-01-13", "2026-01-14"]);
    expect(calcCurrentStreak("daily", {}, dates, "2026-01-15")).toBe(2);
  });

  it("하루라도 빠지면 그 지점에서 끊긴다", () => {
    const dates = new Set(["2026-01-13", "2026-01-15"]); // 14가 빠짐
    expect(calcCurrentStreak("daily", {}, dates, "2026-01-15")).toBe(1);
  });

  it("기록이 하나도 없으면 0이다", () => {
    expect(calcCurrentStreak("daily", {}, new Set(), "2026-01-15")).toBe(0);
  });
});

describe("calcCurrentStreak — weekday (월/수/금)", () => {
  const config = { weekdays: [1, 3, 5] };

  it("해당 요일에만 연속으로 완료했으면 스트릭에 포함된다", () => {
    // 2026-01-12(월) 14(수) 16(금)
    const dates = new Set(["2026-01-12", "2026-01-14", "2026-01-16"]);
    expect(calcCurrentStreak("weekday", config, dates, "2026-01-16")).toBe(3);
  });

  it("해당하지 않는 요일은 건너뛰고 영향을 주지 않는다", () => {
    const dates = new Set(["2026-01-12", "2026-01-14", "2026-01-16"]);
    // 화/목/토/일에 체크 기록이 없어도 스트릭은 그대로 3
    expect(calcCurrentStreak("weekday", config, dates, "2026-01-17")).toBe(3);
  });

  it("오늘이 해당 요일인데 아직 안 했으면 유예된다", () => {
    const dates = new Set(["2026-01-12", "2026-01-14"]);
    expect(calcCurrentStreak("weekday", config, dates, "2026-01-16")).toBe(2);
  });

  it("해당 요일에 빠지면 그 지점에서 끊긴다", () => {
    // 수(14)가 빠짐
    const dates = new Set(["2026-01-12", "2026-01-16"]);
    expect(calcCurrentStreak("weekday", config, dates, "2026-01-16")).toBe(1);
  });
});

describe("calcCurrentStreak — every_other_day", () => {
  const config = { anchor_date: "2026-01-01" };

  it("이틀 간격으로 연속 완료 시 스트릭에 포함된다", () => {
    const dates = new Set(["2026-01-11", "2026-01-13", "2026-01-15"]);
    expect(calcCurrentStreak("every_other_day", config, dates, "2026-01-15")).toBe(3);
  });

  it("간격 사이 날짜는 스트릭에 영향 없다", () => {
    const dates = new Set(["2026-01-13", "2026-01-15"]);
    // 14는애초에 해당 날짜가 아니므로 기록 여부와 무관
    expect(calcCurrentStreak("every_other_day", config, dates, "2026-01-15")).toBe(2);
  });

  it("해당 날짜에 빠지면 끊긴다", () => {
    const dates = new Set(["2026-01-15"]); // 13이 빠짐
    expect(calcCurrentStreak("every_other_day", config, dates, "2026-01-15")).toBe(1);
  });
});

describe("calcCurrentStreak — weekly_n (주 3회)", () => {
  const config = { times_per_week: 3 };

  it("이번 주와 지난 주 모두 목표를 채우면 연속 2주다", () => {
    // 2026-01-14(수) 기준 이번 주(월 1/12 시작): 1/12,13,14 완료
    // 지난 주(월 1/5 시작): 1/5,7,9 완료
    const dates = new Set([
      "2026-01-12",
      "2026-01-13",
      "2026-01-14",
      "2026-01-05",
      "2026-01-07",
      "2026-01-09",
    ]);
    expect(calcCurrentStreak("weekly_n", config, dates, "2026-01-14")).toBe(2);
  });

  it("이번 주가 아직 목표 미달이어도 실패로 안 보고 보류한다", () => {
    // 이번 주(월 1/12 시작)엔 1회만 완료, 지난 주는 3회 완료
    const dates = new Set(["2026-01-12", "2026-01-05", "2026-01-07", "2026-01-09"]);
    expect(calcCurrentStreak("weekly_n", config, dates, "2026-01-14")).toBe(1);
  });

  it("지난 주가 목표 미달이면 스트릭이 끊긴다", () => {
    const dates = new Set(["2026-01-12", "2026-01-13", "2026-01-14", "2026-01-05"]);
    expect(calcCurrentStreak("weekly_n", config, dates, "2026-01-14")).toBe(1);
  });
});
