export const emailSignature = (name, schoolName, address, district, state, country) => `
  <br/><br/>
  <p style="font-size:14px; color:#444;">
    <strong>${name}</strong><br/>
    The RADU E-token System Manager<br/>
    ${schoolName}<br/>
    ${address}<br/>
    ${district}, ${state}, ${country}
  </p>
`;
