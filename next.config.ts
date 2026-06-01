/** @type {import('next').NextConfig} */
const nextConfig = {
  // Raise the body-size limit for API routes / Server Actions.
  // The default is 4 MB for production and ~1 MB for the dev server.
  // Large repo contexts were hitting 413 before even reaching route.ts.
  experimental: {
    serverActions: {
      bodySizeLimit: "1024mb",
    },
  },
};
 
module.exports = nextConfig;