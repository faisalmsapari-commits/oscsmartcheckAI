import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Malaysian Government & MPLBP Professional Identity Palette
        gov: {
          50: "#f0f6fc",
          100: "#e0edf8",
          200: "#bad7f1",
          300: "#7fb8e6",
          400: "#3d95d7",
          500: "#1877c4",
          600: "#0c5ca6",
          700: "#0b4a86", // Primary Navy / Header
          800: "#0d3f6f",
          900: "#10355c", // Deep Government Slate
          950: "#0b223d",
        },
        gold: {
          50: "#fbf8ea",
          100: "#f6efc8",
          200: "#edd98f",
          300: "#e2bd4f",
          400: "#d9a425",
          500: "#bd8619", // MPLBP Crest Gold Accent
          600: "#9e6413",
          700: "#7e4813",
          800: "#683916",
          900: "#572f17",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
