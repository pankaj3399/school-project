import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnalyticsData } from "@/api";
import { XAxis, YAxis, Tooltip, Bar, BarChart, ResponsiveContainer } from "recharts";
import { IconAppleFilled } from "@tabler/icons-react";
import { Printer, X } from "lucide-react";

interface Teacher {
  name: string;
  totalPoints: number;
  grade?: string;
  awardedBy?: string,
}

const TeacherRanks = ({ studentId, schoolId }: { studentId: string, schoolId?: string }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printRef.current) {
      const printContents = printRef.current.innerHTML;
      const newWindow = window.open("", "", "width=800,height=600");
      if (newWindow) {
        newWindow.document.write(`
              <html>
                <head>
                  <title>Student Rankings</title>
                  <style>
                    body { font-family: sans-serif; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                    th { background: #f5f5f5; }
                  </style>
                </head>
                <body>
                  ${printContents}
                </body>
              </html>
            `);
        newWindow.document.close();
        newWindow.focus();
        newWindow.print();
        newWindow.close();
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [studentId, schoolId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getAnalyticsData({ 
        period: "1W",
        ...(schoolId && { schoolId })
      });

      if (data.success) {
        if(studentId === "") setTeachers(data.data.teacherRankings || []);
        else {
          console.log(data.data.studentRankings.filter((student: any) => student.studentId === studentId))
          setTeachers(data.data.studentRankings.filter((student: any) => student.studentId === studentId)) }
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
    <div className="relative">
      <div className="flex gap-2">
        {/* Teachers Card */}
        <Card className="flex-1 flex flex-col min-h-[400px] border-neutral-200 shadow-sm rounded-2xl overflow-hidden" onClick={() => { setIsDialogOpen(true) }}>
          <CardHeader className="pb-3 bg-neutral-50/50 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                <IconAppleFilled className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Teacher Rankings</CardTitle>
                <p className="text-xs text-neutral-400 font-medium">Awarded Tokens</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={teachers}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  barCategoryGap={20}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey={studentId === "" ? "name" : "awardedBy"}
                    type="category"
                    className="text-[10px] font-medium text-neutral-500"
                    width={80}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar 
                    dataKey="totalPoints" 
                    fill="#3b82f6" 
                    radius={[0, 4, 4, 0]}
                    barSize={12} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      {isDialogOpen && <div className="absolute inset-0">
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
          <div className="relative bg-neutral-100 rounded-2xl shadow-lg p-4">
            <button
              onClick={() => setIsDialogOpen(false)}
              className="absolute top-4 left-4 text-neutral-600 hover:text-neutral-800"
            >
              <X />
            </button>
            <button onClick={handlePrint} className="flex justify-center items-center gap-1 absolute top-4 right-4 text-neutral-600 hover:text-neutral-800 border border-neutral-400 py-0.5 px-1 rounded-sm">
              <Printer className="w-5 h-5 stroke-1.5" />
              Print
            </button>

            <div className="mt-12 overflow-y-auto max-h-[320px]" style={{ scrollbarWidth: 'none' }} ref={printRef}>
              <table className="min-w-full border border-neutral-200 rounded-md">
                <thead className="bg-neutral-100">
                  <tr>
                    <th className="px-6 py-2 text-left text-sm font-semibold text-neutral-700">
                      Rank
                    </th>
                    <th className="px-6 py-2 text-left text-sm font-semibold text-neutral-700">
                      Teacher Name
                    </th>
                    <th className="px-6 py-2 text-left text-sm font-semibold text-neutral-700">
                      Total Points
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher, index) => (
                    <tr
                      key={index}
                      className="border-t border-neutral-200 hover:bg-neutral-50"
                    >
                      <td className="px-6 py-2 text-sm text-neutral-700">
                        {index + 1}
                      </td>
                      <td className="px-6 py-2 text-sm text-neutral-800 font-medium">
                        {studentId === '' ? teacher.name : teacher.awardedBy}
                      </td>
                      <td className="px-6 py-2 text-sm text-neutral-700">
                        {teacher.totalPoints}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>}
    </div>
  );
};

export default TeacherRanks;
