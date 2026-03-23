/**
 * Escapes special characters for use in a regular expression.
 * @param {string} string The string to escape.
 * @returns {string} The escaped string.
 */
export const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
