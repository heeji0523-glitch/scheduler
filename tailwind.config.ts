import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        base: {
          bg: "#0f1115",
          panel: "#171a21",
          card: "#1e222b",
          border: "#2a2f3a",
        },
      },
    },
  },
  plugins: [],
};
export default config;
