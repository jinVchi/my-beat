/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: "dist",
  transpilePackages: [
    "@my-beat/shared-types",
    "@my-beat/game-logic",
    "@my-beat/netcode",
  ],
};

export default nextConfig;
