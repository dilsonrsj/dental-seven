import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const ENTRAR_BG = { r: 7, g: 9, b: 15 };
const APP_BG = { r: 0, g: 0, b: 0 };

/** Apenas pixels de fundo (preto/glow escuro). Nunca branco ou azul do logo. */
function isBackgroundPixel(r, g, b) {
  if (r >= 195 && g >= 195 && b >= 195) return false;
  if (b >= 70 && b >= r + 4 && b >= g + 2) return false;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max - min;

  if (max <= 55 && saturation <= 25) return true;
  if (max <= 78 && b >= r - 6 && b >= g - 6 && saturation <= 48) return true;

  return false;
}

function floodFillBackground(pixels, width, height) {
  const visited = new Uint8Array(width * height);
  const queue = [];

  const trySeed = (x, y) => {
    const index = y * width + x;
    if (visited[index]) return;
    visited[index] = 1;

    const offset = index * 4;
    const r = pixels[offset];
    const g = pixels[offset + 1];
    const b = pixels[offset + 2];

    if (!isBackgroundPixel(r, g, b)) return;

    pixels[offset + 3] = 0;
    queue.push([x, y]);
  };

  for (let x = 0; x < width; x += 1) {
    trySeed(x, 0);
    trySeed(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    trySeed(0, y);
    trySeed(width - 1, y);
  }

  while (queue.length > 0) {
    const [x, y] = queue.shift();
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;

      const index = ny * width + nx;
      if (visited[index]) continue;
      visited[index] = 1;

      const offset = index * 4;
      const r = pixels[offset];
      const g = pixels[offset + 1];
      const b = pixels[offset + 2];

      if (!isBackgroundPixel(r, g, b)) continue;

      pixels[offset + 3] = 0;
      queue.push([nx, ny]);
    }
  }
}

async function makeTransparentFromFile(inputPath) {
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });

  const pixels = new Uint8Array(data);
  floodFillBackground(pixels, info.width, info.height);

  return {
    pipeline: sharp(pixels, {
      raw: { width: info.width, height: info.height, channels: 4 },
    }),
    width: info.width,
    height: info.height,
  };
}

async function exportPng(pipeline, target) {
  await fs.mkdir(path.dirname(target), { recursive: true });
  await pipeline.png({ compressionLevel: 9 }).toFile(target);
  console.log("Wrote", target);
}

async function compositeOnBackground(transparent, background, target) {
  const overlay = await transparent.pipeline.png().toBuffer();

  await sharp({
    create: {
      width: transparent.width,
      height: transparent.height,
      channels: 4,
      background: { ...background, alpha: 255 },
    },
  })
    .composite([{ input: overlay, top: 0, left: 0 }])
    .png({ compressionLevel: 9 })
    .toFile(target);

  console.log("Wrote", target);
}

async function verifyWhitePreserved(pngPath) {
  const { data, info } = await sharp(pngPath).raw().toBuffer({ resolveWithObject: true });
  let whiteOpaque = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3] ?? 255;
    if (r >= 200 && g >= 200 && b >= 200 && a > 200) whiteOpaque += 1;
  }
  console.log(`Verify ${path.basename(pngPath)}: ${whiteOpaque} opaque white pixels`);
}

async function processDentalSeven() {
  const source = path.join(
    root,
    "public/brand/drafts/dental-seven-logo-icon-dark-v2.png",
  );

  const fullTransparent = await makeTransparentFromFile(source);
  const fullOut = path.join(root, "public/brand/dental-seven-logo-transparent-v2.png");
  await exportPng(fullTransparent.pipeline.clone(), fullOut);
  await verifyWhitePreserved(fullOut);

  await compositeOnBackground(
    fullTransparent,
    ENTRAR_BG,
    path.join(root, "public/brand/dental-seven-logo-on-entrar-v2.png"),
  );

  await compositeOnBackground(
    fullTransparent,
    APP_BG,
    path.join(root, "public/brand/dental-seven-logo-on-dark-v2.png"),
  );

  const meta = await sharp(source).metadata();
  const markHeight = Math.round(meta.height * 0.62);
  const markBuffer = await sharp(source)
    .extract({ left: 0, top: 0, width: meta.width, height: markHeight })
    .png()
    .toBuffer();

  const markTransparent = await makeTransparentFromFile(markBuffer);
  const markOut = path.join(root, "public/brand/dental-seven-icon-transparent-v2.png");
  await exportPng(markTransparent.pipeline.clone().trim({ threshold: 1 }), markOut);
  await verifyWhitePreserved(markOut);

  await compositeOnBackground(
    markTransparent,
    APP_BG,
    path.join(root, "public/brand/dental-seven-icon-on-dark-v2.png"),
  );

  for (const target of [
    path.join(root, "src/app/icon.png"),
    path.join(root, "src/app/apple-icon.png"),
    path.join(root, "public/brand/dental-seven-icon.png"),
  ]) {
    await sharp(markOut)
      .resize(512, 512, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(target);
    console.log("Wrote", target);
  }
}

async function installDr7Logo() {
  const source = path.join(root, "public/brand/drafts/dr7-logo.png");
  const target = path.join(root, "public/brand/dr7-logo.png");
  await fs.copyFile(source, target);
  console.log("Wrote", target);
}

await processDentalSeven();
await installDr7Logo();
