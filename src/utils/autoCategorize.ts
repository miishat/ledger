import type { Category } from '../types/budget';

export function guessCategory(
  description: string, 
  categories: Record<string, Category>, 
  rules: Record<string, string>
): string | undefined {
  const lowerDesc = description.toLowerCase();
  
  for (const [substring, categoryId] of Object.entries(rules)) {
    if (lowerDesc.includes(substring.toLowerCase())) {
      // Find if categoryId still exists in categories
      if (categories[categoryId]) {
        return categoryId;
      }
    }
  }

  return undefined;
}
