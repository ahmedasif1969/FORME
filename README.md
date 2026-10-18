# FORME Developments

A fictional luxury architecture portfolio built with React, TypeScript, Vite, Tailwind CSS, GSAP ScrollTrigger and Lenis.

## Run

```sh
npm install
npm run dev
npm run build
npm run preview
```

## Hero sequence

The supplied 10-second, 24 fps video is the source for all 240 consecutive WebP frames. No video element or MP4 seeking is used at runtime. See `src/HeroSequence.tsx`.

- Desktop: 1440 x 810, WebP quality 78, scaled from the 1920 x 1080 source to reduce transfer and decode time.
- Phone: 608 x 1080, WebP quality 80, 9.3 MB total. Crop x=400 preserves the residence without resizing source pixels.
- Canvas pixel density capped at 1.5. Device sets are selected once per visit; resizing repaints the selected set without fetching the other set.
- Four concurrent fetches; three concurrent desktop decodes or two phone decodes; eight frames of directional lookahead.
- Compressed cache budget: 150 MiB desktop, 70 MiB phone. Both full sequences fit. Decoded images outside the nearby window are released.
- Frame zero loads and paints immediately. Poster remains underneath. Consecutive frames play in either direction. Display speed adapts from 24 up to 60 frames per second as scroll speed increases, so fast scrolling catches up sooner without skipping frames. The full sequence spans 1.5 viewports (at least 900 px), down from 2.5 viewports or a 240-frame distance floor.
- All fetch/decode scheduling pauses while the document is hidden. Briefly leaving the hero does not cancel preloading.
- Reduced motion, data saver, unsupported canvas and loading failures retain the still image. No alternative video fallback.
- Hero typography and its playback percentage follow the displayed frame.
- Three reversible headline chapters unfold with actual displayed video frames: considered living, landscape, and belonging. Line masks, captions and chapter progress share the same playback timeline.
- Downstream ScrollTriggers refresh after the asynchronous hero pin is installed, so their measured positions include the hero's scroll distance.

## Scroll storytelling

`src/scrollStory.ts` coordinates a desktop philosophy pin with progressive word highlighting, a traveling residence title, opposing material parallax, project-image reveals and the closing form entrance. On phones the philosophy text reveals without pinning. Reduced-motion visits keep the content static and readable.

To regenerate the sequence:

```sh
node scripts/prepare-video.mjs "PATH_TO_ORIGINAL_VIDEO.mp4"
```

The included frame sets are already prepared. The original MP4 is not needed to run or build the site. Still architecture images are derived from the provided footage. The supporting interior and stone image are AI-generated illustrative concept imagery. All properties are fictional.

## Interaction and accessibility

Navigation uses section anchors, with Lenis smooth scrolling when motion is enabled. Each project opens a native modal dialog with keyboard focus containment and Escape support. The contact form uses required fields, email validation, a minimum message length and an accessible status message. It does not send or store inquiries; the displayed feedback states this clearly.

The reference's oversized, three-line headline, small navigation, grid lines and sharp black residence panel deliberately take precedence over generic design-skill defaults.
