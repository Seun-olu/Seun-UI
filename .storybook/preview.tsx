import type { Decorator, Preview } from "@storybook/react-vite";
import "../src/styles/index.css";

const withTheme: Decorator = (Story, ctx) => {
  const theme = ctx.globals.theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-su-theme", theme);
  document.body.style.background = theme === "dark" ? "#18181b" : "#ffffff";
  document.body.style.color = theme === "dark" ? "#fafafa" : "#18181b";
  document.body.style.fontFamily = "system-ui, sans-serif";
  return <Story />;
};

const preview: Preview = {
  decorators: [withTheme],
  globalTypes: {
    theme: {
      description: "Colour theme",
      toolbar: { title: "Theme", icon: "contrast", items: [{ value: "light", title: "Light" }, { value: "dark", title: "Dark" }], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: "light" },
  parameters: {
    layout: "padded",
    // Fail the a11y panel (and test runs) on violations rather than just reporting them.
    a11y: { test: "error" },
    controls: { matchers: { color: /(background|color)$/i } },
  },
  tags: ["autodocs"],
};
export default preview;
