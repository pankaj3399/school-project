// Trusted hosts for https logo URLs embedded in outbound email HTML. Defaults
// cover the CDNs we host logos on today; override in deployment via the
// TRUSTED_LOGO_HOSTS env var (comma-separated hostnames, case-insensitive).
// Empty / whitespace-only entries are dropped.
const DEFAULT_TRUSTED_LOGO_HOSTS = ['res.cloudinary.com'];

export const TRUSTED_LOGO_HOSTS = new Set(
  (process.env.TRUSTED_LOGO_HOSTS
    ? process.env.TRUSTED_LOGO_HOSTS.split(',')
    : DEFAULT_TRUSTED_LOGO_HOSTS
  )
    .map((h) => (typeof h === 'string' ? h.trim().toLowerCase() : ''))
    .filter((h) => h.length > 0)
);
