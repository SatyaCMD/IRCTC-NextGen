/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    async rewrites() {
        return {
            beforeFiles: [
                {
                    source: '/',
                    has: [
                        {
                            type: 'host',
                            value: 'support.irctcv2.co.in',
                        },
                    ],
                    destination: '/support',
                },
            ],
        };
    },
};

export default nextConfig;