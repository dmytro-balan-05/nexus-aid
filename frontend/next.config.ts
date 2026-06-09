import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: 'standalone',
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'https://nexus-aid-production.up.railway.app/:path*',
            },
        ];
    },
};

export default nextConfig;