const Media = require('../../models/Media.model')
const cloudinary = require('../../config/cloudinary')

const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
])

function uploadRawBufferToCloudinary(file) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'chat-app/documents',
        resource_type: 'raw',
        public_id: `${Date.now()}-${file.originalname}`,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) return reject(error)
        return resolve(result)
      }
    )

    stream.end(file.buffer)
  })
}

async function notImplemented() {
  const error = new Error('Media module not implemented yet')
  error.statusCode = 501
  throw error
}

async function uploadImage({ userId, file }) {
  if (!file) {
    const error = new Error('Image file is required')
    error.statusCode = 400
    throw error
  }

  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    const error = new Error('Only image files are allowed')
    error.statusCode = 400
    throw error
  }

  const base64 = file.buffer.toString('base64')
  const dataUri = `data:${file.mimetype};base64,${base64}`

  const uploaded = await cloudinary.uploader.upload(dataUri, {
    folder: 'chat-app/messages',
    resource_type: 'image',
  })

  const mediaDoc = await Media.create({
    type: 'image',
    url: uploaded.secure_url,
    publicId: uploaded.public_id,
    fileName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    uploadedBy: userId,
  })

  return {
    mediaUrl: uploaded.secure_url,
    media: mediaDoc.toObject(),
  }
}

async function uploadDocument({ userId, file }) {
  if (!file) {
    const error = new Error('Document file is required')
    error.statusCode = 400
    throw error
  }

  if (!file.mimetype || !ALLOWED_DOCUMENT_MIME_TYPES.has(file.mimetype)) {
    const error = new Error('Unsupported document type')
    error.statusCode = 400
    throw error
  }

  const maxSizeBytes = 20 * 1024 * 1024
  if (file.size > maxSizeBytes) {
    const error = new Error('Document exceeds 20MB limit')
    error.statusCode = 400
    throw error
  }

  const uploaded = await uploadRawBufferToCloudinary(file)

  const mediaDoc = await Media.create({
    type: 'file',
    url: uploaded.secure_url,
    publicId: uploaded.public_id,
    fileName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    uploadedBy: userId,
  })

  return {
    mediaUrl: uploaded.secure_url,
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
    media: mediaDoc.toObject(),
  }
}

async function uploadAudio({ userId, file }) {
  if (!file) {
    const error = new Error('Audio file is required')
    error.statusCode = 400
    throw error
  }

  if (!file.mimetype || !file.mimetype.startsWith('audio/')) {
    const error = new Error('Only audio files are allowed')
    error.statusCode = 400
    throw error
  }

  const maxSizeBytes = 15 * 1024 * 1024
  if (file.size > maxSizeBytes) {
    const error = new Error('Audio exceeds 15MB limit')
    error.statusCode = 400
    throw error
  }

  const base64 = file.buffer.toString('base64')
  const dataUri = `data:${file.mimetype};base64,${base64}`

  const uploaded = await cloudinary.uploader.upload(dataUri, {
    folder: 'chat-app/audio',
    resource_type: 'video',
  })

  const mediaDoc = await Media.create({
    type: 'audio',
    url: uploaded.secure_url,
    publicId: uploaded.public_id,
    fileName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    uploadedBy: userId,
  })

  return {
    mediaUrl: uploaded.secure_url,
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
    media: mediaDoc.toObject(),
  }
}

module.exports = { notImplemented, uploadImage, uploadDocument, uploadAudio }
