'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Home() {
  const [empresa, setEmpresa] = useState<'aroma' | 'lavid' | null>(null)
  const router = useRouter()

  function entrar() {
    if (!empresa) return
    localStorage.setItem('empresa', empresa)
    router.push('/productos')
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-medium text-gray-800 mb-2">Sistema de gestión comercial</h1>
        <p className="text-gray-500 text-sm">Seleccioná con qué empresa querés trabajar</p>
      </div>

      <div className="grid grid-cols-2 gap-6 w-full max-w-xl mb-8">
        <button
          onClick={() => setEmpresa('aroma')}
          className={`bg-white rounded-2xl border-2 p-8 flex flex-col items-center gap-4 transition-all cursor-pointer ${
            empresa === 'aroma' ? 'border-amber-700 shadow-md' : 'border-gray-100 hover:border-gray-200'
          }`}
        >
          <Image
            src="/logos/aroma.jpg"
            alt="Aroma de Vid"
            width={120}
            height={80}
            style={{ objectFit: 'contain' }}
          />
          <div className="text-center">
            <div className="font-medium text-gray-800">Aroma de Vid</div>
            <div className="text-xs text-gray-400 mt-1">Tienda · Consumidor final</div>
          </div>
        </button>

        <button
          onClick={() => setEmpresa('lavid')}
          className={`bg-gray-900 rounded-2xl border-2 p-8 flex flex-col items-center gap-4 transition-all cursor-pointer ${
            empresa === 'lavid' ? 'border-cyan-400 shadow-md' : 'border-gray-700 hover:border-gray-500'
          }`}
        >
          <Image
            src="/logos/lavid.png"
            alt="La Vid Consultora"
            width={120}
            height={80}
            style={{ objectFit: 'contain' }}
          />
          <div className="text-center">
            <div className="font-medium text-white">La Vid Consultora</div>
            <div className="text-xs text-gray-400 mt-1">Distribución · Reventa</div>
          </div>
        </button>
      </div>

      <button
        onClick={entrar}
        disabled={!empresa}
        className={`px-10 py-3 rounded-xl text-sm font-medium transition-all ${
          empresa
            ? 'bg-gray-800 text-white hover:bg-gray-700 cursor-pointer'
            : 'bg-gray-100 text-gray-300 cursor-not-allowed'
        }`}
      >
        Ingresar →
      </button>
    </main>
  )
}
