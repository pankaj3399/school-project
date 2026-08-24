/** Display ™ as ® so stored Terms of Use rows match current branding. */
export function replaceTrademarkWithRegistered(value) {
  if (typeof value !== 'string') return value;
  return value
    .replaceAll('\u2122', '\u00AE')
    .replaceAll('™', '®')
    .replace(/&trade;/gi, '&reg;');
}

export function presentTermsDocument(terms) {
  if (!terms) return terms;
  const obj = typeof terms.toObject === 'function' ? terms.toObject() : { ...terms };
  obj.title = replaceTrademarkWithRegistered(obj.title);
  obj.content = replaceTrademarkWithRegistered(obj.content);
  obj.contentHtml = replaceTrademarkWithRegistered(obj.contentHtml);
  return obj;
}
