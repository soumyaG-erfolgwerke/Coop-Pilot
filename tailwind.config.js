/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
    "./src/pages/**/*.{js,jsx}",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary-dark": "#B7416E",
        primary: "#A2185B",
        "dark-tint": "#D48CB9",
        tint: "#FEFBFD",
        "md-tint": "#f1d4c4",
        "custom-neutral-900": "#0f172a",
        "custom-neutral-700": "#374151",
        "custom-neutral-500": "#6b7280",
        "custom-neutral-300": "#e5e7eb",

        "custom-md-tint-500": "#FF66CC",
        "custom-primary-700": "#d17697",
      },
      fontFamily: {
        inter: ["var(--font-inter)", "sans-serif"],
        dmsans: ["var(--font-dmsans)", "sans-serif"],
        abhaya: ["var(--font-abhaya)", "sans-serif"],
      },
      keyframes: {
        "slide-up-fade": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "partners-marquee": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "slide-up": "slide-up-fade 0.9s ease-in-out",
        "marquee": "partners-marquee 20s linear infinite",
      },
    },
  },
  plugins: [
    function ({ addComponents }) {
      addComponents({
        ".tint-border-gradient": {
          borderWidth: "1px",
          borderStyle: "solid",
          borderImageSource:
            "linear-gradient(90deg, rgba(70, 127, 253, 0.25), rgba(234, 242, 255, 0.25))",
          borderImageSlice: "1",
        },
      });
    },
  ],
};
