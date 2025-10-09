import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Award } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAnalyticsData } from "@/api";
import { XAxis, YAxis, Tooltip, Bar, BarChart } from "recharts";

interface Teacher {
  name: string;
  totalPoints: number;
  grade?: string;
}

interface Student {
  name: string;
  totalPoints: number;
}

const Ranks = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getAnalyticsData({ period: "1W" });

      if (data.success) {
        setTeachers(data.data.teacherRankings || []);
        setStudents(data.data.studentRankings || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {/* Teachers Card */}
      <Card className="flex-1 h-[420px] flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-5 h-5 text-blue-500" />
            Teachers - Forms Used
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <BarChart
              width={200}
              height={teachers.length * 50}
              data={teachers}
              layout="vertical"
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              barCategoryGap={20}
            >
              <XAxis type="number" />
              <YAxis
                dataKey="name"
                type="category"
                className="text-xs"
                width={60}
              />
              <Tooltip itemStyle={{ fontSize: "12px" }} />
              <Bar dataKey="totalPoints" fill="#3b82f6" barSize={20} />
            </BarChart>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Students Card */}
      <Card className="flex-1 h-[420px] flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="w-5 h-5 text-green-500" />
            Students - Points Received
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <BarChart
              width={200}
              height={students.length * 50}
              data={students}
              layout="vertical"
              margin={{ top: 0, right: 10, left: 0, bottom: -10 }}
              barCategoryGap={40}
            >
              <XAxis type="number" />
              <YAxis
                dataKey="name"
                type="category"
                className="text-xs"
                width={60}
              />
              <Tooltip itemStyle={{ fontSize: "12px" }} />
              <Bar dataKey="totalPoints" fill="#22c55e" barSize={20} />
            </BarChart>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default Ranks;
