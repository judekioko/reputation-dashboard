import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#182420",
        paper: "#EEF1EF",
        accent: "#1F6F6B",
        amber: "#B8722A",
      },
    },
  },
  plugins: [],
};

export default config;
