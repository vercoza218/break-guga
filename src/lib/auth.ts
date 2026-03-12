import { cookies } from 'next/headers';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const COOKIE_NAME = 'admin_session';
const SESSION_TOKEN = 'authenticated';

export function verifyPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);
  return session?.value === SESSION_TOKEN;
}

export function getSessionCookie() {
  return {
    name: COOKIE_NAME,
    value: SESSION_TOKEN,
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  };
}
