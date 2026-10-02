import { NextRequest, NextResponse } from 'next/server'
import { COOKIE, COOKIE_VC } from '@/lib/session'

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/salir', req.url), 303)
  res.cookies.delete(COOKIE)
  res.cookies.delete(COOKIE_VC)
  return res
}
