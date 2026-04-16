import type { CategoryId } from "./categories";
import { buildTemplate } from "./template";

export interface CandidateRequest {
  readonly category: CategoryId;
  readonly text: string;
}

export interface Candidate {
  readonly category: CategoryId;
  readonly body: string;
  readonly hash: string;
}

export interface CandidateProvider {
  provide(req: CandidateRequest): Candidate | Promise<Candidate>;
}

export function fnv1a(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export class RuleBasedCandidateProvider implements CandidateProvider {
  provide(req: CandidateRequest): Candidate {
    const body = buildTemplate(req.category, req.text);
    return {
      category: req.category,
      body,
      hash: fnv1a(`${req.category}:${body}`),
    };
  }
}
