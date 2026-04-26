export async function resizeImage(file, options = {}) {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    outputType = 'image/jpeg',
  } = options

  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Invalid image file')
  }

  const image = await loadImage(file)

  const { width, height } = calculateSize(
    image.width,
    image.height,
    maxWidth,
    maxHeight
  )

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  ctx.drawImage(image, 0, 0, width, height)

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result)
        else reject(new Error('Failed to resize image'))
      },
      outputType,
      quality
    )
  })

  return new File(
    [blob],
    replaceExtension(file.name, outputType === 'image/png' ? 'png' : 'jpg'),
    { type: outputType }
  )
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    image.src = url
  })
}

function calculateSize(originalWidth, originalHeight, maxWidth, maxHeight) {
  let width = originalWidth
  let height = originalHeight

  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width)
    width = maxWidth
  }

  if (height > maxHeight) {
    width = Math.round((width * maxHeight) / height)
    height = maxHeight
  }

  return { width, height }
}

function replaceExtension(filename, extension) {
  return filename.replace(/\.[^/.]+$/, '') + `.${extension}`
}