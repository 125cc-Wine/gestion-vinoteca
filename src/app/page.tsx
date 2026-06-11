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
    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center p-8">
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-semibold text-slate-800 mb-2">Sistema de gestión comercial</h1>
        <p className="text-slate-500 text-sm">Seleccioná con qué empresa querés trabajar</p>
      </div>

      <div className="grid grid-cols-2 gap-6 w-full max-w-xl mb-8">
        <button
          onClick={() => setEmpresa('aroma')}
          className={`bg-white rounded-2xl border-2 p-8 flex flex-col items-center gap-4 transition-all cursor-pointer shadow-sm ${
            empresa === 'aroma'
              ? 'border-amber-600 shadow-amber-100 shadow-md'
              : 'border-gray-100 hover:border-amber-200 hover:shadow-md'
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
            <div className="font-semibold text-gray-800">Aroma de Vid</div>
            <div className="text-xs text-gray-400 mt-1">Tienda · Consumidor final</div>
          </div>
        </button>

        <button
          onClick={() => setEmpresa('lavid')}
          className={`bg-slate-900 rounded-2xl border-2 p-8 flex flex-col items-center gap-4 transition-all cursor-pointer shadow-sm ${
            empresa === 'lavid'
              ? 'border-cyan-400 shadow-cyan-900/30 shadow-md'
              : 'border-slate-700 hover:border-slate-500 hover:shadow-md'
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
            <div className="font-semibold text-white">La Vid Consultora</div>
            <div className="text-xs text-slate-400 mt-1">Distribución · Reventa</div>
          </div>
        </button>
      </div>

      <button
        onClick={entrar}
        disabled={!empresa}
        className={`px-10 py-3 rounded-xl text-sm font-semibold transition-all shadow-sm ${
          empresa
            ? 'bg-slate-800 text-white hover:bg-slate-700 cursor-pointer shadow-md'
            : 'bg-gray-100 text-gray-300 cursor-not-allowed'
        }`}
      >
        Ingresar →
      </button>
    </main>
  )
}
