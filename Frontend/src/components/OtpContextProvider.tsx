// AuthContext.js
import { createContext, ReactNode, useContext, useState } from 'react';

// Create the context
const OtpContext = createContext<{
    email:string, otpId:string, role:string,
    updateEmail?: (newEmail: string) => void,
    updateRole?: (newRole: string) => void,
    updateOtpId?: (newOtp: string) => void,
    reset?: () => void
}>({
    email:"", role:"", otpId:"",
});

// Create the context provider
export function OtpProvider({ children }:{children: ReactNode}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [otpId, setOtpId] = useState('');

  const updateEmail = (newEmail:string) => {
    setEmail(newEmail);
  };

  const updateRole = (newRole:string) => {
    setRole(newRole);
  };

  const updateOtpId = (newOtp:string) => {
    setOtpId(newOtp);
  };

  // Reset all states
  const reset = () => {
    setEmail('');
    setRole('');
    setOtpId('');
  };

  const value = {
    email,
    role,
    otpId,
    updateEmail,
    updateRole,
    updateOtpId,
    reset
  };

  return (
    <OtpContext.Provider value={value}>
      {children}
    </OtpContext.Provider>
  );
}

// Custom hook to use the auth context
export function useOtpContext() {
  const context = useContext(OtpContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
