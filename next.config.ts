import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  agentRules: false,
  devIndicators: false,
  images: {
    formats: ["image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/*/hqdefault.jpg", search: "" },
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/*/hq720.jpg", search: "" },
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/*/mqdefault.jpg", search: "" },
      { protocol: "https", hostname: "*.mzstatic.com", pathname: "/image/thumb/**", search: "" },
    ],
  },
  outputFileTracingIncludes: { "/*": ["./src/content/works/*.md"] },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
      ],
    }];
  },
};

export default config;
