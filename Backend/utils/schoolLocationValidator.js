// Shared validator for school city / zipCode / address inputs.
// Returns null when valid, or { status, message } when invalid so callers can
// respond consistently from createSchool and updateSchool paths.
const CITY_PATTERN = /^[A-Za-zÀ-ɏ\s.'-]{0,100}$/;
const ZIP_PATTERN = /^[A-Za-z0-9\s-]{0,10}$/;
const ADDRESS_MAX_LENGTH = 200;

export const validateSchoolLocation = ({ city, zipCode, address } = {}) => {
  if (city && !CITY_PATTERN.test(city)) {
    return { status: 400, message: "City must contain only letters, spaces, hyphens, or apostrophes and be at most 100 characters." };
  }
  if (zipCode && !ZIP_PATTERN.test(zipCode)) {
    return { status: 400, message: "Zip code must be at most 10 alphanumeric characters." };
  }
  if (address && String(address).length > ADDRESS_MAX_LENGTH) {
    return { status: 400, message: `Address must be at most ${ADDRESS_MAX_LENGTH} characters.` };
  }
  return null;
};
