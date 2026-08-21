'use client'

// Reads an image file the user picks, shrinks it (so it fits in MongoDB for free)
// and returns an "image data URL" that the website can show and save.
export function fileToDataUrl(file, maxSize = 700, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => reject(new Error('Could not read that image file'))
      img.src = reader.result
    }
    reader.onerror = () => reject(new Error('Could not read that image file'))
    reader.readAsDataURL(file)
  })
}