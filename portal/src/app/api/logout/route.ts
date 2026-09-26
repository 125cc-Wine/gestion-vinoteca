import { NextRequest, NextResponse } from 'next/server'
import { COOKIE } from '@/lib/session'

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/salir', req.url), 303)
  res.cookies.delete(COOKIE)
  return res
}
