import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");
const svgPath = path.join(publicDir, "pundi-icon.svg");
const svgBuffer = fs.readFileSync(svgPath);

const sizes = [
  { size: 32, name: "favicon-32.png" },
  { size: 180, name: "apple-touch-icon.png" },
  { size: 192, name: "icon-192.png" },
  { size: 512, name: "icon-512.png" },
];

for (const { size, name } of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(path.join(publicDir, name));
  console.log(`Generated ${name} (${size}x${size})`);
}

// Maskable version needs safe-zone padding (icon content within inner 80%)
// so Android/iOS don't crop the house+heart when applying a mask shape.
const maskableSize = 512;
const pad = Math.round(maskableSize * 0.1);
const inner = maskableSize - pad * 2;
const innerPng = await sharp(svgBuffer).resize(inner, inner).png().toBuffer();
await sharp({
  create: {
    width: maskableSize,
    height: maskableSize,
    channels: 4,
    background: "#1a1f2e",
  },
})
  .composite([{ input: innerPng, top: pad, left: pad }])
  .png()
  .toFile(path.join(publicDir, "icon-512-maskable.png"));
console.log("Generated icon-512-maskable.png (512x512, padded)");
