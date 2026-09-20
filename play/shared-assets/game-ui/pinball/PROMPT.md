# Galley playfield generation record

Built-in image generation was used with these references:

- `shared-assets/captain-beakon.png` — Captain Beakon identity.
- `website-snackpack-universe/play/tiles/solitaire.png` — SnackPack arcade
  materials, rounded forms and palette.
- `website-snackpack-universe/play/sprites/arcade/asteroid-destroyer-bg.png` —
  navy starfield palette.

## Generation prompt

Create one opaque, full-bleed, orthographic top-down decorative background for
a 500:1040 portrait pinball table. Show a cozy starship galley through dark
navy enamel, warm timber panels, restrained brass fittings, small portholes,
provision crates, fruit and kitchen utensils around the perimeter. Include a
small low-contrast Captain Beakon emblem in the upper-left periphery, matching
the supplied identity reference. Keep the central 70% calm and open. Reserve a
narrow right-edge shooter-lane surface and quiet bottom apron without drawing
their boundaries. Use polished 2D gouache/digital SnackPack styling with cream,
amber, teal and coral accents.

The image is below live procedural geometry. Do not paint rails, lane guides,
ramp paths or boundaries, holes, saucers, lamp inserts, bumpers, posts,
targets, spinner, gates, ball, flippers, score display, touch controls, arrows,
UI, glowing gameplay cues, readable text, numbers, logos or watermarks. Avoid
casino imagery, photorealism, neon overload, perspective and a busy center.

## Targeted edit

Remove the generated purple-and-amber ringed planet and all five thin curved
comet/orbit streaks from the navy playing area. Fill only those shapes with the
same quiet navy starfield, preserving the cabinet, galley props, Captain Beakon
emblem, shooter-lane decoration and apron.

## Normalization

The accepted 870 × 1808 output was center-cropped by one pixel to 869 × 1808,
then resampled to the exact 2000 × 4160 master. The 1x, 2x and 3x PNG tiers
were derived from that master with Lanczos resampling and a 192-colour palette. WebP
tiers were encoded at quality 82. No consumer file was used as a source.
