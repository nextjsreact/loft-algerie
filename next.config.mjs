/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['pg'],
  typescript: {
    ignoreBuildErrors: true,
  },
}

// Configuration pour les variables d'environnement
process.env.NEXT_PUBLIC_HAS_DB = 'true'

// Log pour le développement seulement
if (process.env.NODE_ENV === 'development') {
  console.log('Development mode - Next.js configuration loaded')
}

export default nextConfig
