import { getImageUrl } from './imageHelper'

export const isVideo = value => /\.(mp4|webm)(?:[?#]|$)/i.test(getImageUrl(value))
export function mediaPoster(value) {
  const src = getImageUrl(value)
  if (!isVideo(src)) return src
  const thumb = value?.thumbUrl || value?.thumb || value?.poster
  return thumb && !isVideo(thumb) ? getImageUrl(thumb) : src.split(/[?#]/)[0] + '.jpg'
}
