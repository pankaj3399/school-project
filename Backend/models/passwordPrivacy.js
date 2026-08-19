/**
 * Keep password hashes off API payloads.
 * Callers that need the hash (login, bcrypt.compare, registration checks)
 * must explicitly .select('+password').
 */
export function stripPasswordFields(value) {
  if (value == null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(stripPasswordFields);

  const obj = typeof value.toJSON === 'function' ? value.toJSON() : { ...value };
  delete obj.password;
  if (obj.createdBy && typeof obj.createdBy === 'object') {
    delete obj.createdBy.password;
  }
  return obj;
}

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
  schema.set('toObject', { transform });
}
