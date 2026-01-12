/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Map Tailwind colors to our CSS variables for consistency
        primary: 'var(--app-color-primary)',
        surface: 'var(--app-bg-surface)',
        card: 'var(--app-bg-card)',
        border: 'var(--app-border)',
        text: {
          main: 'var(--app-text-main)',
          secondary: 'var(--app-text-secondary)'
        }
      }
    },
  },
  plugins: [],
}
