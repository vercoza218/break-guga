import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, getSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { password } = body;

  if (!password || !verifyPassword(password)) {
    return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
  }

  const cookie = getSessionCookie();
  const response = NextResponse.json({ success: true });
  response.cookies.set(cookie.name, cookie.value, {
    httpOnly: cookie.httpOnly,
    path: cookie.path,
    maxAge: cookie.maxAge,
  });

  return response;
}
