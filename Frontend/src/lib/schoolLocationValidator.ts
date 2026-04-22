// Mirror of Backend/utils/schoolLocationValidator.js — keep the regex and length
// rules in sync so client-side errors match the server's 400 responses.
export const CITY_PATTERN = /^[A-Za-zÀ-ɏ\s.'-]{0,100}$/;
export const ZIP_PATTERN = /^[A-Za-z0-9\s-]{0,10}$/;
export const ADDRESS_MAX_LENGTH = 200;

export type SchoolLocationInput = {
  city?: string;
  zipCode?: string;
  address?: string;
};

export type SchoolLocationErrors = {
  city?: string;
  zipCode?: string;
  address?: string;
};

export function validateSchoolLocation(input: SchoolLocationInput): SchoolLocationErrors {
  const errors: SchoolLocationErrors = {};
  if (input.city && !CITY_PATTERN.test(input.city)) {
    errors.city = "City must be letters, spaces, hyphens, or apostrophes (max 100).";
  }
  if (input.zipCode && !ZIP_PATTERN.test(input.zipCode)) {
    errors.zipCode = "Zip code must be alphanumeric (max 10 characters).";
  }
  if (input.address && input.address.length > ADDRESS_MAX_LENGTH) {
    errors.address = `Address must be at most ${ADDRESS_MAX_LENGTH} characters.`;
  }
  return errors;
}
