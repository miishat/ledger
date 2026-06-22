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

const categoryMapCache = new WeakMap<Record<string, Category>, Record<string, string>>();

export function guessCategory(description: string, categories: Record<string, Category>): string | undefined {
  const lowerDesc = description.toLowerCase();
  
  let categoryByName = categoryMapCache.get(categories);

  for (const [substring, categoryName] of Object.entries(MATCH_RULES)) {
    if (lowerDesc.includes(substring)) {
      if (!categoryByName) {
        categoryByName = {};
        for (const category of Object.values(categories)) {
          categoryByName[category.name.toLowerCase()] = category.id;
        }
        categoryMapCache.set(categories, categoryByName);
      }

      const categoryId = categoryByName[categoryName.toLowerCase()];
      if (categoryId) {
        return categoryId;
      }
    }
  }

  return undefined;
}
