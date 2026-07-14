/**
 * Sidebar active state: prefer the longest matching nav href so nested routes
 * (e.g. /attendance/mark) don't also highlight the parent (/attendance).
 */
export function resolveActiveNavHref(
  pathname: string | null | undefined,
  hrefs: string[],
  rootHrefs: string[] = ["/app", "/app/bob"],
): string | null {
  if (!pathname) return null;
  const roots = new Set(rootHrefs);
  const matches = hrefs.filter((href) => {
    if (pathname === href) return true;
    if (roots.has(href)) return false;
    return pathname.startsWith(`${href}/`) || pathname.startsWith(`${href}?`);
  });
  if (!matches.length) return null;
  return matches.reduce((best, href) =>
    href.length > best.length ? href : best,
  );
}

export function isNavHrefActive(
  pathname: string | null | undefined,
  href: string,
  allHrefs: string[],
  rootHrefs?: string[],
): boolean {
  return resolveActiveNavHref(pathname, allHrefs, rootHrefs) === href;
}
