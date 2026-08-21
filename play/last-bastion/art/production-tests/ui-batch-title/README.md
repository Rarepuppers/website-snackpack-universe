# Title/menu backdrop v1

This batch supplies the dedicated text-free 16:9 title backdrop. The runtime keeps the existing
960×540 logical scene, presents it at exact 2× Full HD and 4× 4K scale, and renders the title,
prompt, and footer in code. `?titlebackdrop=legacy` temporarily restores the earlier 3:2 Bastion
map plate for review comparisons.

## Files

- `title-menu-backdrop-v1-3840x2160.png` — retained 4K review/master image.
- `title-menu-backdrop-v1-3840x2160.webp` — optimized runtime derivative (WebP quality 88).

The built-in image-generation workflow produced a 1672×941 source, which was fitted to exact
3840×2160 with high-quality Lanczos resampling. The original generated file remains in the Codex
generated-image store; the repository retains the production master and runtime derivative only.

## Prompt contract

Create a polished painterly-realistic, text-free Last Bastion command chamber and defensive
airlock in dark navy/charcoal with restrained cyan and amber practical lighting. Use a symmetric
16:9 composition, keep the central 50% calm and low contrast for the code-rendered title, place
detail around the frame, and subdue the bottom 15% for footer controls. No characters, creatures,
weapons, explosions, text, logos, UI, watermarks, franchise imagery, or gore.
