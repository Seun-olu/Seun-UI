import { axe } from "vitest-axe";
import { expect } from "vitest";

/** Runs axe-core on a rendered tree and fails with a readable list of violations. Colour contrast needs real layout, so it is checked in Storybook (addon-a11y) instead. */
export async function expectAccessible(el: Element) {
  const results = await axe(el, { rules: { region: { enabled: false }, "color-contrast": { enabled: false } } });
  expect(results.violations.map((v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}
