/**
 * Re-save session JPEGs with EXIF Orientation applied to pixels (fixes files produced
 * before scan-sessions applied .rotate() during the sips→sharp step). JPEGs with no
 * Orientation tag are unchanged visually.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sessionsRoot = path.join(__dirname, '..', 'public', 'sessions')
const JPEG_QUALITY = 82

async function fixOne(jpgPath) {
  const rel = path.relative(sessionsRoot, jpgPath)
  const tmp = `${jpgPath}.orient-fix-tmp`
  try {
    const meta = await sharp(jpgPath).metadata()
    if (meta.orientation == null || meta.orientation === 1) {
      return
    }
    await sharp(jpgPath)
      .rotate()
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toFile(tmp)
    fs.renameSync(tmp, jpgPath)
    console.log(`Fixed: ${rel}`)
  } catch (e) {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp)
    console.warn(`Skip ${rel}: ${e.message}`)
  }
}

async function main() {
  if (!fs.existsSync(sessionsRoot)) {
    console.log('No public/sessions directory.')
    return
  }

  const entries = fs.readdirSync(sessionsRoot, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue
    const dir = path.join(sessionsRoot, entry.name)
    const files = fs.readdirSync(dir).filter((f) => {
      const ext = path.extname(f).toLowerCase()
      return ext === '.jpg' || ext === '.jpeg'
    })
    for (const f of files) {
      await fixOne(path.join(dir, f))
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
