#!/usr/bin/env node

'use strict';

const fs = require('fs/promises');
const path = require('path');
const { Command } = require('commander');
const sharp = require('sharp');

const program = new Command();

program
  .description('Batch upscale and convert art assets')
  .requiredOption('-i, --input <path>', 'Input file or directory')
  .requiredOption('-o, --output <path>', 'Output directory')
  .option('-f, --format <format>', 'Output format (png, webp, jpeg, avif)', 'png')
  .option('-s, --scale <number>', 'Scale factor for resizing (e.g., 2 for 200%)', parseFloat)
  .option('--max-width <number>', 'Maximum width in pixels', parseInt)
  .option('--max-height <number>', 'Maximum height in pixels', parseInt)
  .option('--quality <number>', 'Output quality for lossy formats', parseInt)
  .option('--suffix <text>', 'Suffix appended to output file names before the extension', '')
  .option('--preserve-metadata', 'Retain EXIF and other metadata in the output')
  .option('--flatten', 'Flatten onto a transparent background to remove stray alpha halos')
  .option('--overwrite', 'Overwrite existing files instead of skipping')
  .parse(process.argv);

const options = program.opts();

const supportedFormats = new Set(['png', 'webp', 'jpeg', 'jpg', 'avif']);
const inputPath = path.resolve(options.input);
const outputRoot = path.resolve(options.output);
const format = options.format.toLowerCase();

if (!supportedFormats.has(format)) {
  console.error(`Unsupported format: ${format}`);
  process.exit(1);
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function collectFiles(target) {
  const stats = await fs.stat(target);
  if (stats.isDirectory()) {
    const entries = await fs.readdir(target);
    const results = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(target, entry);
        const childStats = await fs.stat(fullPath);
        if (childStats.isDirectory()) {
          return collectFiles(fullPath);
        }
        if (/\.(png|jpe?g|webp|avif)$/i.test(entry)) {
          return fullPath;
        }
        return [];
      })
    );
    return results.flat();
  }
  return [target];
}

function getOutputPath(filePath) {
  const relative = path.relative(inputPath, filePath);
  const { dir, name } = path.parse(relative);
  const safeDir = dir === '' || dir === '.' ? '' : dir;
  const outputDir = path.join(outputRoot, safeDir);
  const suffix = options.suffix || '';
  const extension = format === 'jpg' ? 'jpeg' : format;
  const fileName = `${name}${suffix}.${extension}`;
  return { outputDir, outputFile: path.join(outputDir, fileName) };
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function applyResize(image, metadata, filePath) {
  if (!options.scale && !options.maxWidth && !options.maxHeight) {
    return image;
  }

  const resizeConfig = {};

  if (options.scale) {
    if (metadata.width) {
      resizeConfig.width = Math.max(1, Math.round(metadata.width * options.scale));
    } else {
      console.warn(`Missing width metadata for ${filePath}; skipping width scaling.`);
    }
    if (metadata.height) {
      resizeConfig.height = Math.max(1, Math.round(metadata.height * options.scale));
    }
  }

  if (options.maxWidth) {
    resizeConfig.width = resizeConfig.width
      ? Math.min(resizeConfig.width, options.maxWidth)
      : options.maxWidth;
  }

  if (options.maxHeight) {
    resizeConfig.height = resizeConfig.height
      ? Math.min(resizeConfig.height, options.maxHeight)
      : options.maxHeight;
  }

  return Object.keys(resizeConfig).length > 0 ? image.resize(resizeConfig) : image;
}

function applyFormat(image) {
  const quality = options.quality || (format === 'jpeg' || format === 'jpg' ? 90 : undefined);
  switch (format) {
    case 'png':
      return image.png({ compressionLevel: 9 });
    case 'webp':
      return image.webp({ quality: quality ?? 90, lossless: quality === undefined });
    case 'jpeg':
    case 'jpg':
      return image.jpeg({ quality: quality ?? 90, mozjpeg: true });
    case 'avif':
      return image.avif({ quality: quality ?? 45 });
    default:
      return image;
  }
}

async function processFile(filePath) {
  try {
    const { outputDir, outputFile } = getOutputPath(filePath);
    if (!options.overwrite && (await pathExists(outputFile))) {
      console.log(`Skipping existing file: ${outputFile}`);
      return;
    }

    await ensureDir(outputDir);

    let pipeline = sharp(filePath, { failOn: 'warning' });
    const metadata = await pipeline.metadata();

    pipeline = await applyResize(pipeline, metadata, filePath);

    if (options.flatten) {
      pipeline = pipeline.flatten({ background: { r: 0, g: 0, b: 0, alpha: 0 } });
    }

    if (options.preserveMetadata) {
      pipeline = pipeline.withMetadata();
    }

    pipeline = applyFormat(pipeline);

    await pipeline.toFile(outputFile);
    console.log(`Processed: ${filePath} -> ${outputFile}`);
  } catch (error) {
    console.error(`Failed processing ${filePath}:`, error.message);
  }
}

async function main() {
  if (!(await pathExists(inputPath))) {
    console.error(`Input path does not exist: ${inputPath}`);
    process.exit(1);
  }

  await ensureDir(outputRoot);
  const files = await collectFiles(inputPath);

  if (files.length === 0) {
    console.warn('No matching image files found.');
    return;
  }

  for (const file of files) {
    await processFile(file);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

