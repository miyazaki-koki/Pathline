import { fnv1a, type Candidate, type CandidateProvider, type CandidateRequest } from "./candidate";
import { RuleBasedFeatureExtractor } from "./feature/extractor";
import type { FeatureExtractor } from "./feature/types";
import { TableDrivenComposer, type RecommendationComposer } from "./compose/composer";

export class FlexibleCandidateProvider implements CandidateProvider {
  constructor(
    private readonly extractor: FeatureExtractor = new RuleBasedFeatureExtractor(),
    private readonly composer: RecommendationComposer = new TableDrivenComposer(),
  ) {}

  provide(req: CandidateRequest): Candidate {
    const features = this.extractor.extract(req.text);
    const body = this.composer.compose(req.category, req.text, features);
    return {
      category: req.category,
      body,
      hash: fnv1a(`${req.category}:${body}`),
    };
  }
}
