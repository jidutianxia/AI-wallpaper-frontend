import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  likeWallpaper, 
  favoriteWallpaper, 
  likeCommunityPost, 
  favoriteCommunityPost,
  likeCommunityPostImage,
  favoriteCommunityPostImage
} from '@/api/wallpaper'
import { useUserStore } from '@/store/user'

/**
 * 通用交互逻辑 (Optimistic UI)
 * 适用于：壁纸卡片、社区帖子卡片、详情页
 */
export function useInteraction() {
  const userStore = useUserStore()
  const loading = ref(false)

  // 统一交互处理
  // target: 响应式对象 (ref.value 或 reactive object)，必须包含 id, liked/isLiked, likes, favorited/isFavorited 等字段
  // type: 'like' | 'favorite'
  // scope: 'wallpaper' | 'post' | 'image'
  // options: { postId, imageIndex } 仅 image scope 需要
  const toggleInteraction = async (target, type, scope = 'wallpaper', options = {}) => {
    if (!userStore.isAuthenticated) {
      ElMessage.warning('请先登录')
      return false
    }

    if (loading.value) return
    loading.value = true

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
      target.likes = (target.likes || 0) + (newVal ? 1 : -1)
    } else if (type === 'favorite') {
      const newVal = !target[keyFavorited]
      target[keyFavorited] = newVal
      if (typeof target.favorites === 'number') {
        target.favorites = target.favorites + (newVal ? 1 : -1)
      }
    }

    try {
      // 发送请求
      if (scope === 'wallpaper') {
        if (type === 'like') await likeWallpaper(target.id)
        else await favoriteWallpaper(target.id)
      } else if (scope === 'post') {
        if (type === 'like') await likeCommunityPost(target.id)
        else await favoriteCommunityPost(target.id)
      } else if (scope === 'image') {
        // 图片级交互需要 postId 和 index
        const { postId, imageIndex } = options
        if (type === 'like') await likeCommunityPostImage(postId, imageIndex)
        else await favoriteCommunityPostImage(postId, imageIndex)
      }
      
      // 成功：不做任何事，保持 UI 状态
      // 如果有列表状态管理需求（如从详情页返回），可以在这里通过 event bus 或 store 通知列表更新
      // 但由于对象引用通常是共享的（如果使用了 store），或者通过父子组件传递，直接修改 target 可能已经足够
      
    } catch (error) {
      // 失败：回滚状态
      console.error(`[Interaction] ${type} failed:`, error)
      Object.assign(target, originalState)
      ElMessage.error('操作失败，请重试')
    } finally {
      loading.value = false
    }
  }

  return {
    toggleInteraction
  }
}
