/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "@langchain/langgraph",
      "@langchain/core",
      "@langchain/openai",
      "@langchain/anthropic",
      "langchain",
      "chromadb",
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude chromadb from the bundle entirely — it runs at runtime from node_modules
      const existing = Array.isArray(config.externals) ? config.externals : [config.externals];
      config.externals = [...existing, "chromadb"];
    }
    return config;
  },
};

export default nextConfig;
