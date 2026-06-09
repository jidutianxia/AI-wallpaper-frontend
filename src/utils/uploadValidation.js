const DEFAULT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export const bytesToMB = (bytes) => bytes / 1024 / 1024

// 统一返回 { valid, message }，方便 Element Plus before-upload 和自定义上传请求共用。
export const validateImageFile = (file, options = {}) => {
  const {
    allowedTypes = DEFAULT_IMAGE_TYPES,
    maxSizeMB = 10,
    required = true
  } = options

  if (!file) {
    return {
      valid: !required,
      message: required ? '请选择图片文件' : ''
    }
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      message: `仅支持 ${allowedTypes.map(type => type.replace('image/', '').toUpperCase()).join('/')} 格式`
    }
  }

  if (bytesToMB(file.size) > maxSizeMB) {
    return {
      valid: false,
      message: `图片大小不能超过 ${maxSizeMB}MB`
    }
  }

  return { valid: true, message: '' }
}

// 多图上传数量校验单独拆出，便于 on-exceed 与发布前检查复用。
export const validateUploadCount = (files, maxCount) => {
  const count = Array.isArray(files) ? files.length : 0
  if (count > maxCount) {
    return {
      valid: false,
      message: `最多只能上传 ${maxCount} 张图片`
    }
  }
  return { valid: true, message: '' }
}
