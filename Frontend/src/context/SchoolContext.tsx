import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from '../authContext';
import { Role } from '../enum';
import { API_URL } from '@/api';

interface School {
  _id: string;
  name: string;
  address?: string;
  district?: string;
  districtId?: {
    _id: string;
    name: string;
  };
  logo?: string;
  state?: string;
  country?: string;
  timeZone?: string;
  domain?: string;
}

interface SchoolContextType {
  selectedSchoolId: string | null;
  setSelectedSchoolId: (id: string | null) => void;
  schools: School[];
  selectedSchool: School | null;
  loading: boolean;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(() => {
    return localStorage.getItem('selectedSchoolId');
  });

  const selectedSchool = selectedSchoolId ? (schools.find(s => s._id === selectedSchoolId) ?? null) : null;

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
          const url = `${API_URL}/school/`;
          const response = await fetch(url, {
            headers: { token },
          });
          const text = await response.text();
          const trimmed = text.trim();
          if (trimmed.startsWith("<")) {
            console.error(
              "[SchoolContext] Got HTML instead of JSON — API base is usually wrong (use VITE_API_URL with /api, same as rest of app).",
              { url, status: response.status, preview: trimmed.slice(0, 160) },
            );
            setSchools([]);
            return;
          }
          let data: unknown;
          try {
            data = JSON.parse(text) as unknown;
          } catch {
            console.error("[SchoolContext] Response was not valid JSON", { url, status: response.status, preview: trimmed.slice(0, 200) });
            setSchools([]);
            return;
          }
          // TODO: remove after confirming shape — then drop Array.isArray / data?.data fallback below
          console.log("[SchoolContext] GET /school/ response", data, {
            isArray: Array.isArray(data),
            topLevelKeys:
              data && typeof data === "object" && !Array.isArray(data)
                ? Object.keys(data as object)
                : null,
          });
          const list = Array.isArray(data)
            ? data
            : (data as { schools?: unknown; data?: unknown })?.schools ??
              (data as { schools?: unknown; data?: unknown })?.data;
          
          if (Array.isArray(list)) {
            setSchools(list);
            
            // Auto-select first school if nothing is currently selected
            if (!selectedSchoolId && list.length > 0) {
              const firstId = (list[0] as School)._id;
              setSelectedSchoolId(firstId);
            }
          } else {
            setSchools([]);
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
