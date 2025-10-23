import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // CDN Configuration - only enable in production with proper CDN setup
  assetPrefix: process.env.NODE_ENV === 'production' && process.env.CDN_BASE_URL ? process.env.CDN_BASE_URL : '',

  // Image optimization configuration with CDN support
  images: {
    unoptimized: false, // Enable Next.js image optimization
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    domains: [
      'images.FutureGuide.com',
      'static.FutureGuide.com',
      'cdn.FutureGuide.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.FutureGuide.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Performance optimizations
  experimental: {
    // optimizeCss: true, // Disabled due to critters dependency issue
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'recharts'
    ]
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },



  // Headers for better caching and CDN optimization
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          // Enhanced security headers
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // Content Security Policy (more restrictive in production)
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'production'
              ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https://api.futureguide.id; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';"
              : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https://api.futureguide.id ws: wss:; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';"
          },
          // Strict Transport Security (HTTPS only in production)
          ...(process.env.NODE_ENV === 'production' && [{
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          }]),
        ],
      },
      // Static assets with long-term caching
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, stale-while-revalidate=86400, immutable',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
        ],
      },
      // Images with optimized caching
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, stale-while-revalidate=86400, immutable',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding, Accept',
          },
        ],
      },
      // Fonts with long-term caching
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
      // API routes with shorter caching
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=60',
          },
        ],
      },
      // Assessment results with medium-term caching
      {
        source: '/results/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=300',
          },
        ],
      },
    ];
  },

  // Webpack configuration for better module loading and error prevention
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Handle recharts and chart libraries better (only in production)
    if (!dev) {
      config.module.rules.push({
        test: /[\\/]node_modules[\\/]recharts[\\/]/,
        sideEffects: false,
      });
    }

    // Add fallbacks for Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    // Remove custom react/react-dom alias to avoid duplicate/react versions or HMR issues
    // (Next.js handles this by default)

    // Improve module loading reliability
    if (!dev) {
      // Use deterministic ids only in production; leave Next.js defaults in dev
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
      };

      // Optimize for production
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;

      // Better error handling for dynamic imports
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          recharts: {
            test: /[\\/]node_modules[\\/]recharts[\\/]/,
            name: 'recharts',
            chunks: 'all',
            priority: 10,
          },
        },
      };
    } else {
      // In dev mode, ensure proper error handling for webpack
      config.optimization = {
        ...config.optimization,
        // Ensure module factories are properly initialized
        runtimeChunk: false,
        // Better error messages in development
        emitOnErrors: false,
      };
    }

    // Add error handling for module loading (keep build id for debugging)
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.WEBPACK_BUILD_ID': JSON.stringify(buildId),
      })
    );

    return config;
  },

  // Proxy configuration - uncomment when external API is working
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       destination: 'https://futureguide.id/api/:path*',
  //     },
  //   ];
  // },
  
  // Caching strategy for better development performance
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

export default withBundleAnalyzer(nextConfig)
