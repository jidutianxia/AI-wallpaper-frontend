// PhotoSwipe retains its gallery, Escape handling, focus trap and slide navigation.
export function installVideoViewer(viewer) {
  const videos = new Set()
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  viewer.on('contentLoad', event => {
    const { content } = event
    if (content.type !== 'video') return
    event.preventDefault()
    const shell = document.createElement('div')
    shell.className = 'cinema-video-shell'
    const video = document.createElement('video')
    video.controls = true
    video.muted = true
    video.loop = true
    video.playsInline = true
    video.preload = 'none'
    video.poster = content.data.msrc
    video.setAttribute('aria-label', content.data.alt)
    video.dataset.src = content.data.src
    shell.append(video)
    content.element = shell
    content.video = video
    videos.add(video)
    video.onloadeddata = () => content.onLoaded()
    video.onerror = () => content.onError()
    content.state = 'loaded'
  })
  viewer.on('contentActivate', ({ content }) => {
    if (!content.video) return
    const video = content.video
    if (!video.getAttribute('src')) video.src = video.dataset.src
    if (!reduced && !document.hidden) video.play().catch(() => {})
  })
  viewer.on('contentDeactivate', ({ content }) => content.video?.pause())
  viewer.on('contentDestroy', ({ content }) => {
    if (content.video) { content.video.pause(); content.video.removeAttribute('src'); content.video.load(); videos.delete(content.video) }
  })
  const suspend = () => { if (document.hidden) videos.forEach(video => video.pause()) }
  document.addEventListener('visibilitychange', suspend)
  viewer.on('closingAnimationStart', () => videos.forEach(video => video.pause()))
  viewer.on('destroy', () => { videos.forEach(video => { video.pause(); video.removeAttribute('src'); video.load() }); videos.clear(); document.removeEventListener('visibilitychange', suspend) })
}
