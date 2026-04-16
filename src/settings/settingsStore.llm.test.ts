import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSettingsStore } from "./settingsStore";

type ChangeHandler = (
  changes: Record<string, { newValue?: unknown }>,
  area: string,
) => void;

describe("SettingsStore llm extension (task 4)", () => {
  let getMock: ReturnType<typeof vi.fn>;
  let listeners: Set<ChangeHandler>;

  beforeEach(() => {
    getMock = vi.fn();
    listeners = new Set();
    (globalThis as unknown as { chrome: unknown }).chrome = {
      storage: {
        local: { get: getMock },
        onChanged: {
          addListener: (cb: ChangeHandler) => listeners.add(cb),
          removeListener: (cb: ChangeHandler) => listeners.delete(cb),
        },
      },
    };
  });
  afterEach(() => {
    delete (globalThis as unknown as { chrome?: unknown }).chrome;
  });

  it("storage に llm=off → off を返す", async () => {
    getMock.mockResolvedValue({ mode: "flexible", llm: "off" });
    const s = createSettingsStore();
    const result = await s.load();
    expect(result.llm).toBe("off");
  });

  it("storage に llm=auto → auto を返す", async () => {
    getMock.mockResolvedValue({ mode: "flexible", llm: "auto" });
    const s = createSettingsStore();
    expect((await s.load()).llm).toBe("auto");
  });

  it("storage に llm 未定義 → auto 既定", async () => {
    getMock.mockResolvedValue({ mode: "flexible" });
    const s = createSettingsStore();
    expect((await s.load()).llm).toBe("auto");
  });

  it("llm に不正値 → auto にフォールバック", async () => {
    getMock.mockResolvedValue({ mode: "flexible", llm: "" });
    const s = createSettingsStore();
    expect((await s.load()).llm).toBe("auto");
  });

  it("mode は従来通り独立して読み書きできる", async () => {
    getMock.mockResolvedValue({ mode: "classic", llm: "off" });
    const s = createSettingsStore();
    const result = await s.load();
    expect(result.mode).toBe("classic");
    expect(result.llm).toBe("off");
  });

  it("llm 変更で onChange listener が呼ばれる", () => {
    const s = createSettingsStore();
    const cb = vi.fn();
    s.onChange(cb);
    [...listeners][0]?.({ llm: { newValue: "off" } }, "local");
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb.mock.calls[0][0]).toHaveProperty("llm", "off");
  });

  it("dispose() 後は listener が呼ばれない", () => {
    const s = createSettingsStore();
    const cb = vi.fn();
    const { dispose } = s.onChange(cb);
    dispose();
    [...listeners][0]?.({ llm: { newValue: "off" } }, "local");
    expect(cb).not.toHaveBeenCalled();
  });
});
