# The doll's three frames

Drop the artwork here, with these exact filenames:

    greeting.png   upright, meeting the visitor's eyes
    bow-mid.png    head beginning to lower, eyes softening
    bow-full.png   head down, eyes closed

Requirements:
  · transparent background (PNG)
  · the same canvas size for all three
  · her feet in the same position in every frame — only the pose changes

Next serves this directory from the site root, so `public/doll/greeting.png`
is reachable at `/doll/greeting.png`.

Until all three are present, the hero falls back to the vector doll in
`components/effects/Doll.tsx`. Nothing breaks while they are missing.
