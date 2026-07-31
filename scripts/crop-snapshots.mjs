/**
 * Create framed marketing snapshots + cache-bust hashes.
 * Usage: node scripts/crop-snapshots.mjs
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, "../public/snapshots");
const OUT = path.join(__dirname, "../public/snapshots/framed");
const META_OUT = path.join(__dirname, "../lib/marketing/snapshot-aspects.json");

const MAX_W = 1600;
const TARGET_ASPECT = 16 / 10;

const FILES = {
  dash: "snapshot-dash.png",
  sites: "snapshot-sites.png",
  "site-dash": "snapshot-site-dash.png",
  agent: "snapshot-agent.png",
  "agent-main": "snapshot-agent-main.png",
  reports: "snapshot-reports.png",
  perf: "snapshot-perf.png",
  security: "snapshot-security.png",
  seo: "snapshot-seo.png",
  billing: "snapshot-billing.png",
  settings: "snapshot-gen-settings.png",
  backup: "snapshot-backup.png",
  plugin: "snapshot-plugin.png",
};

fs.mkdirSync(OUT, { recursive: true });

const aspects = {};

for (const [id, file] of Object.entries(FILES)) {
  const input = path.join(SRC, file);
  const output = path.join(OUT, `${id}.png`);
  if (!fs.existsSync(input)) {
    console.warn(`skip missing ${file}`);
    continue;
  }

  const meta = await sharp(input).metadata();
  const w = meta.width ?? MAX_W;
  const h = meta.height ?? MAX_W;
  const sourceAspect = w / h;

  let pipeline = sharp(input);
  let outW;
  let outH;

  if (sourceAspect < 1.2) {
    // Tall shots: top full-width slice into 16:10
    const sliceH = Math.min(h, Math.round(w / TARGET_ASPECT));
    outW = MAX_W;
    outH = Math.round(MAX_W / TARGET_ASPECT);
    pipeline = pipeline
      .extract({ left: 0, top: 0, width: w, height: sliceH })
      .resize(outW, outH, { fit: "fill" });
  } else {
    // Landscape: keep native aspect (no letterbox when CSS uses snap.aspect)
    outW = Math.min(MAX_W, w);
    outH = Math.round(outW / sourceAspect);
    pipeline = pipeline.resize(outW, outH, { fit: "inside" });
  }

  await pipeline.png({ compressionLevel: 8 }).toFile(output);
  const v = crypto
    .createHash("md5")
    .update(fs.readFileSync(output))
    .digest("hex")
    .slice(0, 10);
  aspects[id] = { w: outW, h: outH, aspect: `${outW} / ${outH}`, v };
  console.log(`✓ ${id} → ${outW}×${outH} v=${v}`);
}

fs.writeFileSync(META_OUT, JSON.stringify(aspects, null, 2));
console.log("Wrote", META_OUT);
console.log("Done.");
