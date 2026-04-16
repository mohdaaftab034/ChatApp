# ChatApp: End-to-End Encrypted Chat (E2EE) Guide

This document explains the end-to-end encrypted chat implementation in this project, how it works internally, and how to operate and extend it safely.

## Table of Contents
1. Overview
2. Security Model
3. High-Level Encryption Flow
4. Crypto Design Choices
5. Registration and Key Provisioning
6. Login and Key Unlocking
7. Sending an Encrypted Message
8. Receiving and Decrypting a Message
9. Key Rotation and Key History
10. Backend Data Model and API Endpoints
11. Frontend Keyring and Encryption Engine
12. Socket Message Lifecycle
13. What Is and Is Not Encrypted
14. Failure Modes and User Experience
15. Operational Considerations
16. Local Development and Verification
17. Extension Roadmap
18. Quick Reference

## 1) Overview
This ChatApp supports end-to-end encryption for text messages.

In E2EE:
- Message plaintext is encrypted in the sender's browser.
- The server stores and forwards encrypted content only.
- Only intended recipients with private keys can decrypt.

The server is a transport and storage layer, not a plaintext processor for encrypted text.

## 2) Security Model
### Goals
- Confidentiality of text messages in transit and at rest on server.
- Per-user key ownership with password-protected private keys.
- Key rotation support without breaking old-message decryptability.

### Trust assumptions
- Browser runtime and local device are trusted for cryptographic operations.
- User password entropy is strong enough to protect encrypted private keys.
- TLS is used for API/socket transport.

### Out of scope
- Full forward secrecy with per-message ratchets (not Signal-style double ratchet yet).
- Metadata privacy (conversation IDs, sender IDs, timing, and non-text payload metadata still visible to server).
- Hardware key storage/secure enclave integration.

## 3) High-Level Encryption Flow
### Registration
1. Client signs up.
2. Client generates asymmetric key pair.
3. Client encrypts private key with password-derived key.
4. Client stores encrypted private key locally.
5. Client uploads public key + keyId to server.

### Sending
1. Client fetches recipients' public keys.
2. Client generates random symmetric content key.
3. Client encrypts plaintext with symmetric key (AES-GCM).
4. Client encrypts content key separately for each recipient public key (RSA-OAEP).
5. Client sends encrypted payload over socket.
6. Server stores encrypted payload and forwards it.

### Receiving
1. Client receives encrypted payload.
2. Client selects encrypted key for self (by userId).
3. Client decrypts content key using one of local private keys (current/history).
4. Client decrypts ciphertext into plaintext.
5. UI renders plaintext.

### Rotation
1. Client checks active key age (30 days).
2. If expired, generate new key pair.
3. Upload new public key and activate keyId.
4. Keep old private keys in key history for old messages.

## 4) Crypto Design Choices
### Asymmetric encryption
- Algorithm: RSA-OAEP (SHA-256)
- Key size: 2048-bit
- Purpose: Encrypt per-message symmetric key for each recipient

### Symmetric encryption
- Algorithm: AES-GCM (256-bit)
- IV size: 12 bytes
- Purpose: Encrypt message plaintext

### Private key protection at rest (client)
- Password KDF: PBKDF2-SHA256
- Iterations: 210,000
- Derived key: AES-GCM 256
- Salt: random 16 bytes

### Why hybrid encryption
Hybrid encryption is used for performance and scalability:
- Encrypting message payload directly with RSA is inefficient and size-limited.
- AES encrypts payload efficiently.
- RSA encrypts only the small AES content key per recipient.

## 5) Registration and Key Provisioning
On account creation:
- The app creates a local keyring if none exists.
- A new key record is generated:
  - keyId
  - publicKey (base64 SPKI)
  - encryptedPrivateKey { salt, iv, ciphertext }
  - createdAt
- The keyring is persisted in localStorage.
- Public key and keyId are uploaded to backend.

Result:
- Backend can distribute public keys.
- Private keys remain client-side only (encrypted at rest).

## 6) Login and Key Unlocking
On login:
- Password is used to decrypt local encrypted private key(s).
- Successfully decrypted keys are held in memory for runtime decrypt operations.
- App checks active key age; rotates if beyond threshold.
- Active public key is synced to backend.

If unlock fails:
- User cannot decrypt E2EE text.
- UI falls back to encrypted placeholder text.

## 7) Sending an Encrypted Message
For text messages:
1. Determine participants in conversation.
2. Fetch/cached recipients' public keys.
3. Include sender's own public key too (so sender can decrypt history across devices/session, when key is present).
4. Encrypt plaintext into:
   - ciphertext
   - iv
   - encryptedKeys (map of userId -> encrypted content key)
   - senderKeyId
5. Emit socket event with encrypted payload.

Server-side behavior:
- Validates payload shape.
- Stores encrypted payload in message document.
- Broadcasts stored message to participant rooms.

## 8) Receiving and Decrypting a Message
When message arrives via socket or history API:
- If message type is text and encryptedPayload exists:
  - Find encryptedKeys[currentUserId].
  - Try decrypting using in-memory unlocked private keys (active + history).
  - If one key succeeds:
    - Decrypt AES key, then ciphertext -> plaintext.
  - If none succeeds:
    - Render fallback placeholder.

This fallback prevents hard crashes while signaling locked content.

## 9) Key Rotation and Key History
Rotation policy:
- Default threshold: 30 days.

When rotating:
- Generate fresh key pair.
- Append new key record to local keyring.
- Set new activeKeyId.
- Upload new active public key.

Why keep old keys:
- Old messages were encrypted with old recipient public keys.
- Decryption requires corresponding old private keys.
- Key history preserves backward decryptability.

## 10) Backend Data Model and API Endpoints
### User model E2EE fields
`e2ee` object includes:
- activeKeyId
- publicKey
- keyHistory[]:
  - keyId
  - publicKey
  - createdAt

### Message model encrypted payload
`encryptedPayload` includes:
- ciphertext
- iv
- encryptedKeys (map userId -> encrypted content key)
- senderKeyId

### Endpoints
- `GET /users/:userId/public-key`
  - returns `{ userId, keyId, publicKey }`
- `PATCH /users/me/public-key`
  - accepts `{ keyId, publicKey }`
  - updates active key and history

### Socket payload support
`send_message` accepts `encryptedPayload` for E2EE text.

## 11) Frontend Keyring and Encryption Engine
Core utility module:
- `frontend/src/lib/e2ee.ts`

Responsibilities:
- Create/load/save local keyring.
- Derive password keys via PBKDF2.
- Encrypt/decrypt private key blobs.
- Encrypt plaintext for recipients.
- Decrypt incoming encrypted payload for current user.
- Manage unlocked key memory cache.
- Key rotation and public key cache.

Keyring storage (localStorage):
- versioned structure
- activeKeyId
- keys[] with encrypted private material

## 12) Socket Message Lifecycle
### Outbound
- UI compose -> encrypt -> socket `send_message`.
- Server persists and rebroadcasts.

### Inbound
- Socket `receive_message` -> attempt decrypt -> state store update -> UI render.

### History
- REST list messages -> per-message decrypt attempt -> render.

## 13) What Is and Is Not Encrypted
### Encrypted (currently)
- Text message body for E2EE text messages.

### Not encrypted (currently)
- Media file bytes/URLs (handled by upload/storage flow).
- Contact/location structured payloads.
- Message metadata (senderId, conversationId, timestamps, type).
- Delivery/read receipts metadata.

If desired, future versions can extend encrypted envelope usage to additional payload fields.

## 14) Failure Modes and User Experience
### Missing recipient public key
- Send operation fails with user-visible error.
- Message is not sent in plaintext fallback mode.

### Wrong password / cannot unlock private keys
- Incoming encrypted messages remain unreadable.
- UI shows encrypted placeholder.

### Rotation mismatch
- Old messages still decrypt if old private keys remain in key history.
- If old keys are lost, corresponding old content is unrecoverable.

### Device migration
- If encrypted keyring is not migrated, old encrypted history cannot be decrypted on new device unless key backup/import exists.

## 15) Operational Considerations
### Backups
If users lose local keyring and have no backup, encrypted history can become permanently unreadable.

Recommended future addition:
- Optional encrypted key backup/export/import flow.

### Multi-device
Current design stores private keys locally per device.
For seamless multi-device decryption, implement secure key transfer/backup UX.

### Compliance and observability
- Server logs should avoid accidental payload dumps.
- Keep logs metadata-only where possible.

## 16) Local Development and Verification
### Verify frontend build
```bash
cd frontend
npm run build
```

### Verify backend app load
```bash
cd chat-app-backend
node -e "require('./src/app'); console.log('backend app loaded')"
```

### Manual E2EE test
1. Register User A and User B.
2. Send text from A to B.
3. Confirm DB stores encrypted payload (not plaintext).
4. Confirm B sees decrypted plaintext.
5. Log out/in to validate key unlock path.
6. Simulate rotation and verify old/new decryptability.

## 17) Extension Roadmap
Potential next improvements:
- Encrypt captions and selected metadata fields.
- Add encrypted key backup/import/export.
- Add key verification UI (fingerprints/safety numbers).
- Add per-conversation/session keys.
- Implement forward secrecy with ratcheting protocol.
- Add E2EE status indicators per conversation/message.

## 18) Quick Reference
### Key files (frontend)
- `frontend/src/lib/e2ee.ts`
- `frontend/src/features/auth/pages/RegisterPage.tsx`
- `frontend/src/features/auth/pages/LoginPage.tsx`
- `frontend/src/features/chat/components/input/InputBar.tsx`
- `frontend/src/features/chat/hooks/useSocket.ts`
- `frontend/src/features/chat/components/layout/ChatWindow.tsx`

### Key files (backend)
- `chat-app-backend/src/models/User.model.js`
- `chat-app-backend/src/models/Message.model.js`
- `chat-app-backend/src/modules/user/user.routes.js`
- `chat-app-backend/src/modules/user/user.controller.js`
- `chat-app-backend/src/modules/user/user.service.js`
- `chat-app-backend/src/modules/message/message.schema.js`
- `chat-app-backend/src/modules/message/message.service.js`
- `chat-app-backend/src/sockets/handlers/message.handler.js`

---
If you want, the next step can be a dedicated Threat Model section with attacker categories and mitigations (device compromise, network attacker, backend compromise, and account takeover), plus diagrams for key and message flow.