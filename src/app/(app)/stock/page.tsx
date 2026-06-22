'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StockRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/deposito') }, [router])
  return null
}
