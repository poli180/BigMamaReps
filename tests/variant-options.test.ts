import test from "node:test";
import assert from "node:assert/strict";
import { suggestedSizes, parseSizes } from "../lib/variant-options";
import { productInput } from "../lib/validation";
import { demoProducts } from "../lib/catalog";
test("shoe categories suggest EU sizes while clothing keeps letter sizes", () => {
  for (const category of ["Schuhe Männer", "Schuhe Frauen", "Sneakers"]) {
    assert.ok(suggestedSizes(category).includes("42"));
    assert.ok(!suggestedSizes(category).includes("M"));
  }
  assert.ok(suggestedSizes("Shirts").includes("M"));
  assert.deepEqual(parseSizes("40, 41, 40, ,42.5"), ["40", "41", "42.5"]);
});
test("variant validation rejects duplicate colors differing by case or whitespace", () => {
  const p = demoProducts[0];
  const v = p.variants[0];
  assert.equal(
    productInput.safeParse({
      ...p,
      variants: [
        { ...v, color: "Black" },
        { ...v, id: "other", sku: "other", color: " black " },
      ],
    }).success,
    false,
  );
});
