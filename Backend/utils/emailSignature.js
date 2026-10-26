import { Role } from "../enum.js";

/** Title under a person's name. District Managers keep their own role; other signers stay System Manager. */
export const signatureRoleLine = (role) =>
  role === Role.Admin
    ? "The RADU E-Token District Manager"
    : "The RADU E-Token System Manager";

export const emailSignature = (name, schoolName, address, district, state, country, role) => `
  <br/><br/>
  <p style="font-size:14px; color:#444;">
    <strong>${name}</strong><br/>
    ${signatureRoleLine(role)}<br/>
    ${schoolName}<br/>
    ${address}<br/>
    ${district}, ${state}, ${country}
  </p>
`;
