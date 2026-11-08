// PhotoSwipe owns image transforms, zoom, gestures and focus trapping.
// This layer only animates the surrounding light and presentation controls.
export function installCinemaViewer(viewer, items) {
  let timer, frame, root, cleanup = () => {}
  viewer.on('afterInit', () => {
    root = viewer.element
    const ambient = document.createElement('div')
    ambient.className = 'cinema-light'
    ambient.setAttribute('aria-hidden', 'true')
    const lights = [0, 1].map(() => {
      const light = document.createElement('div')
      ambient.append(light)
      return light
    })
    root.querySelector('.pswp__bg').after(ambient)
    const footer = document.createElement('div')
    footer.className = 'cinema-footer pswp__hide-on-close'
    const title = document.createElement('div')
    title.className = 'cinema-caption'
    title.setAttribute('aria-live', 'polite')
    footer.append(title)
    const rail = document.createElement('div')
    rail.className = 'viewer-filmstrip'
    rail.setAttribute('role', 'group')
    rail.setAttribute('aria-label', '切换壁纸')
    const thumbnails = items.map((item, index) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.setAttribute('aria-label', `查看${item.alt}`)
      button.title = item.alt
      const img = document.createElement('img')
      img.src = item.msrc || item.src
      img.alt = ''
      img.loading = 'lazy'
      button.append(img)
      button.onclick = () => viewer.goTo(index)
      rail.append(button)
      return button
    })
    if (items.length > 1) footer.append(rail)
    root.append(footer)
    const lightSwitch = document.createElement('button')
    lightSwitch.type = 'button'
    lightSwitch.className = 'pswp__button cinema-light-switch'
    lightSwitch.setAttribute('aria-label', '环境光')
    lightSwitch.setAttribute('aria-pressed', 'true')
    lightSwitch.title = '环境光'
    lightSwitch.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>'
    root.querySelector('.pswp__top-bar')?.prepend(lightSwitch)
    lightSwitch.onclick = () => {
      const off = root.classList.toggle('cinema-lights-off')
      lightSwitch.setAttribute('aria-pressed', String(!off))
    }
    let lightIndex = 0
    const update = () => {
      const index = viewer.currIndex
      const item = items[index]
      if (!item) return
      title.textContent = item.alt === '壁纸' ? '' : item.alt
      lightIndex = 1 - lightIndex
      // JSON quoting keeps arbitrary image URLs inside a CSS string.
      lights[lightIndex].style.backgroundImage = `url(${JSON.stringify(item.msrc || item.src)})`
      lights.forEach((light, i) => light.classList.toggle('is-lit', i === lightIndex))
      thumbnails.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)))
      thumbnails[index]?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })
      root.querySelectorAll('.cinema-arriving').forEach(el => el.classList.remove('cinema-arriving'))
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => viewer.currSlide?.container?.classList.add('cinema-arriving'))
    }
    const wake = () => {
      root.classList.remove('cinema-idle')
      clearTimeout(timer)
      timer = setTimeout(() => {
        // Never hide a keyboard user's currently focused control.
        if (!root.contains(document.activeElement) || document.activeElement === root) root.classList.add('cinema-idle')
      }, 2800)
    }
    for (const event of ['pointermove', 'pointerdown', 'keydown', 'focusin', 'focusout']) root.addEventListener(event, wake)
    viewer.on('tapAction', (event) => {
      event.preventDefault()
      wake()
    })
    viewer.on('change', () => { update(); wake() })
    update()
    wake()
    cleanup = () => {
      for (const event of ['pointermove', 'pointerdown', 'keydown', 'focusin', 'focusout']) root.removeEventListener(event, wake)
    }
  })
  viewer.on('closingAnimationStart', () => root?.classList.add('cinema-closing'))
  viewer.on('destroy', () => { clearTimeout(timer); cancelAnimationFrame(frame); cleanup() })
}
