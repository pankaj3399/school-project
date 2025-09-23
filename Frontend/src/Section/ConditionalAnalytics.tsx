import { useEffect, useState } from "react";
import { getCurrrentSchool } from "@/api";
import { useToast } from "@/hooks/use-toast";
import Loading from "./Loading";
import AddSchool from "./School/add-school";
import TeacherDashboard from "./Teacher/analytics";

const ConditionalAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast({
            title: "Error",
            description: "No token found.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const data = await getCurrrentSchool(token);
        setSchool(data.school || null);
      } catch (error) {
        console.error("Error fetching school:", error);
        setSchool(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSchool();
  }, [toast]);

  if (loading) return <Loading />;

  // If no school exists, show AddSchool component
  if (!school) {
    return <AddSchool />;
  }

  // If school exists, show TeacherDashboard (analytics)
  return <TeacherDashboard />;
};

export default ConditionalAnalytics;