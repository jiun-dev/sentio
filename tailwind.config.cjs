/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        window: "var(--window-color)",
        base: "var(--base-color)",
        primary: "var(--primary-color)",
        text: "var(--text-color)",
      },
      fontSize: {
        medium: "1rem",
      },
      fontFamily: {
        cascadia: ["cascadia"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
