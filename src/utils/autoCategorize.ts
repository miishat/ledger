import type { Category } from '../types/budget';

const MATCH_RULES: Record<string, string> = {
  'trader joe': 'Food',
  'whole foods': 'Food',
  'safeway': 'Food',
  'uber': 'Transportation',
  'lyft': 'Transportation',
  'pg&e': 'Utilities',
  'comcast': 'Utilities',
  'verizon': 'Utilities',
  'rent': 'Housing',
  'mortgage': 'Housing',
  'netflix': 'Personal',
  'spotify': 'Personal',
  'amazon': 'Personal',
  'salary': 'Salary',
  'payroll': 'Salary',
};

export function guessCategory(description: string, categories: Record<string, Category>): string | undefined {
  const lowerDesc = description.toLowerCase();
  
  for (const [substring, categoryName] of Object.entries(MATCH_RULES)) {
    if (lowerDesc.includes(substring)) {
      // Find the categoryId that matches this name
      const category = Object.values(categories).find(c => c.name.toLowerCase() === categoryName.toLowerCase());
      if (category) {
        return category.id;
      }
    }
  }

  return undefined;
}
