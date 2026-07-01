const cloudName = import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME

export function cloudinaryVideoUrl(publicId: string, format: 'mp4' | 'm3u8' = 'mp4'): string {
  if (!cloudName || !publicId) return ''

  return `https://res.cloudinary.com/${cloudName}/video/upload/q_auto/${publicId}.${format}`
}
