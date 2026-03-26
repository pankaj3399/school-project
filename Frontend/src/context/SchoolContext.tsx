import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from '../authContext';
import { Role } from '../enum';

interface SchoolContextType {
  selectedSchoolId: string | null;
  setSelectedSchoolId: (id: string | null) => void;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(() => {
    return localStorage.getItem('selectedSchoolId');
  });

  useEffect(() => {
    if (selectedSchoolId) {
      localStorage.setItem('selectedSchoolId', selectedSchoolId);
    } else {
      localStorage.removeItem('selectedSchoolId');
    }
  }, [selectedSchoolId]);

  // Reset selected school if user changes and is not SystemAdmin
  useEffect(() => {
    if (user && user.role !== Role.SystemAdmin && user.role !== Role.Admin) {
      setSelectedSchoolId(null);
    }
  }, [user]);

  return (
    <SchoolContext.Provider value={{ selectedSchoolId, setSelectedSchoolId }}>
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (context === undefined) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
};
