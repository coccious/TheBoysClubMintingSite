/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{html,js,jsx,ts,tsx}",
    "./pages/**/*.{html,js,jsx,ts,tsx}",
    "./components/**/*.{html,js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        "spin-fast": "spin 2s linear infinite", // Fast spin
        "pulse-slow": "pulse 5s infinite", // Slow pulse effect
        "bounce-slow": "bounce 5s infinite", // Slow bounce effect
      },
      fontFamily: {
        modak: ["var(--font-modak)", "cursive"], // Add Modak font
      },
    },
  },
  plugins: [],
};
