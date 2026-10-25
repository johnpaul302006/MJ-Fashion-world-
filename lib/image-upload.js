'use client'

// Reads an image file the user picks or drops, compresses and resizes it (so it fits in MongoDB safely)
// and returns an optimized data URL with metadata (width, height, size in KB).
export function fileToDataUrl(file, maxSize = 800, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file provided'))
    }
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Please select a valid image file (JPEG, PNG, WebP)'))
    }

    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        try {
          const maxDim = Math.max(img.width, img.height)
          const scale = maxDim > maxSize ? maxSize / maxDim : 1
          const width = Math.round(img.width * scale)
          const height = Math.round(img.height * scale)

          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) throw new Error('Canvas context not available')

          // Clean white background for transparent PNGs converted to JPEG
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, width, height)
          ctx.drawImage(img, 0, 0, width, height)

          const dataUrl = canvas.toDataURL('image/jpeg', quality)
          resolve(dataUrl)
        } catch (err) {
          reject(err)
        }
      }
      img.onerror = () => reject(new Error('Could not decode image file'))
      img.src = reader.result
    }
    reader.onerror = () => reject(new Error('Could not read image from disk'))
    reader.readAsDataURL(file)
  })
}

// Enhanced image processor with size & dimension stats
export async function processAdminImage(file, maxSize = 800, quality = 0.82) {
  const dataUrl = await fileToDataUrl(file, maxSize, quality)
  const approxBytes = Math.round((dataUrl.length * 3) / 4)
  const sizeKb = (approxBytes / 1024).toFixed(1)
  return {
    dataUrl,
    sizeKb,
    name: file.name,
  }
}
