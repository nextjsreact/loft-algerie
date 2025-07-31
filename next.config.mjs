/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
    domains: process.env.NODE_ENV === 'production' 
      ? ['loft-algerie.com', 'cdn.loft-algerie.com']
      : ['localhost'],
  },
  serverExternalPackages: ['pg'],
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV !== 'production',
  },
  
  // Configuration par environnement
  env: {
    NEXT_PUBLIC_HAS_DB: 'true',
    ENVIRONMENT: process.env.NODE_ENV,
  },

  // Optimisations pour la production
  ...(process.env.NODE_ENV === 'production' && {
    compress: true,
    poweredByHeader: false,
    generateEtags: true,
    
    // Headers de sécurité
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'Referrer-Policy',
              value: 'origin-when-cross-origin',
            },
          ],
        },
      ]
    },
  }),

  // Configuration de développement
  ...(process.env.NODE_ENV === 'development' && {
    reactStrictMode: true,
  }),
}

// Log de configuration par environnement
console.log(`🚀 Next.js configuré pour l'environnement: ${process.env.NODE_ENV}`)

export default nextConfig
