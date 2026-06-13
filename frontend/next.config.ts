import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: 'standalone',
    async rewrites() {
        const backendUrl =
            process.env.INTERNAL_API_URL ||
            process.env.NEXT_PUBLIC_API_URL ||
            'https://nexus-aid-production.up.railway.app';

        return [
            {
                source: '/api/:path*',
                destination: `${backendUrl}/:path*`,
            },
        ];
    },
};

export default nextConfig;