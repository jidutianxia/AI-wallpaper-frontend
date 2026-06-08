import { ElMessage } from 'element-plus'
import { 
  likeWallpaper, 
  favoriteWallpaper, 
  likeCommunityPost, 
  favoriteCommunityPost,
  likeCommunityPostImage,
  favoriteCommunityPostImage
} from '@/api'
import { useUserStore } from '@/store/user'
import { requestAuth } from '@/utils/authEvents'

/**
 * 通用交互逻辑 (Optimistic UI)
 * 适用于：壁纸卡片、社区帖子卡片、详情页
 */
export function useInteraction() {
  const userStore = useUserStore()
  
  // 统一交互处理
  // target: 响应式对象 (ref.value 或 reactive object)，必须包含 id, liked/isLiked, likes, favorited/isFavorited 等字段
  // type: 'like' | 'favorite'
  // scope: 'wallpaper' | 'post'
  const toggleInteraction = async (target, type, scope = 'wallpaper', options = {}) => {
    if (!userStore.isAuthenticated) {
      ElMessage.warning('请先登录')
      requestAuth({ reason: 'interaction' })
      return false
    }

    // Prevent duplicate clicks on the same target
    if (target._interacting) return false
    target._interacting = true

    // 字段兼容处理
    // 后端返回字段可能不统一 (liked vs isLiked)，这里做归一化
    const keyLiked = 'liked' in target ? 'liked' : 'isLiked'
    const keyFavorited = 'favorited' in target ? 'favorited' : 'isFavorited'
    
    // 备份原始状态 (用于回滚)
    const originalState = {
      [keyLiked]: target[keyLiked],
      likes: target.likes,
      [keyFavorited]: target[keyFavorited],
      favorites: target.favorites // 有些对象可能没有 favorites 计数，undefined 也没关系
    }

    // 乐观更新 UI
    if (type === 'like') {
      const newVal = !target[keyLiked]
      target[keyLiked] = newVal
      target.likes = Math.max(0, (target.likes || 0) + (newVal ? 1 : -1))
    } else if (type === 'favorite') {
      const newVal = !target[keyFavorited]
      target[keyFavorited] = newVal
      if (typeof target.favorites === 'number') {
        target.favorites = Math.max(0, target.favorites + (newVal ? 1 : -1))
      }
    }

    try {
      // 发送请求
      let result
      if (scope === 'wallpaper') {
        if (type === 'like') result = await likeWallpaper(target.id)
        else result = await favoriteWallpaper(target.id)
      } else if (scope === 'post') {
        if (type === 'like') result = await likeCommunityPost(target.id)
        else result = await favoriteCommunityPost(target.id)
      } else if (scope === 'image') {
        const postId = options.postId ?? target.postId
        const imageIndex = options.imageIndex ?? target.index
        if (type === 'like') result = await likeCommunityPostImage(postId, imageIndex)
        else result = await favoriteCommunityPostImage(postId, imageIndex)
      }

      if (result && typeof result === 'object') {
        if (typeof result.liked !== 'undefined') target[keyLiked] = !!result.liked
        if (typeof result.isLiked !== 'undefined') target[keyLiked] = !!result.isLiked
        if (typeof result.likes !== 'undefined') target.likes = result.likes
        if (typeof result.favorited !== 'undefined') target[keyFavorited] = !!result.favorited
        if (typeof result.isFavorited !== 'undefined') target[keyFavorited] = !!result.isFavorited
        if (typeof result.favorites !== 'undefined') target.favorites = result.favorites
      }

      if (options.successMessage) {
        const message = typeof options.successMessage === 'function'
          ? options.successMessage(target)
          : options.successMessage
        if (message) ElMessage.success(message)
      }
      return true
      
    } catch (error) {
      // 失败：回滚状态
      console.error(`[Interaction] ${type} failed:`, error)
      Object.assign(target, originalState)
      ElMessage.error('操作失败，请重试')
      return false
    } finally {
      // Throttle unlock
      setTimeout(() => {
        target._interacting = false
      }, 500)
    }
  }

  return {
    toggleInteraction
  }
}
