import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#FAF7F1",
          dark: "#F3EDE2",
        },
        paper: "#FFFFFF",
        ink: {
          DEFAULT: "#1C1917",
          soft: "#57534E",
          faint: "#A8A29E",
        },
        spruce: {
          50: "#EEF6F3",
          100: "#D9EBE5",
          200: "#B3D7CC",
          300: "#84BCAE",
          400: "#4E9C8B",
          500: "#2A8070",
          600: "#0E6B5E",
          700: "#0C5A4F",
          800: "#0A4A41",
          900: "#083B34",
        },
        clay: {
          50: "#FBF3EC",
          100: "#F5E2D2",
          500: "#C97B3D",
          600: "#B06227",
        },
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "Times New Roman", "serif"],
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,25,23,0.05), 0 8px 28px -12px rgba(28,25,23,0.12)",
        pop: "0 12px 48px -12px rgba(28,25,23,0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
