import { supabase } from '../lib/supabase'
import { resizeImage } from './resizeImage'

export async function uploadDogImage(file, dogName = 'dog') {
  if (!file) return null

  const resizedFile = await resizeImage(file, {
    maxWidth: 900,
    maxHeight: 900,
    quality: 0.75,
    outputType: 'image/jpeg',
  })

  const safeDogName = dogName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const fileName = `${safeDogName || 'dog'}-${Date.now()}.jpg`
  const filePath = `dogs/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('dog-images')
    .upload(filePath, resizedFile, {
      cacheControl: '3600',
      contentType: 'image/jpeg',
      upsert: false,
    })

  if (uploadError) {
    throw uploadError
  }

  const { data } = supabase.storage
    .from('dog-images')
    .getPublicUrl(filePath)

  return data.publicUrl
}