import crypto from 'node:crypto'

export type TestLoginRole = 'band' | 'admin'

export type TestLoginSession = {
  role: TestLoginRole
  username: string
}

export type TestLoginSeed = {
  role: TestLoginRole
  username: string
  password: string
}

export const TEST_LOGIN_SEEDS: TestLoginSeed[] = [
  { role: 'band', username: 'neon-echo-band', password: 'BandTest123!' },
  { role: 'admin', username: 'stagesync-admin', password: 'AdminTest123!' },
]

const COOKIE_NAME = 'stagesync_test_session'
const SIGNING_SECRET = process.env.STAGESYNC_TEST_SESSION_SECRET || 'stagesync-test-session-secret'
const PASSWORD_SALT = 'stagesync-test-login-salt'

export function hashTestLoginPassword(username: string, password: string) {
  return crypto.createHash('sha256').update(`${username}:${password}:${PASSWORD_SALT}`).digest('hex')
}

function base64Url(input: string) {
  return Buffer.from(input).toString('base64url')
}

function unbase64Url(input: string) {
  return Buffer.from(input, 'base64url').toString('utf8')
}

export function signTestSession(session: TestLoginSession) {
  const payload = base64Url(JSON.stringify({ ...session, issuedAt: Date.now() }))
  const signature = crypto.createHmac('sha256', SIGNING_SECRET).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

export function verifyTestSession(cookieValue: string | undefined | null): TestLoginSession | null {
  if (!cookieValue) {
    return null
  }

  const [payload, signature] = cookieValue.split('.')
  if (!payload || !signature) {
    return null
  }

  const expectedSignature = crypto.createHmac('sha256', SIGNING_SECRET).update(payload).digest('base64url')
  const sigBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null
  }

  try {
    const data = JSON.parse(unbase64Url(payload)) as TestLoginSession & { issuedAt?: number }
    if (data.role !== 'band' && data.role !== 'admin') {
      return null
    }

    return {
      role: data.role,
      username: data.username,
    }
  } catch {
    return null
  }
}

export function getTestLoginCookieName() {
  return COOKIE_NAME
}

export function getTestLoginPasswordHash(username: string, password: string) {
  return hashTestLoginPassword(username, password)
}

export function getTestLoginSeed(role: TestLoginRole, username: string) {
  return TEST_LOGIN_SEEDS.find((seed) => seed.role === role && seed.username === username) ?? null
}
