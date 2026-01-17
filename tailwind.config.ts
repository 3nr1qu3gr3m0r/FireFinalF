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
        'primary-dark': '#0A1D37',
        'accent-start': '#C4006B',
        'accent-end': '#FF3888',
        'keypad-bg': '#1E293B',
        'sidebar-bg': '#111827',
      },
      fontFamily: {
        poppins: ['var(--font-poppins)', 'sans-serif'],
      },
      // Definimos los degradados aquí para asegurarnos de que funcionen siempre
      backgroundImage: {
        'neon-gradient': 'linear-gradient(to right, #C4006B, #FF3888)',
        'neon-gradient-hover': 'linear-gradient(to right, #A00055, #E6327A)',
      }
    },
  },
  plugins: [],
};
export default config;