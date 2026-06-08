import { ElMessage } from 'element-plus'

const copyToClipboard = async (text) => {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text)
    return
  }

  const input = document.createElement('input')
  input.value = text
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  document.body.removeChild(input)
}

export function useShare() {
  const share = async ({ title, text, url }) => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url })
        return true
      }

      await copyToClipboard(url)
      ElMessage.success('链接已复制到剪贴板')
      return true
    } catch (error) {
      ElMessage.error('分享失败：' + (error.message || '未知错误'))
      return false
    }
  }

  return { share }
}
