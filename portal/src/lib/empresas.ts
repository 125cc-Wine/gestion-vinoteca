export const EMPRESAS = {
  aroma: {
    nombre: 'Aroma de Vid', logo: '/logos/aroma.jpg',
    telefono: '(0223) 491-1705', domicilio: 'Roca 2787, Mar del Plata',
  },
  lavid: {
    nombre: 'La Vid Consultora', logo: '/logos/lavid.png',
    telefono: '(0223) 685-0870', domicilio: 'Roca 2787, Mar del Plata',
  },
} as const

export type EmpresaId = keyof typeof EMPRESAS
