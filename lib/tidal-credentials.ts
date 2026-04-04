import crypto from 'node:crypto'

const PREFIX = 'enc:v1'

function resolveEncryptionKey() {
  const rawKey = process.env.TIDAL_CREDENTIALS_ENCRYPTION_KEY?.trim()
    || process.env.SUPABASE_SECRET_KEY?.trim()
    || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  return rawKey ? crypto.createHash('sha256').update(rawKey).digest() : null
}

export function encryptTidalCredential(value: string | null | undefined) {
  const plaintext = value?.trim() || ''
  if (!plaintext) return null

  const key = resolveEncryptionKey()
  if (!key) {
    throw new Error('Tidal credential encryption is not configured.')
  }

  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return [
    PREFIX,
    iv.toString('base64url'),
    authTag.toString('base64url'),
    ciphertext.toString('base64url'),
  ].join(':')
}

export function decryptTidalCredential(value: string | null | undefined) {
  const encoded = value?.trim() || ''
  if (!encoded) return null
  if (!encoded.startsWith(`${PREFIX}:`)) return encoded

  const key = resolveEncryptionKey()
  if (!key) {
    throw new Error('Tidal credential decryption is not configured.')
  }

  const payload = encoded.slice(`${PREFIX}:`.length)
  const [ivValue, authTagValue, ciphertextValue] = payload.split(':')
  if (!ivValue || !authTagValue || !ciphertextValue) {
    throw new Error('Encrypted Tidal credential is malformed.')
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivValue, 'base64url'))
  decipher.setAuthTag(Buffer.from(authTagValue, 'base64url'))
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, 'base64url')),
    decipher.final(),
  ])

  return plaintext.toString('utf8')
}
