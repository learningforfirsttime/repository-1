/**
 * Filter definitions, mounted once in the layout.
 *
 *  · ink-bleed — the faint spread of ink into paper fibre, used on the
 *    display heading of a letter's page.
 *  · torn-edge — roughens the border of a sheet that should feel pressed
 *    or deckled rather than cut.
 *
 * Both are pure SVG filter primitives: turbulence displacing the source.
 */
export default function InkFilters() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
      style={{ position: "absolute", pointerEvents: "none" }}
    >
      <defs>
        <filter id="ink-bleed" x="-6%" y="-14%" width="112%" height="128%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.019 0.032"
            numOctaves={2}
            seed={7}
            result="fibre"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="fibre"
            scale={2.1}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        <filter id="torn-edge" x="-4%" y="-8%" width="108%" height="116%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.031"
            numOctaves={3}
            seed={19}
            result="rough"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="rough"
            scale={4.4}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
