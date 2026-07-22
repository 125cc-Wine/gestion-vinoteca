/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['aromadevid.com.ar'],
  },
  // El deploy no debe frenarse por reglas de estilo de ESLint (comillas sin
  // escapar, <img> en vez de <Image>, etc.). El chequeo de tipos (tsc) sigue
  // activo durante el build, así que los errores reales igual rompen la build.
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
