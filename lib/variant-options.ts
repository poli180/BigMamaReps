export const isShoeCategory = (category: string) =>
  /schuh|sneaker|boots|stiefel|shoe/i.test(category);
export const suggestedSizes = (category: string) =>
  isShoeCategory(category)
    ? ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"]
    : ["XS", "S", "M", "L", "XL", "XXL"];
export const parseSizes = (input: string) => [
  ...new Set(
    input
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  ),
];
