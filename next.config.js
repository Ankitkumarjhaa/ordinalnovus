const path = require("path");

module.exports = {
  // Your Next.js configuration goes here
  async rewrites() {
    return [
      {
        source: "/content/:id",
        destination: "/api/content/:id",
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/api",
        destination: "/developer",
        permanent: false,
      },
      {
        source: "/cbrc-20",
        destination: "/",
        permanent: false,
      },

      {
        source: "/collection",
        destination: "/collections",
        permanent: false,
      },
    ];
  },
  env: {
    NEXT_PUBLIC_ENV: "PRODUCTION",
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ord.ordinalnovus.com",
        port: "",
        pathname: "/content/**",
      },
    ],
  },
  experimental: {
    appDir: true,
    typedRoutes: true,
    serverActions: true,
  },
  webpack: (config) => {
    config.resolve.alias["@components"] = path.join(
      __dirname,
      "src/components"
    );
    config.experiments = {
      topLevelAwait: true,
      asyncWebAssembly: true,
      layers: true,
    };
    config.resolve.fallback = { fs: false, net: false, tls: false };
    if (config.isServer) {
      config.output.webassemblyModuleFilename =
        "./../static/wasm/[modulehash].wasm";
    } else {
      config.output.webassemblyModuleFilename = "static/wasm/[modulehash].wasm";
    }

    // Return the modified config
    return config;
  },
};
