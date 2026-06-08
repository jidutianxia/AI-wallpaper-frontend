import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ElMessage } from 'element-plus'
import { useShare } from '../useShare'

vi.mock('element-plus', () => ({
  ElMessage: {
    error: vi.fn(),
    success: vi.fn()
  }
}))

describe('useShare', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('uses the Web Share API when available', async () => {
    const shareApi = vi.fn().mockResolvedValue()
    vi.stubGlobal('navigator', { share: shareApi })
    const { share } = useShare()

    await expect(share({ title: 'Title', text: 'Text', url: 'https://example.com' })).resolves.toBe(true)

    expect(shareApi).toHaveBeenCalledWith({
      title: 'Title',
      text: 'Text',
      url: 'https://example.com'
    })
    expect(ElMessage.success).not.toHaveBeenCalled()
  })

  it('copies the url to clipboard when native sharing is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue()
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const { share } = useShare()

    await expect(share({ url: 'https://example.com/wallpaper/1' })).resolves.toBe(true)

    expect(writeText).toHaveBeenCalledWith('https://example.com/wallpaper/1')
    expect(ElMessage.success).toHaveBeenCalled()
  })

  it('falls back to execCommand copy when clipboard api is unavailable', async () => {
    const execCommand = vi.fn().mockReturnValue(true)
    vi.stubGlobal('navigator', {})
    document.execCommand = execCommand
    const { share } = useShare()

    await expect(share({ url: 'https://example.com/fallback' })).resolves.toBe(true)

    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(document.body.children).toHaveLength(0)
  })

  it('returns false and reports an error when sharing fails', async () => {
    vi.stubGlobal('navigator', {
      share: vi.fn().mockRejectedValue(new Error('denied'))
    })
    const { share } = useShare()

    await expect(share({ url: 'https://example.com' })).resolves.toBe(false)

    expect(ElMessage.error).toHaveBeenCalledWith(expect.stringContaining('denied'))
  })
})
