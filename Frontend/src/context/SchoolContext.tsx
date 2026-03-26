import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from '../authContext';
import { Role } from '../enum';

interface SchoolContextType {
  selectedSchoolId: string | null;
  setSelectedSchoolId: (id: string | null) => void;
  schools: any[];
  selectedSchool: any | null;
  loading: boolean;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(() => {
    return localStorage.getItem('selectedSchoolId');
  });

  const selectedSchool = selectedSchoolId ? schools.find(s => s._id === selectedSchoolId) : null;

  useEffect(() => {
    if (selectedSchoolId) {
      localStorage.setItem('selectedSchoolId', selectedSchoolId);
    } else {
      localStorage.removeItem('selectedSchoolId');
    }
  }, [selectedSchoolId]);

  useEffect(() => {
    if (!user) {
      setSelectedSchoolId(null);
      setSchools([]);
    } else if (user.role === Role.SystemAdmin || user.role === Role.Admin) {
      const fetchSchools = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem('token') || '';
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/school`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          if (data.schools) {
            setSchools(data.schools);
          }
        } catch (error) {
          console.error("Error fetching schools in context:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchSchools();
    } else {
      setSelectedSchoolId(null);
      setSchools([]);
    }
  }, [user]);

  return (
    <SchoolContext.Provider value={{ selectedSchoolId, setSelectedSchoolId, schools, selectedSchool, loading }}>
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
