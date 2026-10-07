export const REGISTRATION_AGREEMENT_VERSION = "registration-2026-09";

export const REGISTRATION_AGREEMENT_TITLE = "RADU E-Token User Registration Agreement";

export const REGISTRATION_AGREEMENT_TEXT = `RADU E-TOKEN USER REGISTRATION AGREEMENT

By creating an account and selecting "I Agree," I confirm that:

1. I am authorized by my school or educational institution to use the RADU E-Token system.
2. I will use RADU E-Token only for authorized educational purposes and in accordance with my school or district policies.
3. I will protect my login credentials and will not share my account with another person.
4. I will access only the student information and system functions that I am authorized to access.
5. I will not enter unnecessary sensitive student information into the system, including medical information, disability status, IEP or Section 504 information, disciplinary records, biometric information, or other information that RADU E-Token is not designed to collect.
6. I understand that RADU E-Token is a positive-recognition and reinforcement tool. It is not a grading, disciplinary, special-education, medical, mental-health, emergency, threat-assessment, or student-safety decision system.
7. I understand that recognition tokens and balances have no monetary value and may be used only according to the recognition and redemption rules established by my school.
8. I understand that RADU E-Token is currently being used as a pilot service and that features may be modified, improved, added, or removed during the pilot.
9. I understand that my use of the service may generate account, access, security, recognition, and activity records necessary to operate and protect the system.
10. I acknowledge that I have reviewed the RADU E-Token Privacy Policy, which explains how information is collected, used, protected, retained, and disclosed.
11. I agree to comply with the RADU E-Token Terms of Use.
12. I will promptly report suspected unauthorized access, misuse, privacy concerns, or security incidents involving RADU E-Token to my school and/or Affective Academy LLC.
13. I understand that my access may be suspended or terminated if my authorization ends, if I violate these requirements, or if suspension is reasonably necessary to protect students, users, data, or the security of the system.
14. I understand that my school or district remains responsible for determining how RADU E-Token is used for educational purposes and which users and students are authorized to participate.

By selecting "I Agree," I acknowledge that I have read and agree to this User Registration Agreement and the RADU E-Token Terms of Use, and that I have reviewed the RADU E-Token Privacy Policy.

Affective Academy LLC
Littleton, Colorado 80127
Privacy: privacy@theraduetoken.com
Administration: admin@theraduetoken.com`;

export function registrationAgreementFallback() {
  return {
    kind: "registration",
    version: REGISTRATION_AGREEMENT_VERSION,
    title: REGISTRATION_AGREEMENT_TITLE,
    content: REGISTRATION_AGREEMENT_TEXT,
    isActive: true,
    effectiveDate: new Date("2026-09-14T00:00:00.000Z"),
  };
}
