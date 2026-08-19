/**
 * Keep password hashes off API payloads.
 * Callers that need the hash (login, bcrypt.compare, registration checks)
 * must explicitly .select('+password').
 */
export function hidePassword(schema, { includeRegistrationFlag = false } = {}) {
  const transform = (doc, ret) => {
    if (includeRegistrationFlag) {
      const passwordLoaded =
        (typeof doc.isSelected === 'function' && doc.isSelected('password')) ||
        doc.password !== undefined;
      if (passwordLoaded) {
        ret.hasCompletedRegistration = !!doc.password;
      }
    }
    delete ret.password;
    return ret;
  };

  schema.set('toJSON', { transform });
  schema.set('toObject', {
    transform: (_doc, ret) => {
      delete ret.password;
      return ret;
    },
  });
}
