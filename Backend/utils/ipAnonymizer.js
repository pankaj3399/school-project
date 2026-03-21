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

  // Handle Array-style aggregation pipeline updates
  if (Array.isArray(update)) {
    update.forEach(stage => anonymizeUpdate(stage, fields));
    return;
  }

  // 1. Handle direct field assignments (non-operator fields)
  fields.forEach(field => {
    if (update[field]) {
      update[field] = anonymizeIP(update[field]);
    }
  });

  // 2. Handle operators (e.g., $set, $setOnInsert, $push, etc.)
  Object.keys(update).forEach(key => {
    if (key.startsWith('$')) {
      const operatorObj = update[key];
      // Null safety: ensure operatorObj is a non-null object
      if (operatorObj && typeof operatorObj === 'object') {
        fields.forEach(field => {
          if (operatorObj[field] != null) {
            const val = operatorObj[field];
            if (typeof val === 'string') {
              operatorObj[field] = anonymizeIP(val);
            } else if (Array.isArray(val)) {
              operatorObj[field] = val.map(v => typeof v === 'string' ? anonymizeIP(v) : v);
            } else if (val && typeof val === 'object') {
              if (val.$each && Array.isArray(val.$each)) {
                val.$each = val.$each.map(v => typeof v === 'string' ? anonymizeIP(v) : v);
              } else {
                // Plain object: walk its values
                Object.keys(val).forEach(k => {
                  if (typeof val[k] === 'string') {
                    val[k] = anonymizeIP(val[k]);
                  }
                });
              }
            }
          }
        });
      }
    }
  });
};

/**
 * Adds IP anonymization hooks to a Mongoose schema for specific fields.
 * Handles save, updateOne, findOneUpdate, updateMany, and insertMany.
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

  // Query middleware: handles updates (including bulk updateMany)
  schema.pre(['updateOne', 'findOneAndUpdate', 'updateMany'], function (next) {
    const update = this.getUpdate();
    anonymizeUpdate(update, fields);
    next();
  });

  // Model middleware: handles Model.insertMany() - updated for Mongoose 8.x signature
  schema.pre('insertMany', function (next, docs, options) {
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

