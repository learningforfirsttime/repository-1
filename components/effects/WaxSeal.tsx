"use client";

/**
 * A seal of dark wax, pressed with the atelier's mark.
 *
 * The edge is deliberately irregular — wax does not pour in circles. Used on
 * the client vignettes, and pressed live when a request is copied.
 */

type Props = {
  size?: number;
  color?: string;
  /** adds the press animation when it flips true */
  pressed?: boolean;
  className?: string;
  title?: string;
};

export default function WaxSeal({
  size = 56,
  color = "#9B3A44",
  pressed = false,
  className = "",
  title,
}: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`${pressed ? "seal-press" : ""} ${className}`}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <radialGradient id={`wax-body-${color.slice(1)}`} cx="0.36" cy="0.3" r="0.78">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.34" />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.42" />
        </radialGradient>
      </defs>

      {/* the poured blob: an irregular rim */}
      <path
        d="M 50 6
           C 64 6, 72 13, 79 19
           C 88 26, 95 33, 94 47
           C 93 60, 96 69, 87 78
           C 78 88, 66 93, 52 94
           C 38 95, 27 92, 18 84
           C 8 75, 5 63, 6 49
           C 7 35, 12 25, 22 17
           C 30 10, 38 6, 50 6 Z"
        fill={color}
      />
      <path
        d="M 50 6
           C 64 6, 72 13, 79 19
           C 88 26, 95 33, 94 47
           C 93 60, 96 69, 87 78
           C 78 88, 66 93, 52 94
           C 38 95, 27 92, 18 84
           C 8 75, 5 63, 6 49
           C 7 35, 12 25, 22 17
           C 30 10, 38 6, 50 6 Z"
        fill={`url(#wax-body-${color.slice(1)})`}
      />

      {/* the pressed ring */}
      <circle
        cx="50"
        cy="50"
        r="33"
        fill="none"
        stroke="#000000"
        strokeOpacity="0.3"
        strokeWidth="1.6"
      />
      <circle
        cx="50"
        cy="50"
        r="33"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.2"
        strokeWidth="1"
        transform="translate(0,-1.4)"
      />

      {/* the mark: a nib, struck into the wax */}
      <g transform="translate(50,50)">
        <path
          d="M 0 -19 L 8.5 6 L 0 13 L -8.5 6 Z"
          fill="#000000"
          fillOpacity="0.34"
          transform="translate(0,1.4)"
        />
        <path
          d="M 0 -19 L 8.5 6 L 0 13 L -8.5 6 Z"
          fill="#ffffff"
          fillOpacity="0.2"
        />
        <line
          x1="0"
          y1="-9"
          x2="0"
          y2="9"
          stroke="#000000"
          strokeOpacity="0.38"
          strokeWidth="1.5"
        />
        <circle cx="0" cy="1.5" r="2.6" fill="#000000" fillOpacity="0.34" />
      </g>
    </svg>
  );
}
