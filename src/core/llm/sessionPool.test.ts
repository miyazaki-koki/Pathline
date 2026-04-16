import { describe, expect, it, vi, beforeEach } from "vitest";
import { createSessionPool, type LanguageModelSession } from "./sessionPool";

function mockSession(): LanguageModelSession {
  return {
    prompt: vi.fn().mockResolvedValue("output"),
    clone: vi.fn().mockImplementation(() =>
      Promise.resolve({
        prompt: vi.fn().mockResolvedValue("cloned output"),
        destroy: vi.fn(),
      }),
    ),
    destroy: vi.fn(),
  };
}

function mockCreate() {
  return vi.fn().mockImplementation(() => Promise.resolve(mockSession()));
}

describe("SessionPool (task 3.1)", () => {
  let create: ReturnType<typeof mockCreate>;

  beforeEach(() => {
    create = mockCreate();
  });

  it("同カテゴリを 2 回 get → create は 1 回のみ", async () => {
    const pool = createSessionPool(create);
    await pool.get("improve");
    await pool.get("improve");
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("別カテゴリはそれぞれ独立して create を呼ぶ", async () => {
    const pool = createSessionPool(create);
    await pool.get("improve");
    await pool.get("summarize");
    expect(create).toHaveBeenCalledTimes(2);
  });

  it("create() が throw → 以降同カテゴリで同エラー (再 create なし)", async () => {
    const err = new Error("create failed");
    create.mockRejectedValue(err);
    const pool = createSessionPool(create);
    await expect(pool.get("improve")).rejects.toThrow("create failed");
    await expect(pool.get("improve")).rejects.toThrow("create failed");
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("get() から返る base の clone() が呼べる", async () => {
    const pool = createSessionPool(create);
    const base = await pool.get("improve");
    const derived = await base.clone();
    expect(derived).toBeDefined();
    expect(derived.destroy).toBeDefined();
  });

  it("dispose() で全ベースの destroy が呼ばれる", async () => {
    const sessions: LanguageModelSession[] = [];
    create.mockImplementation(() => {
      const s = mockSession();
      sessions.push(s);
      return Promise.resolve(s);
    });
    const pool = createSessionPool(create);
    await pool.get("improve");
    await pool.get("summarize");
    pool.dispose();
    await Promise.resolve();
    for (const s of sessions) {
      expect(s.destroy).toHaveBeenCalledTimes(1);
    }
  });
});
