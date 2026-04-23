// Trusted hosts for https logo URLs embedded in outbound email HTML. Defaults
// cover the CDNs we host logos on today; override in deployment via the
// TRUSTED_LOGO_HOSTS env var (comma-separated hostnames, case-insensitive).
// Empty / whitespace-only entries are dropped.
const DEFAULT_TRUSTED_LOGO_HOSTS = ['res.cloudinary.com'];

const envValue = process.env.TRUSTED_LOGO_HOSTS;
const source = envValue !== undefined ? envValue.split(',') : DEFAULT_TRUSTED_LOGO_HOSTS;
const parsed = source
  .map((h) => (typeof h === 'string' ? h.trim().toLowerCase() : ''))
  .filter((h) => h.length > 0);

if (envValue !== undefined && parsed.length === 0) {
  console.warn(
    '[trustedLogoHosts] TRUSTED_LOGO_HOSTS is set but resolves to no valid hostnames; remote logo URLs will be rejected.'
  );
}

export const TRUSTED_LOGO_HOSTS = new Set(parsed);
