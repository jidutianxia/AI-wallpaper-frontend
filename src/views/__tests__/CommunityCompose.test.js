import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import CommunityCompose from '../CommunityCompose.vue'
import { createCommunityPost, getCategories, uploadCommunityImage } from '@/api'
import { installBrowserMocks, mountOptions } from '@/test/testUtils'
import { ElMessage } from 'element-plus'

const push = vi.fn()
const onBeforeRouteLeave = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
  onBeforeRouteLeave: (...args) => onBeforeRouteLeave(...args)
}))

vi.mock('@/api', () => ({
  createCommunityPost: vi.fn(),
  getCategories: vi.fn(),
  uploadCommunityImage: vi.fn()
}))

vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus')
  return {
    ...actual,
    ElMessage: {
      error: vi.fn(),
      success: vi.fn(),
      warning: vi.fn()
    }
  }
})

describe('CommunityCompose view', () => {
  beforeEach(() => {
    installBrowserMocks()
    vi.clearAllMocks()
    vi.mocked(getCategories).mockResolvedValue([{ id: 1, name: 'Nature' }])
    vi.mocked(createCommunityPost).mockResolvedValue({ id: 10 })
  })

  it('tracks upload progress and replaces blob url with the remote url', async () => {
    const wrapper = mount(CommunityCompose, mountOptions())
    await flushPromises()

    const raw = new File(['image'], 'wallpaper.png', { type: 'image/png' })
    const uploadFile = { uid: '1', name: raw.name, raw, url: 'blob:local' }
    wrapper.vm.fileList.push(uploadFile)

    vi.mocked(uploadCommunityImage).mockImplementation(async (_formData, config) => {
      config.onUploadProgress({ loaded: 5, total: 10 })
      return { url: '/uploads/wallpaper.png' }
    })

    const onSuccess = vi.fn((response) => wrapper.vm.onUploadSuccess(response, uploadFile))
    const onProgress = vi.fn()

    await wrapper.vm.onHttpRequest({
      file: raw,
      onSuccess,
      onError: vi.fn(),
      onProgress
    })

    expect(onProgress).toHaveBeenCalledWith({ percent: 50 })
    expect(uploadFile.uploadStatus).toBe('success')
    expect(uploadFile.uploadPercent).toBe(100)
    expect(uploadFile.url).toBe('/uploads/wallpaper.png')
  })

  it('blocks publishing when an uploaded file is failed', async () => {
    const wrapper = mount(CommunityCompose, mountOptions())
    await flushPromises()

    wrapper.vm.form.title = 'Share'
    wrapper.vm.form.content = 'Content'
    wrapper.vm.fileList.push({ uid: '1', name: 'broken.png', url: '/broken.png', uploadStatus: 'fail' })

    await wrapper.vm.publish()

    expect(ElMessage.error).toHaveBeenCalledWith('第 1 张图片上传失败，请重传后再发布')
    expect(createCommunityPost).not.toHaveBeenCalled()
  })

  it('navigates with the router after a successful publish', async () => {
    const wrapper = mount(CommunityCompose, mountOptions())
    await flushPromises()

    wrapper.vm.form.title = 'Share'
    wrapper.vm.form.content = 'Content'

    await wrapper.vm.publish()

    expect(createCommunityPost).toHaveBeenCalledWith({
      title: 'Share',
      content: 'Content',
      tags: [],
      images: [],
      wallpaperSubmissions: undefined
    })
    expect(push).toHaveBeenCalledWith('/community')
  })
})
