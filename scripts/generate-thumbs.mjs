/**
 * Generates small WebP thumbnails for every quest image.
 *
 *   public/images/12.JPEG  ──►  public/images/thumbs/12.webp  (max 480px, ~20 KB)
 *
 * Thumbnails are used for the blurred backdrop, the photo grid, the level
 * cards and the end-of-level mosaic, so the full photos are only loaded
 * when actually playing. Existing thumbnails newer than their source are skipped.
 *
 * Usage: npm run thumbs   (also runs automatically before `npm run build`)
 */
import { readFile, mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));
const publicDir = path.join(root, 'public');
const thumbsDir = path.join(publicDir, 'images', 'thumbs');
const MAX_SIZE = 480;

const quests = JSON.parse(await readFile(path.join(root, 'src', 'quests.json'), 'utf8'));

async function isUpToDate(source, target) {
    try {
        const [src, dst] = await Promise.all([stat(source), stat(target)]);
        return dst.mtimeMs >= src.mtimeMs;
    } catch {
        return false;
    }
}

await mkdir(thumbsDir, { recursive: true });

let created = 0;
for (const quest of quests) {
    if (!quest.url) {
        continue;
    }

    const source = path.join(publicDir, quest.url);
    const target = path.join(thumbsDir, path.parse(quest.url).name + '.webp');

    if (await isUpToDate(source, target)) {
        continue;
    }

    await sharp(source).rotate().resize(MAX_SIZE, MAX_SIZE, { fit: 'inside' }).webp({ quality: 72 }).toFile(target);
    created++;
}

console.log(`thumbs: ${created} created, ${quests.filter((q) => q.url).length - created} up to date`);
