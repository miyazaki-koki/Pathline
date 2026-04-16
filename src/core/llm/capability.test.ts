import { describe, expect, it, expectTypeOf } from "vitest";
import {
  AVAILABILITY_STATUSES,
  DEFAULT_CAPABILITY_OPTIONS,
  type AvailabilityStatus,
  type CapabilityOptions,
} from "./capability";

describe("capability types and defaults (task 1.1)", () => {
  it("AVAILABILITY_STATUSES は 4 値を順序どおり含む", () => {
    expect(AVAILABILITY_STATUSES).toEqual([
      "readily",
      "after-download",
      "downloading",
      "unavailable",
    ]);
  });

  it("既定 CapabilityOptions は inputLanguages/outputLanguages=[ja,en]", () => {
    expect(DEFAULT_CAPABILITY_OPTIONS.inputLanguages).toEqual(["ja", "en"]);
    expect(DEFAULT_CAPABILITY_OPTIONS.outputLanguages).toEqual(["ja", "en"]);
  });

  it("CapabilityOptions.inputLanguages は readonly な文字列配列", () => {
    expectTypeOf<CapabilityOptions["inputLanguages"]>().toEqualTypeOf<readonly string[]>();
  });

  it("AvailabilityStatus は 4 つのリテラル union", () => {
    expectTypeOf<AvailabilityStatus>().toEqualTypeOf<
      "readily" | "after-download" | "downloading" | "unavailable"
    >();
  });
});
