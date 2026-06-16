// URL helpers for migrating WordPress content to a static, self-hosted layout.
// Live uploads are served from https://reality-science.com/wp/wp-content/uploads/.
// We vendor them locally under /wp-content/uploads/ (path preserved).

export const SITE = 'reality-science.com';
export const LIVE_UPLOADS_BASE = `https://${SITE}/wp/wp-content/uploads/`;

// Rewrite all upload + internal-link URLs inside a chunk of post HTML to local paths.
export function rewriteContentUrls(html) {
  let out = html;
  // uploads: with or without /wp/, absolute or root-relative -> /wp-content/uploads/
  out = out.replace(/(?:https?:\/\/reality-science\.com)?\/wp\/wp-content\/uploads\//g, '/wp-content/uploads/');
  out = out.replace(/https?:\/\/reality-science\.com\/wp-content\/uploads\//g, '/wp-content/uploads/');
  // internal page links: strip the domain so they resolve on the static site
  out = out.replace(/https?:\/\/reality-science\.com\//g, '/');
  // tidy any leftover /wp/ doubled paths
  out = out.replace(/\/wp\/wp-content\//g, '/wp-content/');
  return out;
}

// Extract the set of upload relative paths (YYYY/MM/filename) referenced in text.
export function extractUploadPaths(text) {
  const paths = new Set();
  const re = /uploads\/(\d{4}\/\d{2}\/[^"'\s)>\]\\?]+)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    let p = m[1];
    // strip trailing punctuation that may have been captured
    p = p.replace(/[.,;]+$/, '');
    paths.add(p);
  }
  return paths;
}

// Decode a percent-encoded WP slug for display/filename safety, falling back to raw.
export function safeFilename(slug, wpId) {
  if (/^[A-Za-z0-9_-]+$/.test(slug)) return slug;
  try {
    const dec = decodeURIComponent(slug);
    if (/^[A-Za-z0-9_-]+$/.test(dec)) return dec;
  } catch { /* ignore */ }
  return `post-${wpId}`;
}
