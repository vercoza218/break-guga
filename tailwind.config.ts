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
        gold: {
          DEFAULT: '#FFD700',
          dark: '#B8960C',
          light: '#FFE44D',
        },
        dark: {
          DEFAULT: '#0f0f0f',
          card: '#1a1a2e',
          surface: '#16213e',
          lighter: '#1f2937',
        },
      },
    },
  },
  plugins: [],
};
export default config;
