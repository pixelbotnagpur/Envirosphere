/** Previous and next entry around `slug` in an already ordered list; no wrap-around. */
export function serviceNeighbours<T extends { slug: string }>(
  ordered: readonly T[],
  slug: string,
): { previous: T | undefined; next: T | undefined } {
  const index = ordered.findIndex((item) => item.slug === slug);
  if (index === -1) return { previous: undefined, next: undefined };
  return { previous: ordered[index - 1], next: ordered[index + 1] };
}
