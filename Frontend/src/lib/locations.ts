export const US_STATES = [
    { name: "Alabama", abbreviation: "AL" }, { name: "Alaska", abbreviation: "AK" }, { name: "Arizona", abbreviation: "AZ" },
    { name: "Arkansas", abbreviation: "AR" }, { name: "California", abbreviation: "CA" }, { name: "Colorado", abbreviation: "CO" },
    { name: "Connecticut", abbreviation: "CT" }, { name: "Delaware", abbreviation: "DE" }, { name: "Florida", abbreviation: "FL" },
    { name: "Georgia", abbreviation: "GA" }, { name: "Hawaii", abbreviation: "HI" }, { name: "Idaho", abbreviation: "ID" },
    { name: "Illinois", abbreviation: "IL" }, { name: "Indiana", abbreviation: "IN" }, { name: "Iowa", abbreviation: "IA" },
    { name: "Kansas", abbreviation: "KS" }, { name: "Kentucky", abbreviation: "KY" }, { name: "Louisiana", abbreviation: "LA" },
    { name: "Maine", abbreviation: "ME" }, { name: "Maryland", abbreviation: "MD" }, { name: "Massachusetts", abbreviation: "MA" },
    { name: "Michigan", abbreviation: "MI" }, { name: "Minnesota", abbreviation: "MN" }, { name: "Mississippi", abbreviation: "MS" },
    { name: "Missouri", abbreviation: "MO" }, { name: "Montana", abbreviation: "MT" }, { name: "Nebraska", abbreviation: "NE" },
    { name: "Nevada", abbreviation: "NV" }, { name: "New Hampshire", abbreviation: "NH" }, { name: "New Jersey", abbreviation: "NJ" },
    { name: "New Mexico", abbreviation: "NM" }, { name: "New York", abbreviation: "NY" }, { name: "North Carolina", abbreviation: "NC" },
    { name: "North Dakota", abbreviation: "ND" }, { name: "Ohio", abbreviation: "OH" }, { name: "Oklahoma", abbreviation: "OK" },
    { name: "Oregon", abbreviation: "OR" }, { name: "Pennsylvania", abbreviation: "PA" }, { name: "Rhode Island", abbreviation: "RI" },
    { name: "South Carolina", abbreviation: "SC" }, { name: "South Dakota", abbreviation: "SD" }, { name: "Tennessee", abbreviation: "TN" },
    { name: "Texas", abbreviation: "TX" }, { name: "Utah", abbreviation: "UT" }, { name: "Vermont", abbreviation: "VT" },
    { name: "Virginia", abbreviation: "VA" }, { name: "Washington", abbreviation: "WA" }, { name: "West Virginia", abbreviation: "WV" },
    { name: "Wisconsin", abbreviation: "WI" }, { name: "Wyoming", abbreviation: "WY" }
] as const;

export const CANADA_PROVINCES = [
    { name: "Alberta", abbreviation: "AB" }, { name: "British Columbia", abbreviation: "BC" },
    { name: "Manitoba", abbreviation: "MB" }, { name: "New Brunswick", abbreviation: "NB" },
    { name: "Newfoundland and Labrador", abbreviation: "NL" }, { name: "Northwest Territories", abbreviation: "NT" },
    { name: "Nova Scotia", abbreviation: "NS" }, { name: "Nunavut", abbreviation: "NU" },
    { name: "Ontario", abbreviation: "ON" }, { name: "Prince Edward Island", abbreviation: "PE" },
    { name: "Quebec", abbreviation: "QC" }, { name: "Saskatchewan", abbreviation: "SK" },
    { name: "Yukon", abbreviation: "YT" }
] as const;

export const COUNTRIES = ["USA", "Canada"] as const;

/** State-dropdown option for locations that are not a US state or Canadian province. */
export const OUTSIDE_USA = "Outside the USA";

const LEGACY_OUTSIDE_COUNTRY = new Set(["Outside the USA", "Other"]);

export type USState = typeof US_STATES[number];
export type USStateName = USState['name'];
export type USStateAbbreviation = USState['abbreviation'];

export type CanadaProvince = typeof CANADA_PROVINCES[number];
export type CanadaProvinceName = CanadaProvince['name'];
export type CanadaProvinceAbbreviation = CanadaProvince['abbreviation'];

export type Country = typeof COUNTRIES[number];

export function normalizeCountry(country?: string): string {
    if (!country) return "USA";
    if (country === "United States") return "USA";
    if (LEGACY_OUTSIDE_COUNTRY.has(country)) return "USA";
    return country;
}

/** Move a legacy Country value of “Outside the USA” onto State when loading saved records. */
export function normalizeLocation(input: { country?: string; state?: string }): { country: string; state: string } {
    const rawCountry = input.country ?? "";
    const country = normalizeCountry(rawCountry);
    let state = (input.state ?? "").trim();
    if (LEGACY_OUTSIDE_COUNTRY.has(rawCountry) && !state) {
        state = OUTSIDE_USA;
    }
    return { country, state };
}

export function isListedUsaStateOption(value: string, mode: "name" | "abbreviation" = "name"): boolean {
    if (!value) return false;
    if (value === OUTSIDE_USA) return true;
    return US_STATES.some((s) => (mode === "abbreviation" ? s.abbreviation === value : s.name === value));
}
