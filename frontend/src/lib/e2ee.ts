import type { Message } from '../types/message.types'

const KEYRING_STORAGE_KEY = 'chatapp_e2ee_keyring_v1'
const PBKDF2_ITERATIONS = 210000
const AES_GCM_IV_BYTES = 12

type StoredKeyRecord = {
  keyId: string
  publicKey: string
  encryptedPrivateKey: {
    salt: string
    iv: string
    ciphertext: string
  }
  createdAt: string
}

type StoredKeyring = {
  version: 1
  activeKeyId: string | null
  keys: StoredKeyRecord[]
}

export type PublicKeyPayload = {
  userId: string
  keyId: string
  publicKey: string
}

export type EncryptedMessagePayload = {
  ciphertext: string
  iv: string
  encryptedKeys: Record<string, string>
  senderKeyId?: string
}

type UnlockedKey = {
  keyId: string
  privateKey: CryptoKey
}

let unlockedKeys: UnlockedKey[] = []
const publicKeyCache = new Map<string, string>()

function textEncoder() {
  return new TextEncoder()
}

function textDecoder() {
  return new TextDecoder()
}

function toBase64(data: ArrayBuffer): string {
  const bytes = new Uint8Array(data)
  let binary = ''
  const chunkSize = 0x8000

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }

  return btoa(binary)
}

function fromBase64(value: string): ArrayBuffer {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

function randomBytes(length: number) {
  return crypto.getRandomValues(new Uint8Array(length))
}

function toStrictBytes(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const normalized = new Uint8Array(bytes.byteLength)
  normalized.set(bytes)
  return normalized
}

function loadKeyring(): StoredKeyring {
  const raw = localStorage.getItem(KEYRING_STORAGE_KEY)
  if (!raw) {
    return {
      version: 1,
      activeKeyId: null,
      keys: [],
    }
  }

  try {
    const parsed = JSON.parse(raw) as StoredKeyring
    if (!Array.isArray(parsed.keys)) {
      throw new Error('Invalid keyring format')
    }

    return {
      version: 1,
      activeKeyId: parsed.activeKeyId || null,
      keys: parsed.keys,
    }
  } catch {
    return {
      version: 1,
      activeKeyId: null,
      keys: [],
    }
  }
}

function saveKeyring(keyring: StoredKeyring) {
  localStorage.setItem(KEYRING_STORAGE_KEY, JSON.stringify(keyring))
}

async function derivePasswordKey(password: string, salt: Uint8Array) {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    textEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: toStrictBytes(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

async function generateAsymmetricKeyPair() {
  const pair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  )

  const publicKeySpki = await crypto.subtle.exportKey('spki', pair.publicKey)
  const privateKeyPkcs8 = await crypto.subtle.exportKey('pkcs8', pair.privateKey)

  return {
    publicKey: toBase64(publicKeySpki),
    privateKey: toBase64(privateKeyPkcs8),
  }
}

async function encryptPrivateKey(privateKeyBase64: string, password: string) {
  const salt = randomBytes(16)
  const iv = randomBytes(AES_GCM_IV_BYTES)
  const passwordKey = await derivePasswordKey(password, salt)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toStrictBytes(iv) },
    passwordKey,
    fromBase64(privateKeyBase64)
  )

  return {
    salt: toBase64(salt.buffer),
    iv: toBase64(iv.buffer),
    ciphertext: toBase64(ciphertext),
  }
}

async function decryptPrivateKey(encryptedPrivateKey: StoredKeyRecord['encryptedPrivateKey'], password: string) {
  const salt = new Uint8Array(fromBase64(encryptedPrivateKey.salt))
  const iv = new Uint8Array(fromBase64(encryptedPrivateKey.iv))
  const encryptedBytes = fromBase64(encryptedPrivateKey.ciphertext)
  const passwordKey = await derivePasswordKey(password, salt)

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toStrictBytes(iv) },
    passwordKey,
    encryptedBytes
  )

  return toBase64(plaintext)
}

async function importPublicKey(publicKeyBase64: string) {
  return crypto.subtle.importKey(
    'spki',
    fromBase64(publicKeyBase64),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  )
}

async function importPrivateKey(privateKeyBase64: string) {
  return crypto.subtle.importKey(
    'pkcs8',
    fromBase64(privateKeyBase64),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['decrypt']
  )
}

function getActiveRecord(keyring: StoredKeyring) {
  if (!keyring.activeKeyId) return null
  return keyring.keys.find((key) => key.keyId === keyring.activeKeyId) || null
}

async function createAndStoreKey(password: string, keyring: StoredKeyring) {
  const generated = await generateAsymmetricKeyPair()
  const keyId = `key-${crypto.randomUUID()}`
  const encryptedPrivateKey = await encryptPrivateKey(generated.privateKey, password)

  const record: StoredKeyRecord = {
    keyId,
    publicKey: generated.publicKey,
    encryptedPrivateKey,
    createdAt: new Date().toISOString(),
  }

  keyring.keys.push(record)
  keyring.activeKeyId = keyId
  saveKeyring(keyring)

  publicKeyCache.set(`self:${keyId}`, record.publicKey)

  return record
}

export async function unlockOrCreateKeyring(password: string) {
  const keyring = loadKeyring()

  if (!keyring.keys.length) {
    await createAndStoreKey(password, keyring)
  }

  const nextUnlocked: UnlockedKey[] = []
  for (const key of keyring.keys) {
    try {
      const privateKeyBase64 = await decryptPrivateKey(key.encryptedPrivateKey, password)
      const privateKey = await importPrivateKey(privateKeyBase64)
      nextUnlocked.push({ keyId: key.keyId, privateKey })
    } catch {
      // Keep going so old keys with stale password data do not block login.
    }
  }

  if (!nextUnlocked.length) {
    throw new Error('Unable to unlock your encryption keys with this password')
  }

  unlockedKeys = nextUnlocked

  const activeRecord = getActiveRecord(keyring)
  if (!activeRecord) {
    const created = await createAndStoreKey(password, keyring)
    const privateKeyBase64 = await decryptPrivateKey(created.encryptedPrivateKey, password)
    const privateKey = await importPrivateKey(privateKeyBase64)
    unlockedKeys.push({ keyId: created.keyId, privateKey })
    return {
      keyId: created.keyId,
      publicKey: created.publicKey,
      createdAt: created.createdAt,
      rotated: true,
    }
  }

  publicKeyCache.set(`self:${activeRecord.keyId}`, activeRecord.publicKey)

  return {
    keyId: activeRecord.keyId,
    publicKey: activeRecord.publicKey,
    createdAt: activeRecord.createdAt,
    rotated: false,
  }
}

export async function maybeRotateKeyPair(password: string, maxAgeDays = 30) {
  const keyring = loadKeyring()
  const activeRecord = getActiveRecord(keyring)

  if (!activeRecord) {
    return unlockOrCreateKeyring(password)
  }

  const ageMs = Date.now() - new Date(activeRecord.createdAt).getTime()
  const rotationWindowMs = maxAgeDays * 24 * 60 * 60 * 1000

  if (ageMs < rotationWindowMs) {
    publicKeyCache.set(`self:${activeRecord.keyId}`, activeRecord.publicKey)
    return {
      keyId: activeRecord.keyId,
      publicKey: activeRecord.publicKey,
      createdAt: activeRecord.createdAt,
      rotated: false,
    }
  }

  const created = await createAndStoreKey(password, keyring)
  const privateKeyBase64 = await decryptPrivateKey(created.encryptedPrivateKey, password)
  const privateKey = await importPrivateKey(privateKeyBase64)

  unlockedKeys = [{ keyId: created.keyId, privateKey }, ...unlockedKeys]

  return {
    keyId: created.keyId,
    publicKey: created.publicKey,
    createdAt: created.createdAt,
    rotated: true,
  }
}

export function rememberUserPublicKey(payload: PublicKeyPayload) {
  publicKeyCache.set(payload.userId, payload.publicKey)
}

export function getCachedUserPublicKey(userId: string) {
  return publicKeyCache.get(userId) || null
}

export function getCurrentPublicKey() {
  const keyring = loadKeyring()
  const active = getActiveRecord(keyring)
  return active ? { keyId: active.keyId, publicKey: active.publicKey } : null
}

export function clearUnlockedKeys() {
  unlockedKeys = []
}

export async function encryptPlaintextForUsers(
  plaintext: string,
  publicKeysByUserId: Record<string, string>,
  senderKeyId?: string
): Promise<EncryptedMessagePayload> {
  const recipients = Object.entries(publicKeysByUserId).filter(([, key]) => Boolean(key))
  if (!recipients.length) {
    throw new Error('No recipient public keys are available')
  }

  const contentKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
  const iv = randomBytes(AES_GCM_IV_BYTES)

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toStrictBytes(iv) },
    contentKey,
    textEncoder().encode(plaintext)
  )

  const rawContentKey = await crypto.subtle.exportKey('raw', contentKey)
  const encryptedKeys: Record<string, string> = {}

  for (const [userId, publicKeyValue] of recipients) {
    const recipientKey = await importPublicKey(publicKeyValue)
    const encryptedKey = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, recipientKey, rawContentKey)
    encryptedKeys[userId] = toBase64(encryptedKey)
  }

  return {
    ciphertext: toBase64(ciphertextBuffer),
    iv: toBase64(iv.buffer),
    encryptedKeys,
    senderKeyId,
  }
}

export async function decryptPayloadForCurrentUser(
  payload: EncryptedMessagePayload,
  currentUserId: string
): Promise<string | null> {
  const encryptedKey = payload.encryptedKeys?.[currentUserId]
  if (!encryptedKey || !unlockedKeys.length) {
    return null
  }

  for (const unlocked of unlockedKeys) {
    try {
      const contentKeyRaw = await crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        unlocked.privateKey,
        fromBase64(encryptedKey)
      )

      const contentKey = await crypto.subtle.importKey(
        'raw',
        contentKeyRaw,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      )

      const plaintextBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: toStrictBytes(new Uint8Array(fromBase64(payload.iv))) },
        contentKey,
        fromBase64(payload.ciphertext)
      )

      return textDecoder().decode(plaintextBuffer)
    } catch {
      // Try the next private key from history.
    }
  }

  return null
}

export async function decryptMessageIfNeeded(message: Message, currentUserId?: string): Promise<Message> {
  if (!currentUserId || message.type !== 'text' || !message.encryptedPayload) {
    return message
  }

  const plaintext = await decryptPayloadForCurrentUser(message.encryptedPayload, currentUserId)
  if (!plaintext) {
    return {
      ...message,
      text: '[Encrypted message - unlock with your password to read]',
    }
  }

  return {
    ...message,
    text: plaintext,
  }
}
