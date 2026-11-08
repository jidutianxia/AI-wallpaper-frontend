import { onBeforeUnmount, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { installCinemaViewer } from '@/utils/cinemaViewer'
import '@/styles/cinema-viewer.css'
import { getImageUrl } from '@/utils/imageHelper'
import { isVideo, mediaPoster } from '@/utils/media'
import { installVideoViewer } from '@/utils/videoViewer'

// PhotoSwipe is loaded only when a visitor opens an image.
export function usePhotoViewer() {
  const opening = ref(false)
  const isOpen = ref(false)
  let viewer
  let disposed = false
  let releaseOpeningKeys = () => {}
  const open = async (items, index = 0) => {
    if (opening.value || isOpen.value || disposed) return
    // Capture before the initiating button becomes disabled during lazy loading.
    const returnTo = document.activeElement
    opening.value = true
    let closeOnReady = false
    // PhotoSwipe handles keys only after the entry animation.
    const onOpeningKeydown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeOnReady = true
      }
    }
    const releaseKeys = () => window.removeEventListener('keydown', onOpeningKeydown, true)
    releaseOpeningKeys = releaseKeys
    window.addEventListener('keydown', onOpeningKeydown, true)
    try {
      const [{ default: PhotoSwipe }] = await Promise.all([
        import('photoswipe'),
        import('photoswipe/style.css'),
      ])
      const dataSource = await Promise.all(
        items.map(async (item) => {
          const src = getImageUrl(item.url || item.src || item.thumb)
          let width = Number(item.width)
          let height = Number(item.height)
          const video = isVideo(src)
          if (video && !(width > 0 && height > 0)) { width = 1920; height = 1080 }
          if (!(width > 0 && height > 0)) {
            const dimensions = await new Promise((resolve, reject) => {
              const img = new Image()
              const timeout = setTimeout(() => {
                img.onload = img.onerror = null
                reject(new Error('Image timeout'))
              }, 12000)
              img.onload = () => {
                clearTimeout(timeout)
                resolve({ width: img.naturalWidth, height: img.naturalHeight })
              }
              img.onerror = () => {
                clearTimeout(timeout)
                reject(new Error('Image unavailable'))
              }
              img.src = src
            })
            width = dimensions.width
            height = dimensions.height
          }
          return {
            src,
            ...(video ? { type: 'video' } : {}),
            width,
            height,
            alt: item.title || '壁纸',
            msrc: video ? mediaPoster(item) : getImageUrl(item.thumb || item.thumbUrl || src),
          }
        }),
      )
      if (disposed || closeOnReady) return
      const instance = new PhotoSwipe({
        dataSource,
        index,
        bgOpacity: 1,
        mainClass: 'cinema-viewer',
        counter: false,
        showHideAnimationType: 'fade',
        showAnimationDuration: window.matchMedia?.(
          '(prefers-reduced-motion: reduce)',
        ).matches
          ? 0
          : 560,
        hideAnimationDuration: window.matchMedia?.(
          '(prefers-reduced-motion: reduce)',
        ).matches
          ? 0
          : 320,
        wheelToZoom: true,
        returnFocus: false,
        paddingFn: (viewport) => ({ top: viewport.x < 600 ? 78 : 54, bottom: dataSource.length > 1 ? 116 : 72, left: viewport.x < 600 ? 0 : 56, right: viewport.x < 600 ? 0 : 56 }),
        closeTitle: '关闭预览',
        zoomTitle: '放大 / 缩小',
        arrowPrevTitle: '上一张',
        arrowNextTitle: '下一张',
        errorMsg: '图片加载失败',
        indexIndicatorSep: ' / ',
      })
      installCinemaViewer(instance, dataSource)
      installVideoViewer(instance)
      instance.on('bindEvents', () => {
        releaseKeys()
        if (disposed) instance.destroy()
        else if (closeOnReady) instance.close()
      })
      instance.on('destroy', () => {
        releaseKeys()
        viewer = undefined
        isOpen.value = false
        if (!disposed && returnTo?.isConnected) returnTo.focus({ preventScroll: true })
      })
      viewer = instance
      isOpen.value = instance.init() !== false
    } catch {
      if (!disposed) ElMessage.error('图片暂时无法打开，请重试')
    } finally {
      if (!isOpen.value) releaseKeys()
      opening.value = false
    }
  }
  onBeforeUnmount(() => {
    disposed = true
    releaseOpeningKeys()
    viewer?.destroy()
  })
  return { open, opening, isOpen }
}
