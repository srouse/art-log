import { spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import exifr from 'exifr'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sessionsRoot = path.join(__dirname, '..', 'public', 'sessions')

/** Shown in the app / printable */
const DISPLAY_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg'])
const HEIC_EXT = new Set(['.heic', '.heif'])

/** Max long edge for converted JPEGs (keeps files smaller for the web UI) */
const JPEG_MAX_EDGE = 2048
const JPEG_QUALITY = 82

function isHeic(filename) {
  return HEIC_EXT.has(path.extname(filename).toLowerCase())
}

function sortNames(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
}

function dateFromExifTags(tags) {
  if (!tags) return null
  const dt =
    tags.DateTimeOriginal ?? tags.DateTime ?? tags.CreateDate ?? tags.ModifyDate
  if (dt instanceof Date && !Number.isNaN(dt.getTime())) {
    return dt.toISOString()
  }
  return null
}

/**
 * ISO timestamp: EXIF capture time when present, else file mtime (SVG → null).
 * Mtime is a fallback when metadata was stripped (e.g. older HEIC→JPEG passes).
 */
async function getCapturedAtIso(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.svg') return null

  let exifIso = null
  try {
    const tags = await exifr.parse(filePath, {
      pick: ['DateTimeOriginal', 'DateTime', 'CreateDate', 'ModifyDate'],
      reviveValues: true,
    })
    exifIso = dateFromExifTags(tags)

    if (!exifIso) {
      const meta = await sharp(filePath, { failOn: 'none' }).metadata()
      if (meta.exif) {
        const fromBuf = await exifr.parse(meta.exif, {
          pick: ['DateTimeOriginal', 'DateTime', 'CreateDate', 'ModifyDate'],
          reviveValues: true,
        })
        exifIso = dateFromExifTags(fromBuf)
      }
    }
  } catch {
    // ignore
  }

  if (exifIso) return exifIso

  try {
    return fs.statSync(filePath).mtime.toISOString()
  } catch {
    return null
  }
}

/**
 * macOS: `sips` decodes iPhone HEIC reliably when Sharp/libheif cannot (e.g. HEVC 11.6003).
 * Writes a temp JPEG, then Sharp re-encodes for smaller mozjpeg output.
 */
function heicToJpegWithSips(heicPath, tmpJpegPath) {
  const r = spawnSync(
    'sips',
    ['-Z', String(JPEG_MAX_EDGE), '-s', 'format', 'jpeg', heicPath, '--out', tmpJpegPath],
    { encoding: 'utf8' },
  )
  if (r.status !== 0) {
    throw new Error((r.stderr || r.stdout || 'sips failed').trim())
  }
  if (!fs.existsSync(tmpJpegPath)) {
    throw new Error('sips did not create output file')
  }
}

/** Bake EXIF Orientation into pixels before re-encoding; keep other EXIF (e.g. capture date) when possible. */
async function recompressJpegToPath(srcPath, destPath) {
  await sharp(srcPath)
    .rotate()
    .withMetadata()
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toFile(destPath)
}

/** After a JPEG exists, remove the HEIC so you are not storing two copies. */
function deleteHeicDuplicate(heicPath, jpgPath) {
  if (!fs.existsSync(jpgPath) || !fs.existsSync(heicPath)) return
  fs.unlinkSync(heicPath)
  console.log(`  deleted duplicate HEIC: ${path.basename(heicPath)}`)
}

/**
 * Writes `<stem>.jpg` next to the HEIC if missing or HEIC is newer than the JPEG.
 * Removes the HEIC once the JPEG is in place.
 */
async function ensureJpegFromHeic(heicPath) {
  const dir = path.dirname(heicPath)
  const stem = path.parse(heicPath).name
  const jpgPath = path.join(dir, `${stem}.jpg`)
  const tmpPath = path.join(dir, `.${stem}.artlog-tmp.jpg`)

  let needsConvert = true
  if (fs.existsSync(jpgPath)) {
    const heicM = fs.statSync(heicPath).mtimeMs
    const jpgM = fs.statSync(jpgPath).mtimeMs
    needsConvert = heicM > jpgM
  }

  if (!needsConvert) {
    deleteHeicDuplicate(heicPath, jpgPath)
    return
  }

  const relOut = path.relative(sessionsRoot, jpgPath)

  try {
    if (process.platform === 'darwin') {
      try {
        heicToJpegWithSips(heicPath, tmpPath)
        try {
          await recompressJpegToPath(tmpPath, jpgPath)
        } catch {
          fs.renameSync(tmpPath, jpgPath)
        } finally {
          if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath)
        }
        console.log(`  HEIC → JPEG (sips + sharp): ${relOut}`)
        deleteHeicDuplicate(heicPath, jpgPath)
        return
      } catch (sipsErr) {
        console.warn(`  sips fallback: ${sipsErr.message}`)
      }
    }

    await sharp(heicPath)
      .rotate()
      .resize({
        width: JPEG_MAX_EDGE,
        height: JPEG_MAX_EDGE,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .withMetadata()
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toFile(jpgPath)
    console.log(`  HEIC → JPEG (sharp): ${relOut}`)
    deleteHeicDuplicate(heicPath, jpgPath)
  } catch (err) {
    console.warn(`  HEIC convert failed (${path.basename(heicPath)}): ${err.message}`)
    console.warn(
      '  Tip: on macOS, install/use `sips` (built in). On Linux, Sharp needs libheif with your HEIC codec, or convert with another tool first.',
    )
  }
}

/**
 * After HEIC handling: list files for the manifest. If a stem has a HEIC/HEIF, only `.jpg`/`.jpeg` for that stem is kept (the converted output).
 */
function listManifestFilenames(dir, heicStems) {
  const files = fs.readdirSync(dir).sort(sortNames)
  const out = []

  for (const f of files) {
    const ext = path.extname(f).toLowerCase()
    if (f.endsWith('.artlog-tmp.jpg')) continue
    if (HEIC_EXT.has(ext)) continue
    if (!DISPLAY_EXT.has(ext)) continue

    const stem = path.parse(f).name
    if (heicStems.has(stem) && ext !== '.jpg' && ext !== '.jpeg') {
      continue
    }
    out.push(f)
  }

  return out
}

/**
 * @returns {{ images: { path: string; capturedAt: string | null }[] }}
 */
async function processSessionDir(sessionId, dir) {
  const all = fs.readdirSync(dir)
  const heicFiles = all.filter((f) => isHeic(f))

  /** Capture time from HEIC before conversion (JPEG pass may strip EXIF). */
  const captureByStem = new Map()
  for (const f of heicFiles.sort(sortNames)) {
    const stem = path.parse(f).name
    const iso = await getCapturedAtIso(path.join(dir, f))
    if (iso) captureByStem.set(stem, iso)
  }

  for (const f of heicFiles.sort(sortNames)) {
    await ensureJpegFromHeic(path.join(dir, f))
  }

  const heicStems = new Set(heicFiles.map((f) => path.parse(f).name))
  const files = listManifestFilenames(dir, heicStems)

  const images = []
  for (const f of files) {
    const stem = path.parse(f).name
    const fullPath = path.join(dir, f)
    const capturedAt = captureByStem.get(stem) ?? (await getCapturedAtIso(fullPath))
    images.push({
      path: `/sessions/${sessionId}/${f}`,
      capturedAt,
    })
  }

  return { images }
}

async function main() {
  if (!fs.existsSync(sessionsRoot)) {
    fs.mkdirSync(sessionsRoot, { recursive: true })
  }

  const entries = fs.readdirSync(sessionsRoot, { withFileTypes: true })
  const sessions = []

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue
    const dir = path.join(sessionsRoot, entry.name)

    console.log(`Session: ${entry.name}`)
    const { images } = await processSessionDir(entry.name, dir)

    if (images.length === 0) continue

    const stat = fs.statSync(dir)
    const dateIso = stat.mtime.toISOString().slice(0, 10)

    sessions.push({
      id: entry.name,
      label: entry.name,
      date: dateIso,
      images,
    })
  }

  sessions.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }))

  const outPath = path.join(sessionsRoot, 'index.json')
  fs.writeFileSync(outPath, JSON.stringify({ sessions }, null, 2), 'utf8')
  console.log(`Wrote ${sessions.length} session(s) to ${outPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
