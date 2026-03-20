/**
 * Best-effort anonymization of IPv4 and IPv6 addresses.
 * For IPv4: replaces the last octet with '0'.
 * For IPv6: replaces the last hextet with '0000'.
 * @param {string} ip - The raw IP address string.
 * @returns {string} - The anonymized IP address.
 */
export const anonymizeIP = (ip) => {
  if (!ip || typeof ip !== 'string') return ip;
  
  if (ip.includes('.')) {
    // IPv4
    return ip.replace(/\d+$/, '0');
  } else if (ip.includes(':')) {
    // IPv6
    const parts = ip.split(':');
    if (parts.length > 1) {
      parts[parts.length - 1] = '0000';
      return parts.join(':');
    }
  }
  return ip;
};

/**
 * Mongoose middleware helper to anonymize IP fields in updates.
 * @param {Object} update - The Mongoose update object.
 * @param {string[]} fields - The fields to check for anonymization.
 */
export const anonymizeUpdate = (update, fields) => {
  if (!update) return;

  fields.forEach(field => {
    // Direct field update e.g. { ipAddress: '...' }
    if (update[field]) {
      update[field] = anonymizeIP(update[field]);
    }
    // $set update e.g. { $set: { ipAddress: '...' } }
    if (update.$set && update.$set[field]) {
      update.$set[field] = anonymizeIP(update.$set[field]);
    }
  });
};
