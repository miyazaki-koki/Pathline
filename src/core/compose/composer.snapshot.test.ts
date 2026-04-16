import { describe, expect, it } from "vitest";
import { RuleBasedFeatureExtractor } from "../feature/extractor";
import { TableDrivenComposer } from "./composer";
import { FIXTURES } from "./__fixtures__/representative-inputs";

const extractor = new RuleBasedFeatureExtractor();
const composer = new TableDrivenComposer();

describe("composer snapshots (30 representative inputs)", () => {
  it("covers 5 categories x 6 variations", () => {
    expect(FIXTURES).toHaveLength(30);
  });

  for (const fx of FIXTURES) {
    it(`snapshot ${fx.name}`, () => {
      const features = extractor.extract(fx.text);
      const output = composer.compose(fx.category, fx.text, features);
      expect(output).toMatchSnapshot();
    });
  }
});
