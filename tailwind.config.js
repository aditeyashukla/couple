/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        dmsans: "DMSans_400Regular",
        dmsansBold: "DMSans_700Bold",
      },
      colors: {
        appBg: "#121213",
        appSurface: "#1a1a1b",
        appText: "#ffffff",
        appTextSecondary: "#818384",
        appBorder: "#3a3a3c",

        pairGreen: "#6aaa64",
        pairYellow: "#c9b458",
        pairGrey: "#787c7e",
        pairEmpty: "#3a3a3c",

        pairError: "#dc3545",
        pairSuccess: "#28a745",
        pairWarning: "#ffc107",
      },
    },
  },
  plugins: [],
};
