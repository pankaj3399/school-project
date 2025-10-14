export const emailSignature = (name, schoolName, city, state, zip) => `
  <br/><br/>
  <p style="font-size:14px; color:#444;">
    <strong>${name}</strong><br/>
    The RADU E-token System Manager<br/>
    ${schoolName}<br/>
    ${city}, ${state}, ${zip}
  </p>
`;
