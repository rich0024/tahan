# Scene paintings — how they were made

The nine backdrops in `assets/scenes/` were generated on Higgsfield with
**FLUX 3 Image**, 2:1, 2K (2896 × 1440), then resized to 1440 × 716 WebP
(quality 88). Night was made first from the prompt below; the owner picked one
of four, and it was passed as the style reference (`image_references`) for
the other eight. Each scene keeps the drawn version's content — sun, landmarks
and colour family — so its palette still matches.

`src/paint/scenes/art.ts` holds each painting's ground colour, the median of
its bottom 3% of rows. Re-measure it if a painting is replaced.

Nothing that moves is painted in (no petals, snow or rain): the drift draws
those on top.

## Night (the style source)

```
STYLE
Premium storybook illustration for a calm family app. Layered flat shapes with soft
painterly gouache texture and fine paper grain, gentle atmospheric perspective, smoothly
blended gradients, no outlines. Quiet, warm, homely mood. Simple uncluttered forms that
stay readable when small. Not photorealistic, not a 3D render, no lens flare.

COMPOSITION
Wide landscape seen from a window, without the window frame. Horizon sits about 58% down
from the top. The upper 45% is open sky with nothing large in the top-left or top-right
corners. The bottom 15% is one even, unbroken band of foreground ground in a single flat
colour, edge to edge, with no objects or detail in it. No people, no animals, no birds,
no text.

SCENE — NIGHT
Late dusk in the mountains. Background: one tall peak centred in frame, soft grey-brown,
with a bright cream snow cap; lower grey ridges to its left and right. Midground: a dark
jagged pine treeline across the full width. Lower centre: a small still lake holding a
warm orange reflection. Foreground band: very dark warm charcoal. Sky: deep warm charcoal
at the top, smoky taupe through the middle, burnt-orange glow along the horizon, about
eight small soft stars in the upper sky.

LIGHTING
The only light is the afterglow behind the mountains at the horizon. Mountain faces and
trees are in soft shadow with a thin warm rim along the ridgelines. No front light.
Palette: charcoal, taupe, cream, burnt orange, terracotta.
```

## The other eight

Each starts with this, with Night as the reference image:

```
STYLE
Match the reference image's style exactly — its brushwork, paper grain, flat layered
shapes, soft gradients and level of detail. Take only the style from it, not its
mountain, lake or colours. Premium storybook illustration for a calm family app.
Not photorealistic, not a 3D render, no outlines, no lens flare.

COMPOSITION
(as for Night)
```

then one of:

- **Forest** — Soft overcast morning. Sky: pale sage at the top fading to pale mint near the horizon; a pale cream sun disc upper right, half veiled. Two layers of soft sage hills; a thin band of pale mist between them. Midground: six tall dark pines spread across the width, varied heights. Foreground band: deep forest green, almost black. Light: diffuse, from upper right; trees are soft silhouettes. Palette: sage, moss, olive, deep green, cream.
- **Tropical** — Warm late afternoon by the sea. Sky: peach at the top fading to pale blush. A large soft coral sun right of centre. Midground: a teal sea band across the full width with a few thin pale foam lines. A gentle pale sand shore below it. One tall leaning palm on the left, one smaller palm on the right, dark olive. Foreground band: pale peach sand. Light: low warm sun from the right, soft rim on the palm fronds.
- **Desert** — Golden hour. Sky: amber at the top fading to pale gold at the horizon; a low burnt-orange sun upper left; two faint stars high up. Background: two flat-topped mesas in soft clay brown. Three rolling dune layers in ochre, apricot and sand, curving across the width. One small bare desert tree on the right. Foreground band: pale sand. Light: low sun from the left, long soft shading on the dunes.
- **Rice terraces** — Calm misty morning. Sky: pale sage-blue fading to cream; a soft pale-gold sun upper right. Background: two layers of blue-grey mountains. Midground: curved, stepped rice terraces in fresh greens, each edge holding a thin pale water reflection. Two small dark pines on the right ridge. Foreground band: deep moss green. Light: soft from upper right, gentle haze between the layers.
- **Savanna** — Sunset. Sky: golden amber at the top deepening to warm orange at the horizon. A large soft golden sun sitting just above the horizon, centre-left. A flat dry plain across the width. Silhouetted flat-topped acacia trees in dark brown: a large one on the left, a smaller one on the right; a few small low bushes along the horizon. Foreground band: warm earth brown. Light: backlit by the setting sun; trees are clean silhouettes.
- **Coast** — Bright, calm midday. Sky: pale sky blue at the top fading to soft cream; a soft yellow sun upper left. Midground: a blue-grey sea band with a few pale light streaks. On the right, a low tan headland with two small white cottages with terracotta roofs. A pale sand beach; one small white boat pulled up on the sand, lower centre-left. Foreground band: warm sand. Light: soft high sun from upper left.
- **Winter** — Still winter afternoon. Sky: pale blue-grey fading to near white; a pale peach low sun on the right; three faint stars high up. Background: soft snowy hills in white and pale blue-grey. Midground: five dark slate-blue pines with snow resting on their tops, varied heights. Foreground band: clean snow white with a hint of blue. Light: low and soft from the right, cool shadows.
- **Blossom** — Gentle spring morning. Sky: blush pink at the top fading to warm cream; a pale pink sun disc upper right. Two layers of soft green rolling hills. On the left a large cherry tree with a full pink canopy and a curved dark trunk; on the right a smaller cherry tree. No falling petals in the air. Foreground band: soft sage green. Light: soft from upper right, warm highlights on the blossom.
