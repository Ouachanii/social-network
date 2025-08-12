/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Disable strict mode for development
  reactStrictMode: false,
  
  // Configure webpack for better HMR
  webpack: (config, { dev, isServer }) => {
    config.externals = [...(config.externals || []), { bufferutil: 'bufferutil', 'utf-8-validate': 'utf-8-validate' }];
    
    // Fix HMR issues
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    
    return config;
  },
  
  // Configure rewrites for API proxy
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
    ];
  },
  
  // Add CORS headers
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  
  // Configure experimental features
  experimental: {
    appDir: true,
  },
  
  // Configure images
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  
  // Disable CSS modules for better HMR
  cssModules: false,
  
  // Configure development server
  devIndicators: {
    buildActivity: false,
  },
};

export default nextConfig;
