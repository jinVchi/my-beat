import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextCoreWebVitals,
  {
    ignores: [".next/**", "dist/**", "node_modules/**", "src/generated/**"],
  },
];

export default config;
