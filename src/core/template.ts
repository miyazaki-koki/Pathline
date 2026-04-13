import { CATEGORIES, type CategoryId } from "./categories";

export function buildTemplate(category: CategoryId, text: string): string {
  const def = CATEGORIES[category];
  return `${def.template}\n---\n${text}\n---`;
}
