// Trusted hosts for https logo URLs embedded in outbound email HTML. Defaults
// cover the CDNs we host logos on today; override in deployment via the
// TRUSTED_LOGO_HOSTS env var (comma-separated hostnames, case-insensitive).
// Each entry must be a bare hostname — no scheme, port, or path.
const DEFAULT_TRUSTED_LOGO_HOSTS = ['res.cloudinary.com'];

// Simple hostname shape — labels of alphanumerics/hyphens joined by dots. Not
// a perfect RFC 1123 match, but rejects URLs, paths, ports, and garbage.
const HOSTNAME_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/;

const envValue = process.env.TRUSTED_LOGO_HOSTS;
const source = envValue !== undefined ? envValue.split(',') : DEFAULT_TRUSTED_LOGO_HOSTS;

const parsed = [];
const dropped = [];
for (const raw of source) {
  if (typeof raw !== 'string') continue;
  const token = raw.trim().toLowerCase();
  if (!token) continue;
  if (token.includes('://') || token.includes('/') || token.includes(':')) {
    dropped.push(raw);
    continue;
  }
  if (!HOSTNAME_RE.test(token)) {
    dropped.push(raw);
    continue;
  }
  try {
    const { hostname } = new URL(`http://${token}`);
    if (hostname === token) {
      parsed.push(hostname);
    } else {
      dropped.push(raw);
    }
  } catch {
    dropped.push(raw);
  }
}

if (dropped.length > 0) {
  console.warn(
    `[trustedLogoHosts] Dropped ${dropped.length} invalid TRUSTED_LOGO_HOSTS entr${dropped.length === 1 ? 'y' : 'ies'}: ${dropped.map((d) => JSON.stringify(d)).join(', ')}. Each entry must be a bare hostname (no scheme, port, or path).`
  );
}

if (envValue !== undefined && parsed.length === 0) {
  console.warn(
    '[trustedLogoHosts] TRUSTED_LOGO_HOSTS is set but resolves to no valid hostnames; remote logo URLs will be rejected.'
  );
}

export const TRUSTED_LOGO_HOSTS = new Set(parsed);
