/**
 * Emblem — a fountain-pen nib in a ring, hand-coded SVG.
 * The mark of the house.
 */
export default function Emblem({
  size = 40,
  className = "",
  draw = false,
}: {
  size?: number;
  className?: string;
  draw?: boolean;
}) {
  const d = draw ? "draw-path" : "";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle
        cx="24"
        cy="24"
        r="21.5"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.55"
        pathLength={100}
        className={d}
        style={{ "--path-len": 100, "--draw-dur": "1.6s" } as never}
      />
      {/* the nib */}
      <path
        d="M24 9.5 C29 15.5, 31.5 21, 31.5 26 C31.5 31 28.5 35 24 37.5 C19.5 35, 16.5 31, 16.5 26 C16.5 21, 19 15.5, 24 9.5 Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        pathLength={100}
        className={d}
        style={{ "--path-len": 100, "--draw-dur": "1.8s", "--draw-delay": "0.3s" } as never}
      />
      {/* slit and vent */}
      <path
        d="M24 20.5 L24 33.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        pathLength={100}
        className={d}
        style={{ "--path-len": 100, "--draw-dur": "0.9s", "--draw-delay": "1.2s" } as never}
      />
      <circle
        cx="24"
        cy="19"
        r="1.7"
        stroke="currentColor"
        strokeWidth="1.2"
        pathLength={100}
        className={d}
        style={{ "--path-len": 100, "--draw-dur": "0.7s", "--draw-delay": "1.5s" } as never}
      />
      {/* two attending stars */}
      <path
        d="M10.5 13.5 l1.1 0 l0.35 -1.05 l0.35 1.05 l1.1 0 l-0.9 0.66 l0.35 1.06 l-0.9 -0.66 l-0.9 0.66 l0.35 -1.06 Z"
        fill="currentColor"
        opacity="0.7"
        transform="scale(0.9) translate(1,1)"
      />
      <circle cx="37.5" cy="35" r="0.9" fill="currentColor" opacity="0.6" />
    </svg>
  );
}
