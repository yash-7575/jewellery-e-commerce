import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        cream: "#f5edd6",
        creamLight: "#faf5e6",
        creamDark: "#ede3c6",
        forest: "#0d5545",
        forestDark: "#0a4336",
        ink: "#1a1a1a",
        muted: "#6b6b6b",
      },
    },
  },
  plugins: [],
};

export default config;