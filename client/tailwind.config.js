/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        command: {
          bg: "#080c14",
          card: "#0f172a",
          border: "#1e293b",
          text: "#f8fafc",
          subtext: "#94a3b8",
          primary: "#06b6d4",
          primaryHover: "#0891b2",
          accent: "#3b82f6",
          danger: "#ef4444",
          warning: "#f59e0b",
          success: "#10b981"
        }
      }
    },
  },
  plugins: [],
}
