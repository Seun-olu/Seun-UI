import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.tsx"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: { name: "@storybook/react-vite", options: {} },
  core: { disableTelemetry: true },
  // The library's vite.config adds the d.ts plugin; Storybook doesn't need it.
  viteFinal: async (cfg) => ({ ...cfg, plugins: (cfg.plugins ?? []).flat().filter((p) => !(p && typeof p === "object" && "name" in p && String(p.name).startsWith("vite:dts"))) }),
};
export default config;
