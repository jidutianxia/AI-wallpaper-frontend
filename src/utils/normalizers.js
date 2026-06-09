const toNumber = (value, fallback = 0) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

const parseMaybeJson = (value) => {
  if (typeof value !== 'string' || !value.trim().startsWith('{')) return value
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

export const normalizeImageUrl = (image) => {
  if (!image) return ''
  if (typeof image === 'string') return image
  return image.url || image.src || image.path || image.thumbUrl || image.originalUrl || ''
}

export const normalizeImages = (images, fallback = '') => {
  const list = Array.isArray(images) ? images : (images ? [images] : [])
  const normalized = list.map(normalizeImageUrl).filter(Boolean)
  if (normalized.length === 0 && fallback) normalized.push(normalizeImageUrl(fallback))
  return normalized
}

export const normalizeUser = (user) => {
  const source = parseMaybeJson(user)
  if (!source || typeof source !== 'object') {
    return {
      id: undefined,
      username: typeof source === 'string' ? source : '',
      nickname: '',
      avatarUrl: ''
    }
  }

  return {
    ...source,
    id: source.id ?? source.userId,
    username: source.username || source.name || '',
    nickname: source.nickname || source.displayName || '',
    avatarUrl: source.avatarUrl || source.avatar || ''
  }
}

export const normalizePost = (post = {}) => {
  const images = normalizeImages(post.images || post.imageList, post.cover || post.thumbUrl)
  const author = normalizeUser(post.author || post.user || post.uploader)

  return {
    ...post,
    id: post.id ?? post.postId,
    title: post.title || '',
    content: post.content || '',
    cover: post.cover || images[0] || '',
    images,
    imageCount: toNumber(post.imageCount ?? images.length, images.length),
    author,
    liked: Boolean(post.liked ?? post.isLiked),
    favorited: Boolean(post.favorited ?? post.isFavorited),
    likes: toNumber(post.likes ?? post.likesCount),
    favorites: toNumber(post.favorites ?? post.favoriteCount ?? post.favoritesCount),
    commentsCount: toNumber(post.commentsCount ?? post.commentCount ?? post.comments?.length)
  }
}

export const normalizeWallpaper = (wallpaper = {}) => {
  const uploader = normalizeUser(wallpaper.uploader || wallpaper.author)

  return {
    ...wallpaper,
    id: wallpaper.id ?? wallpaper.wallpaperId,
    title: wallpaper.title || '',
    url: wallpaper.url || wallpaper.originalUrl || wallpaper.imageUrl || '',
    thumbUrl: wallpaper.thumbUrl || wallpaper.thumbnailUrl || wallpaper.cover || wallpaper.url || '',
    uploader,
    liked: Boolean(wallpaper.liked ?? wallpaper.isLiked),
    favorited: Boolean(wallpaper.favorited ?? wallpaper.isFavorited),
    likes: toNumber(wallpaper.likes ?? wallpaper.likesCount),
    favorites: toNumber(wallpaper.favorites ?? wallpaper.favoriteCount ?? wallpaper.favoritesCount),
    views: toNumber(wallpaper.views),
    downloads: toNumber(wallpaper.downloads)
  }
}

export const normalizePagedResult = (result, itemNormalizer = (item) => item) => {
  const source = Array.isArray(result)
    ? result
    : (result?.data && typeof result.data === 'object' ? result.data : result)
  const items = Array.isArray(source) ? source : (source?.items || source?.records || source?.list || source?.rows || [])

  return {
    items: items.map(itemNormalizer),
    total: toNumber(source?.total ?? source?.totalCount ?? source?.count ?? source?.totalElements ?? items.length, items.length),
    page: toNumber(source?.page ?? source?.current ?? source?.pageNum),
    size: toNumber(source?.size ?? source?.pageSize ?? source?.limit ?? items.length, items.length)
  }
}
