import { TermsOfUse } from "../models/TermsOfUse.js";
import { registrationAgreementFallback } from "./registrationAgreement.js";

export const LEGAL_KINDS = ["registration", "terms", "privacy"];

const TITLES = {
  registration: "RADU E-Token User Registration Agreement",
  terms: "RADU E-Token Terms of Use",
  privacy: "RADU E-Token Privacy Policy",
};

export function assertLegalKind(kind) {
  if (!LEGAL_KINDS.includes(kind)) {
    const error = new Error("Unknown legal document.");
    error.status = 400;
    throw error;
  }
}

export async function getActiveLegalDocument(kind) {
  assertLegalKind(kind);
  const doc = await TermsOfUse.findOne({ isActive: true, kind }).sort({ effectiveDate: -1 });
  if (doc) return doc;
  if (kind === "registration") return registrationAgreementFallback();
  return null;
}

export async function publishLegalDocument({ kind, version, title, content, contentHtml, effectiveDate, userId }) {
  assertLegalKind(kind);
  const trimmedVersion = String(version || "").trim();
  const trimmedContent = String(content || "").trim();
  if (!trimmedVersion) {
    const error = new Error("A version id is required.");
    error.status = 400;
    throw error;
  }
  if (!trimmedContent) {
    const error = new Error("Document text is required.");
    error.status = 400;
    throw error;
  }

  let created;
  try {
    created = await TermsOfUse.create({
      kind,
      version: trimmedVersion,
      title: String(title || "").trim() || TITLES[kind],
      content: trimmedContent,
      contentHtml,
      effectiveDate: effectiveDate || new Date(),
      applicableToDistricts: [],
      createdBy: userId,
      isActive: true,
    });
  } catch (error) {
    if (error?.code === 11000) {
      const conflict = new Error("That version id is already used. Choose a new one.");
      conflict.status = 400;
      throw conflict;
    }
    throw error;
  }

  await TermsOfUse.updateMany(
    { _id: { $ne: created._id }, isActive: true, kind },
    {
      isActive: false,
      deactivatedAt: new Date(),
      deactivatedBy: userId,
    }
  );

  return created;
}
