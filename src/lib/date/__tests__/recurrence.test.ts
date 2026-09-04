import { describe, expect, it } from "vitest";
import { isRoutineDueOn } from "../recurrence";

describe("isRoutineDueOn", () => {
  it("daily는 항상 해당한다", () => {
    expect(isRoutineDueOn("daily", {}, "2026-01-15")).toBe(true);
    expect(isRoutineDueOn("daily", {}, "2026-12-25")).toBe(true);
  });

  it("weekday는 지정된 요일에만 해당한다", () => {
    // 2026-01-15 는 목요일(4), 2026-01-18 은 일요일(0)
    expect(isRoutineDueOn("weekday", { weekdays: [1, 3, 5] }, "2026-01-15")).toBe(false);
    expect(isRoutineDueOn("weekday", { weekdays: [4] }, "2026-01-15")).toBe(true);
    expect(isRoutineDueOn("weekday", { weekdays: [0] }, "2026-01-18")).toBe(true);
  });

  it("every_other_day는 anchor_date로부터 이틀 간격으로 해당한다", () => {
    const config = { anchor_date: "2026-01-01" };
    expect(isRoutineDueOn("every_other_day", config, "2026-01-01")).toBe(true);
    expect(isRoutineDueOn("every_other_day", config, "2026-01-02")).toBe(false);
    expect(isRoutineDueOn("every_other_day", config, "2026-01-03")).toBe(true);
    expect(isRoutineDueOn("every_other_day", config, "2026-01-04")).toBe(false);
  });

  it("every_other_day는 anchor_date 이전 날짜에는 해당하지 않는다", () => {
    const config = { anchor_date: "2026-01-10" };
    expect(isRoutineDueOn("every_other_day", config, "2026-01-08")).toBe(false);
  });

  it("weekly_n은 특정 요일이 없어 매일 해당한다", () => {
    expect(isRoutineDueOn("weekly_n", { times_per_week: 3 }, "2026-01-15")).toBe(true);
    expect(isRoutineDueOn("weekly_n", { times_per_week: 3 }, "2026-01-19")).toBe(true);
  });
});
