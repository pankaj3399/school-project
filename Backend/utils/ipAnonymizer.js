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

/**
 * Adds IP anonymization hooks to a Mongoose schema for specific fields.
 * Handles save, updateOne, findOneUpdate, and insertMany.
 * @param {mongoose.Schema} schema - The Mongoose schema to modify.
 * @param {string[]} fields - The fields to anonymize.
 */
export const addIPAnonymizationMiddleware = (schema, fields) => {
  // Document middleware: handles doc.save() and Model.create()
  schema.pre('save', function (next) {
    fields.forEach(field => {
      if (this[field]) {
        this[field] = anonymizeIP(this[field]);
      }
    });
    next();
  });

  // Query middleware: handles updates
  schema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
    const update = this.getUpdate();
    anonymizeUpdate(update, fields);
    next();
  });

  // Model middleware: handles Model.insertMany()
  schema.pre('insertMany', function (next, docs) {
    if (Array.isArray(docs)) {
      docs.forEach(doc => {
        fields.forEach(field => {
          if (doc[field]) {
            doc[field] = anonymizeIP(doc[field]);
          }
        });
      });
    }
    next();
  });
};

