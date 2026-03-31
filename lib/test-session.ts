import { cookies } from 'next/headers'
import { getTestLoginCookieName, verifyTestSession, type TestLoginSession } from './test-login'

export async function getTestSession(): Promise<TestLoginSession | null> {
  const cookieStore = await cookies()
  return verifyTestSession(cookieStore.get(getTestLoginCookieName())?.value)
}
