/** Absolute canonical URL for a route: site origin + path, always with a leading and trailing slash. */
export function canonicalUrl(siteUrl: string, routePath: string): string {
  const origin = siteUrl.replace(/\/+$/, "");
  const trimmed = routePath.replace(/^\/+|\/+$/g, "");
  return trimmed ? `${origin}/${trimmed}/` : `${origin}/`;
}

/** Next `metadata.alternates` value carrying the canonical URL of a route. */
export function canonicalAlternates(siteUrl: string, routePath: string) {
  return { canonical: canonicalUrl(siteUrl, routePath) };
}
