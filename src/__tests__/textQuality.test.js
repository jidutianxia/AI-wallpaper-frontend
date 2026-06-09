import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const scanTargets = ['src', 'docs', 'vite.config.js']
const textExtensions = new Set(['.js', '.vue', '.md'])

const fromCodes = (...codes) => String.fromCharCode(...codes)

const mojibakeFragments = [
  fromCodes(0xfffd),
  fromCodes(0x951f, 0x65a4, 0x62f7),
  fromCodes(0x9354, 0x72ba, 0x6d47),
  fromCodes(0x93c6, 0x509b, 0x68e4),
  fromCodes(0x7eee, 0x9e43),
  fromCodes(0x93bc, 0x6ec5),
  fromCodes(0x947e, 0x75af),
  fromCodes(0x9411, 0xe162),
  fromCodes(0x6fb9, 0x4f7a),
  fromCodes(0x7487, 0x950b),
  fromCodes(0x6fb6, 0x8fab),
  fromCodes(0x9365, 0x5267),
  fromCodes(0x6fe1, 0x509b, 0x7049),
  fromCodes(0x6d93, 0x5b29, 0x7af4)
]

const collectTextFiles = (relativePath) => {
  const absolutePath = resolve(rootDir, relativePath)
  if (!existsSync(absolutePath)) return []

  const stats = statSync(absolutePath)
  if (stats.isFile()) {
    return textExtensions.has(extname(absolutePath)) ? [absolutePath] : []
  }

  return readdirSync(absolutePath).flatMap((entry) => {
    const entryPath = resolve(absolutePath, entry)
    const relativeEntryPath = entryPath.slice(rootDir.length + 1).replace(/\\/g, '/')
    if (relativeEntryPath.includes('/coverage/') || relativeEntryPath.includes('/dist/')) return []
    return collectTextFiles(relativeEntryPath)
  })
}

describe('text quality', () => {
  it('does not contain common UTF-8 mojibake fragments in source or docs', () => {
    const files = scanTargets.flatMap(collectTextFiles)
    const offenders = files.flatMap((file) => {
      const content = readFileSync(file, 'utf8')
      const matches = mojibakeFragments.filter(fragment => content.includes(fragment))
      return matches.length > 0
        ? [{ file: file.slice(rootDir.length + 1).replace(/\\/g, '/'), matches }]
        : []
    })

    expect(offenders).toEqual([])
  })
})
