import { describe, it, expect, vi, afterEach } from "vitest";
import { nowIso, daysAgo, formatDate, relativeTime } from "../date";

describe("nowIso", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a valid ISO string", () => {
    const result = nowIso();
    expect(new Date(result).toISOString()).toBe(result);
  });

  it("returns the current time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T10:00:00.000Z"));
    expect(nowIso()).toBe("2026-01-15T10:00:00.000Z");
  });
});

describe("daysAgo", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns an ISO string for 0 days ago (now)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T12:00:00.000Z"));
    expect(daysAgo(0)).toBe("2026-06-01T12:00:00.000Z");
  });

  it("returns an ISO string for 1 day ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-10T12:00:00.000Z"));
    const result = new Date(daysAgo(1));
    expect(result.toISOString()).toBe("2026-06-09T12:00:00.000Z");
  });

  it("returns an ISO string for 30 days ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-30T00:00:00.000Z"));
    const result = new Date(daysAgo(30));
    expect(result.toISOString()).toBe("2026-05-31T00:00:00.000Z");
  });
});

describe("formatDate", () => {
  it("formats a date as 'Mon day, year'", () => {
    const result = formatDate("2026-03-15T00:00:00.000Z");
    expect(result).toMatch(/Mar\s+15,\s+2026/);
  });

  it("formats another date correctly", () => {
    const result = formatDate("2025-12-25T10:30:00.000Z");
    expect(result).toMatch(/Dec\s+25,\s+2025/);
  });
});

describe("relativeTime", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'just now' for less than 2 minutes ago", () => {
    vi.useFakeTimers();
    const now = new Date("2026-06-10T12:00:00.000Z");
    vi.setSystemTime(now);
    const oneMinAgo = new Date(now.getTime() - 60 * 1000).toISOString();
    expect(relativeTime(oneMinAgo)).toBe("just now");
  });

  it("returns minutes for 2-59 minutes ago", () => {
    vi.useFakeTimers();
    const now = new Date("2026-06-10T12:00:00.000Z");
    vi.setSystemTime(now);
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    expect(relativeTime(fiveMinAgo)).toBe("5 min ago");
  });

  it("returns hours for 1-23 hours ago", () => {
    vi.useFakeTimers();
    const now = new Date("2026-06-10T12:00:00.000Z");
    vi.setSystemTime(now);
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
    expect(relativeTime(threeHoursAgo)).toBe("3 hr ago");
  });

  it("returns days for 1-6 days ago", () => {
    vi.useFakeTimers();
    const now = new Date("2026-06-10T12:00:00.000Z");
    vi.setSystemTime(now);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    expect(relativeTime(oneDayAgo)).toBe("1 day ago");
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(relativeTime(threeDaysAgo)).toBe("3 days ago");
  });

  it("falls back to formatted date for 7+ days ago", () => {
    vi.useFakeTimers();
    const now = new Date("2026-06-10T12:00:00.000Z");
    vi.setSystemTime(now);
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const result = relativeTime(tenDaysAgo);
    expect(result).toMatch(/May\s+31,\s+2026/);
  });
});
