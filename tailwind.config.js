/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      colors: {
        silver: {
          50: "#FAFAFA",
          100: "#F5F5F5",
          200: "#E5E5E5",
          300: "#D4D4D4",
        },

        gold: {
          DEFAULT: "#D4AF37",
          400: "#FBBF24",
          500: "#F59E0B",
        },
      },

      fontFamily: {
        cairo: ["Cairo", "sans-serif"],
      },
    },
  },

  plugins: [],
};