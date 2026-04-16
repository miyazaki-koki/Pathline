import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSettingsStore } from "./settingsStore";

type ChangeHandler = (
  changes: Record<string, { newValue?: unknown }>,
  area: string,
) => void;

describe("SettingsStore", () => {
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

  it("storage に mode=classic → classic を返す", async () => {
    getMock.mockResolvedValue({ mode: "classic" });
    const s = createSettingsStore();
    expect(await s.load()).toEqual({ mode: "classic" });
  });

  it("storage 値なし → flexible 既定", async () => {
    getMock.mockResolvedValue({});
    const s = createSettingsStore();
    expect(await s.load()).toEqual({ mode: "flexible" });
  });

  it("不正値 → flexible にフォールバック", async () => {
    getMock.mockResolvedValue({ mode: "bogus" });
    const s = createSettingsStore();
    expect(await s.load()).toEqual({ mode: "flexible" });
  });

  it("storage 読み込み例外 → flexible にフォールバック", async () => {
    getMock.mockRejectedValue(new Error("nope"));
    const s = createSettingsStore();
    expect(await s.load()).toEqual({ mode: "flexible" });
  });

  it("onChange listener が storage 変更で呼ばれる", () => {
    const s = createSettingsStore();
    const cb = vi.fn();
    s.onChange(cb);
    [...listeners][0]?.({ mode: { newValue: "classic" } }, "local");
    expect(cb).toHaveBeenCalledWith("classic");
  });

  it("chrome 非存在環境でも動作 (file:// やテスト環境)", async () => {
    delete (globalThis as unknown as { chrome?: unknown }).chrome;
    const s = createSettingsStore();
    expect(await s.load()).toEqual({ mode: "flexible" });
  });
});
