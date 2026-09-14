# The doll's three frames

    greeting.webp   upright, meeting the visitor's eyes
    bow-mid.webp    head lowered, eyes softening
    bow-full.webp   head down, eyes closed

Served at /doll/*.webp and crossfaded on scroll by
components/effects/DollFrames.tsx. All three share one canvas and keep her
boots on a common line; only the pose changes between them.

The active set is the pixel-art artwork. Sources live outside public/ so
they are never deployed:

    art/doll-pixel/         the active set, as delivered
    art/doll-illustration/  the earlier smooth illustration, png + webp

Both sets arrived without usable transparency -- the illustration had its
checkerboard painted in as opaque pixels, the pixel set had no alpha
channel at all -- so each was cut programmatically and re-encoded to WebP.
The pixel frames also arrived on three different canvas sizes and were
re-composited onto a shared one, aligned by the centre of her boots.

To switch sets, copy the chosen .webp files into public/doll/ and rebuild.
If all three are missing the hero falls back to the vector doll in
components/effects/Doll.tsx and nothing breaks.
