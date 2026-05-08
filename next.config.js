/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @node-rs/argon2 ships a platform-specific .node binary. Telling Next to
  // treat it as an external server package keeps that binary intact through
  // the build (otherwise webpack tries to inline it and the resolver loses
  // the .node addon path at runtime).
  experimental: {
    serverComponentsExternalPackages: ["@node-rs/argon2"],
  },
};
module.exports = nextConfig;
