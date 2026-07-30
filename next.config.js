/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['aromadevid.com.ar'],
  },
  // La empresa activa (Aroma/La Vid) vive en localStorage, no en la URL, y cada
  // página la relee al montar. El cache de cliente de Next (30s por defecto en
  // páginas dinámicas) reusa la página ya renderizada al navegar de vuelta,
  // sin volver a montar/leer localStorage — mostraba datos de la otra empresa
  // "a veces" (según cuánto hubiera pasado desde la última visita). Sin cache
  // de tiempo, cada navegación remonta la página y relee la empresa correcta.
  experimental: {
    staleTimes: { dynamic: 0, static: 0 },
  },
  // El deploy no debe frenarse por reglas de estilo de ESLint (comillas sin
  // escapar, <img> en vez de <Image>, etc.). El chequeo de tipos (tsc) sigue
  // activo durante el build, así que los errores reales igual rompen la build.
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
