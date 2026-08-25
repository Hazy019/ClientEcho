import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./public/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        "ink-900": "#2D2D2D",
        "ink-800": "#33363B",
        "surface-light": "#EFF3F6",
        "surface-white": "#FFFFFF",
      },
      fontFamily: {
        display: ["var(--font-outfit)", "var(--font-manrope)", "sans-serif"],
        sans: ["var(--font-manrope)", "var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

