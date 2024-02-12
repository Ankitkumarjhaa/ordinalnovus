const customColors = {
  primary: {
    DEFAULT: "#04020f",
    dark: "#1f1d3e",
  },
  secondary: {
    DEFAULT: "#0A041D",
    dark: "#a8a4a4",
  },
  accent: {
    DEFAULT: "#9102F0",
  },
  accent_dark: "#3d0263",
  light_gray: "#84848a",
  black: "#0c0d0c",
  bitcoin: "#eab308",
  dark_gray: "#A6A6A6",
  violet: "#0B071E",
  dark_violet_700: "#0c082a",
  dark_violet_600: "#161232",
};

module.exports = {
  mode: "jit",
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  darkMode: false,
  theme: {
    fontFamily: {
      sans: ['"Facebook Sans"', "sans-serif"],
    },
    extend: {
      colors: customColors,
      height: {
        "vh-10": "10vh",
        "vh-20": "20vh",
        "vh-30": "30vh",
        "vh-40": "40vh",
        "vh-50": "50vh",
        "vh-60": "60vh",
        "vh-70": "70vh",
        "vh-80": "80vh",
        "vh-90": "90vh",
        "vh-100": "100vh",
        "vh-110": "110vh",
        "vh-120": "120vh",
        "vh-130": "130vh",
        "vh-140": "140vh",
        "vh-150": "150vh",
        "vh-175": "175vh",
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
