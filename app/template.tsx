/**
 * Every route arrives the same way: a short rise, on the house ease.
 * template.tsx remounts on navigation, so the animation replays each time.
 */
export default function Template({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="route-enter flex flex-1 flex-col">{children}</div>;
}
