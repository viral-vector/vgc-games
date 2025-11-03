# Art Pipeline

This guide outlines the tooling, prompts, licensing guardrails, and asset delivery standards for creating art assets for the VGC games portfolio. It also covers the automation provided in `scripts/process-art.js` and how to feed generated sprites into our Phaser-based projects.

## Preferred AI Art Tools & Prompting Guidelines

We currently recommend the following AI art generation services:

- **Midjourney** – Best-in-class for stylized key art, concept boards, and illustrative UI elements. Use the `--ar` parameter to lock aspect ratios to the target resolution.
- **Stable Diffusion XL (SDXL)** via **Automatic1111** or **ComfyUI** – Excellent for iterative sprites and environmental tilesets. We encourage the `ControlNet` extensions for pose consistency.
- **Adobe Firefly** – A safer option when legal approval is required for commercial campaigns. The Adobe Stock training set provides reliable IP provenance.

Prompting best practices:

1. **Lead with franchise-defining descriptors.** Include art direction keywords such as lighting, palette, and rendering style. Example: `"retro sci-fi hero portrait, cel shaded, teal/purple rim lighting"`.
2. **Constrain composition early.** Supply aspect ratios, shot framing (`"medium shot"`, `"isometric"`), and camera language to minimize post edits.
3. **List negative prompts for unusable traits.** e.g., `"-blurry, -extra limbs, -text, -watermark"`.
4. **Iterate with seed locking once a baseline is approved** to guarantee reproducibility.

## Licensing & Compliance Considerations

- **Usage rights:** Document the license exported from each tool. Midjourney and Adobe Firefly allow commercial use with paid plans; SDXL outputs must cite model checkpoints and training sources.
- **Attribution tracking:** Store prompt, seed, model, and upscaler details in `/docs/art-prompts/` (private repo) for audit trails. Every published asset must reference this metadata.
- **3rd-party inputs:** Only feed in photos or textures we own or that are explicitly licensed (CC0 or paid libraries). Keep receipts in the project’s `legal/` folder.
- **Derivative works:** When mixing user-uploaded references, ensure contributors have signed IP assignments or contributor license agreements (CLAs).

## Asset Specification Guidelines

| Asset Type              | Target Resolution                     | Notes |
|-------------------------|---------------------------------------|-------|
| Character Portraits     | 1024×1024 PNG (source), 512×512 WebP  | Maintain transparent backgrounds. |
| In-Game Sprites         | Base unit 128×128. Atlas trimmed and padded to 2× scale for HiDPI. |
| Tilesets                | 64×64 per tile, exported as spritesheets divisible by 8. |
| UI Icons                | 256×256 source, deliver 128×128 and 64×64 derivatives. |
| Splash/Key Art          | 3840×2160 (16:9) layered PSD, plus 1920×1080 flattened PNG. |

### Naming Conventions

- Use lowercase kebab-case for files (e.g., `robot-hero-idle.png`).
- Append animation state and direction if applicable: `robot-hero-run-north.png`.
- Spritesheets use the pattern `<collection>-atlas.json` for the metadata and `<collection>-atlas.png` for the texture.

### Folder Structure

```
art/
  prompts/          # Prompt + seed logs (private)
  concepts/         # Midjourney boards & reference comps
  sprites/          # Individual character frames
  atlases/          # TexturePacker/Phaser atlas outputs
  ui/               # HUD & interface elements
```

## Automated Processing (`scripts/process-art.js`)

We provide a Node.js helper script to standardize upscaling and format conversion:

```bash
pnpm install
pnpm process-art -- --input art/sprites --output art/atlases --scale 2 --format webp --suffix "@2x"
```

Key capabilities:

- Upscale via uniform scale factors or target max dimensions.
- Convert formats (`png`, `webp`, `jpeg`, `avif`) while adjusting quality.
- Strip or preserve metadata and optionally flatten alpha layers.
- Batch process individual files or directory trees.

## TexturePacker & Phaser Integration

1. **Prepare sources:** Ensure sprite frames are exported at consistent base resolutions (see table above). Name each frame according to animation + direction.
2. **Pack atlases:** Use TexturePacker (`.tps`) or the `scripts/process-art.js --atlas` option (future feature) to generate multi-resolution atlases. Recommended TexturePacker settings:
   - Algorithm: `MaxRects` (Best).
   - Trim mode: `Trim` with a 2px border padding.
   - Output: JSON (Array) to match Phaser’s texture atlas loader.
3. **Version outputs:** Commit both the `.json` and `.png/.webp` files alongside the TexturePacker project file for reproducibility.
4. **Load in Phaser:**

```ts
this.load.atlas('robot-hero', 'assets/atlases/robot-hero-atlas.png', 'assets/atlases/robot-hero-atlas.json');
```

5. **Define animations:**

```ts
this.anims.create({
  key: 'robot-hero-run',
  frames: this.anims.generateFrameNames('robot-hero', {
    prefix: 'robot-hero-run-',
    start: 1,
    end: 6,
    zeroPad: 2
  }),
  frameRate: 12,
  repeat: -1
});
```

6. **Hitbox alignment:** Store pivot (`originX`, `originY`) data in the atlas JSON’s `meta` section or a companion `.meta.json` file to keep collision boxes in sync across variants.

## Checklist Before Shipping Art

- [ ] Prompts, seeds, and model info archived in `art/prompts/`.
- [ ] Licensing cleared for all references and AI models used.
- [ ] Assets exported at required resolutions and naming standards.
- [ ] Texture atlases validated in Phaser test scene for animation timing and alignment.
- [ ] `scripts/process-art.js` run to produce alternate densities or formats.

