# Seun UI

Accessible React components. Each one starts from the native element that already has the right semantics (`<button>`, `<dialog>`, `<select>`, `<table>`, radio inputs). It adds only what the platform lacks, following the [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) for the composite widgets (menu button, tabs, combobox).

**Status:** version 0.1.0. Built, tested, and packed with `npm pack`. **Not published to npm.**

## Components

| Component | Built on | Keyboard and ARIA behaviour | Status |
|---|---|---|---|
| Button | `<button>` | Variants and sizes. `loading` sets `aria-busy` and blocks clicks but keeps focus | Tested |
| TextField, Textarea, Select | native controls | Label, description and error linked with `aria-describedby`; `aria-invalid` | Tested |
| Checkbox | `<input type=checkbox>` | Mixed state through the `indeterminate` property | Tested |
| Switch | `<button role=switch>` | `aria-checked`; Space and Enter toggle; submits with forms | Tested |
| RadioGroup | `<fieldset>` + native radios | Legend, description and error; arrow keys come from the browser | Tested |
| Dialog | `<dialog>` + `showModal()` | Rest of the page inert, labelled and described. Escape and backdrop click close it unless `dismissible={false}`. Focus returns to the trigger | Tested |
| DropdownMenu | APG menu button | ArrowDown / ArrowUp open on the first / last item; arrows, Home and End move and skip disabled items; type to jump; Enter / Space run an item; Escape and outside click close; focus returns to the trigger | Tested |
| Tooltip | `role=tooltip` | Always linked with `aria-describedby`; shows on hover and focus; Escape hides it; the pointer can move onto the tooltip (WCAG 1.4.13) | Tested |
| Toast | live regions | Announced through polite / assertive regions that exist from first render; auto-dismiss pauses on hover and focus (WCAG 2.2.1); dismiss button | Tested |
| Tabs | APG tabs | Roving tabindex; arrows, Home and End with automatic activation; skips disabled tabs; panels linked to their tabs | Tested |
| Badge, Card | static | Card titles can be any heading level | Tested |
| Combobox | APG editable combobox (ARIA 1.2) | Filters as you type. `aria-activedescendant` keeps focus in the input. Enter picks; Escape closes, then clears; disabled options are skipped; empty state; leaving the field restores the chosen label | Tested |
| DataTable | `<table>` + TanStack Table v8 | Caption; sorting with `aria-sort`; global filter; pagination; row selection with a three-state "select page" box; row count in a status region; optional windowing with TanStack Virtual | Tested |

## Usage

```tsx
import "seun-ui/styles.css";
import { Button, Dialog, ToastProvider, useToast } from "seun-ui";

<Dialog trigger={<Button variant="danger">Delete</Button>} title="Delete project?" description="This can't be undone." />
```

- **Package:** ESM (`dist/index.js`), CJS (`dist/index.cjs`) and type declarations (`.d.ts` / `.d.cts`). React 18.2+ and 19 are peer dependencies.
- **Styles:** one stylesheet, `seun-ui/styles.css`, about 3 kB gzipped. It ships **no CSS reset**, and every utility is prefixed (`su:`), so it won't clash with an app's own Tailwind or CSS.
- **Theming:** override the `--su-color-*` custom properties (accent, surface, fg, border, danger and others). Add `data-su-theme="dark"` to any ancestor element for the dark palette.

## Development

Requires Node 22 (`.nvmrc`).

```bash
npm install
npm run storybook     # docs and playground on :6006 (theme toggle in the toolbar)
npm run lint && npm run typecheck
npm test              # Vitest + Testing Library + axe (jsdom)
npm run test:a11y     # builds Storybook, runs axe on every story in Chrome, light and dark
npm run build         # Vite library mode → dist/
npm run test:pack     # npm pack → install the tarball in examples/consumer → tsc, vite build, require() and import smoke tests
```

## How it's tested

- **Unit tests** (`src/components/*.test.tsx`, 22 tests): keyboard behaviour, focus management, ARIA wiring, controlled and uncontrolled state, plus an axe run on each component. jsdom has no layout or modal `<dialog>`, so `vitest.setup.ts` stubs `showModal` and the tests check our logic rather than the browser's inert behaviour.
- **Real-browser accessibility** (`scripts/a11y-stories.mjs`): axe-core checks WCAG 2.1 A/AA plus best practice on all 14 stories in headless Chrome, in both themes, after animations settle. This is where colour contrast is checked. The page-level `region` landmark rule is turned off, because stories render components on their own.
- **Packaging** (`scripts/test-pack.mjs`): the tarball npm would publish is installed into a separate app, which must typecheck against the shipped declarations, bundle with Vite, `require()` the CJS build, `import` the ESM build and resolve `styles.css`.

## Limits

- **Not published to npm.** That needs explicit approval.
- Overlays are positioned with `@floating-ui/react-dom` and rendered inline with `position: fixed`, not in a portal. An ancestor with a `transform` would change what they are positioned against.
- The real-browser axe pass only sees the open state for the Dialog story. The open Menu, Tooltip and Toast are covered by the jsdom tests, without colour contrast. No screen reader has been tried by hand.
- No date picker, popover, accordion, slider or form-validation helpers.
- Lint reports one informational warning: the React Compiler skips `DataTable`, because TanStack Table's API can't be memoised.
