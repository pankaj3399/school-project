import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getStudents, getAnalyticsData } from "@/api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ChartDataPoint {
  date: string;
  points: number;
}

interface RankingData {
  name: string;
  totalPoints: number;
  grade?: string;
}

interface AnalyticsData {
  awardPoints: ChartDataPoint[];
  deductPoints: ChartDataPoint[];
  withdrawPoints: ChartDataPoint[];
  teacherRankings: RankingData[];
  studentRankings: RankingData[];
}

const Analytics = () => {
  const [studentName, setStudentName] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [isPopOverOpen, setIsPopOverOpen] = useState(false);
  const [period, setPeriod] = useState<string>("1W");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTeacherRankings, setShowTeacherRankings] = useState(false);
  const [showStudentRankings, setShowStudentRankings] = useState(false);
  const [detailView, setDetailView] = useState<{
    type: 'award' | 'deduct' | 'withdraw' | null;
    data: ChartDataPoint[];
    title: string;
    color: string;
  } | null>(null);

  // Fetch students on mount
  useEffect(() => {
    const fetchStudents = async () => {
      const token = localStorage.getItem("token");
      const resTeacher = await getStudents(token ?? "");
      setStudents(resTeacher.students || []);
      setFilteredStudents(resTeacher.students || []);
    };
    fetchStudents();
  }, []);

  // Fetch analytics data when period or studentId changes
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        console.log('📊 MAIN PAGE: Fetching analytics with period:', period, 'studentId:', studentId);
        const data = await getAnalyticsData({
          period,
          ...(studentId && { studentId })
        });

        console.log('📊 MAIN PAGE: Received data:', data);
        if (data.success) {
          console.log('📊 MAIN PAGE: Award Points data:', data.data.awardPoints);
          console.log('📊 MAIN PAGE: Deduct Points data:', data.data.deductPoints);
          console.log('📊 MAIN PAGE: Withdraw Points data:', data.data.withdrawPoints);
          setAnalyticsData(data.data);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [period, studentId]);

  // Process chart data - show only actual data from database
  const processChartData = (data: ChartDataPoint[], period: string) => {
    console.log('🔄 Processing chart data - Input:', data, 'Period:', period);
    if (!data || data.length === 0) {
      console.log('🔄 No data to process, returning empty array');
      return [];
    }

    // Map the data to add formatted labels
    const result = data.map(d => ({
      ...d,
      label: formatDateLabel(d.date, period)
    }));

    console.log('🔄 Processed data (ONLY DB data):', result);
    return result;
  };

  // Format date for display
  const formatDateLabel = (dateStr: string, period: string) => {
    const date = new Date(dateStr);

    if (period === "1W") {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (period === "1M") {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const PointsChart = ({
    data,
    title,
    color,
    icon,
    type
  }: {
    data: ChartDataPoint[];
    title: string;
    color: string;
    icon: string;
    type: 'award' | 'deduct' | 'withdraw';
  }) => {
    const processedData = processChartData(data, period);

    return (
      <div className="w-full border-2 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <img src={icon} alt={title} className="w-12 h-12" />
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          <Button
            onClick={() => setDetailView({ type, data, title, color })}
            variant="outline"
            size="sm"
          >
            View Details
          </Button>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={processedData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              angle={period === "1W" ? 0 : -45}
              textAnchor={period === "1W" ? "middle" : "end"}
              height={period === "1W" ? 30 : 60}
            />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar
              dataKey="points"
              fill={color}
              radius={[4, 4, 0, 0]}
              barSize={period === "1W" ? 40 : period === "1M" ? 20 : 15}
              background={{ fill: "#f5f5f5" }}
              label={{
                position: "top",
                fill: "#0f0f0f",
                fontSize: 12
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const RankingsTable = ({
    data,
    title,
    showGrade
  }: {
    data: RankingData[];
    title: string;
    showGrade: boolean;
  }) => (
    <div>
      <h3 className="text-lg font-bold mb-4">{title}</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Rank</TableHead>
            <TableHead>Name</TableHead>
            {showGrade && <TableHead>Grade</TableHead>}
            <TableHead className="text-right">Total Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{index + 1}</TableCell>
              <TableCell>{item.name}</TableCell>
              {showGrade && <TableCell>{item.grade || 'N/A'}</TableCell>}
              <TableCell className="text-right">{item.totalPoints}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        {/* Period Selector */}
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1W">Last Week</SelectItem>
            <SelectItem value="1M">Last Month</SelectItem>
            <SelectItem value="3M">Last 3 Months</SelectItem>
            <SelectItem value="6M">Last 6 Months</SelectItem>
            <SelectItem value="1Y">Last Year</SelectItem>
          </SelectContent>
        </Select>

        {/* Student Selector */}
        {Array.isArray(students) && students.length > 0 && (
          <Popover open={isPopOverOpen} onOpenChange={setIsPopOverOpen}>
            <div className="flex items-center gap-2">
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[300px] justify-between">
                  {studentName
                    ? `${students.find((s: any) => s._id === studentId)?.name} (${students.find((s: any) => s._id === studentId)?.grade})`
                    : "All Students"}
                </Button>
              </PopoverTrigger>
              {studentName && (
                <X
                  onClick={() => {
                    setStudentId("");
                    setStudentName("");
                  }}
                  className="h-4 w-4 cursor-pointer hover:opacity-70"
                />
              )}
            </div>
            <PopoverContent className="w-[300px] p-0 flex flex-col">
              <Input
                onChange={(e) => {
                  const value = e.target.value;
                  setFilteredStudents(
                    students.filter((s: any) =>
                      s.name.toLowerCase().includes(value.toLowerCase())
                    )
                  );
                }}
                placeholder="Search students..."
                className="w-full"
              />
              <div className="max-h-[300px] overflow-y-auto">
                {filteredStudents.map((s: any) => (
                  <Button
                    onClick={() => {
                      setStudentId(s._id);
                      setStudentName(s.name);
                      setIsPopOverOpen(false);
                    }}
                    key={s._id}
                    className="justify-start w-full"
                    variant="ghost"
                  >
                    {`${s.name} (${s.grade})`}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Loading State */}
      {loading && <div className="text-center py-8">Loading analytics data...</div>}

      {/* Charts */}
      {!loading && analyticsData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 space-y-6">
            <PointsChart
              data={analyticsData.awardPoints}
              title="Tokens Awarded"
              color="#4CAF50"
              icon="/etoken.svg"
              type="award"
            />
            <PointsChart
              data={analyticsData.withdrawPoints}
              title="Withdrawals"
              color="#3d59f5"
              icon="/Withdraw.svg"
              type="withdraw"
            />
            <PointsChart
              data={analyticsData.deductPoints}
              title="Oopsies"
              color="#F44336"
              icon="/oopsie.svg"
              type="deduct"
            />
          </div>

          {/* Rankings */}
          <div className="space-y-6">
            <div className="border-2 rounded-lg p-4">
              <Button
                onClick={() => setShowTeacherRankings(true)}
                className="w-full mb-4"
                variant="outline"
              >
                View Teacher Rankings
              </Button>
              <Button
                onClick={() => setShowStudentRankings(true)}
                className="w-full"
                variant="outline"
              >
                View Student Rankings
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Rankings Dialog */}
      <Dialog open={showTeacherRankings} onOpenChange={setShowTeacherRankings}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Teacher Rankings - Total Points Issued</DialogTitle>
          </DialogHeader>
          {analyticsData && (
            <RankingsTable
              data={analyticsData.teacherRankings}
              title=""
              showGrade={true}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Student Rankings Dialog */}
      <Dialog open={showStudentRankings} onOpenChange={setShowStudentRankings}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Rankings - Total Points Received</DialogTitle>
          </DialogHeader>
          {analyticsData && (
            <RankingsTable
              data={analyticsData.studentRankings}
              title=""
              showGrade={false}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Detail View Dialog */}
      <Dialog open={!!detailView} onOpenChange={() => setDetailView(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailView?.title} - Detailed View</DialogTitle>
          </DialogHeader>

          {detailView && (
            <div className="space-y-6">
              {/* Filters in Detail View */}
              <div className="flex gap-4 flex-wrap">
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1W">Last Week</SelectItem>
                    <SelectItem value="1M">Last Month</SelectItem>
                    <SelectItem value="3M">Last 3 Months</SelectItem>
                    <SelectItem value="6M">Last 6 Months</SelectItem>
                    <SelectItem value="1Y">Last Year</SelectItem>
                  </SelectContent>
                </Select>

                {Array.isArray(students) && students.length > 0 && (
                  <Popover open={isPopOverOpen} onOpenChange={setIsPopOverOpen}>
                    <div className="flex items-center gap-2">
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[300px] justify-between">
                          {studentName
                            ? `${students.find((s: any) => s._id === studentId)?.name} (${students.find((s: any) => s._id === studentId)?.grade})`
                            : "All Students"}
                        </Button>
                      </PopoverTrigger>
                      {studentName && (
                        <X
                          onClick={() => {
                            setStudentId("");
                            setStudentName("");
                          }}
                          className="h-4 w-4 cursor-pointer hover:opacity-70"
                        />
                      )}
                    </div>
                    <PopoverContent className="w-[300px] p-0 flex flex-col">
                      <Input
                        onChange={(e) => {
                          const value = e.target.value;
                          setFilteredStudents(
                            students.filter((s: any) =>
                              s.name.toLowerCase().includes(value.toLowerCase())
                            )
                          );
                        }}
                        placeholder="Search students..."
                        className="w-full"
                      />
                      <div className="max-h-[300px] overflow-y-auto">
                        {filteredStudents.map((s: any) => (
                          <Button
                            onClick={() => {
                              setStudentId(s._id);
                              setStudentName(s.name);
                              setIsPopOverOpen(false);
                            }}
                            key={s._id}
                            className="justify-start w-full"
                            variant="ghost"
                          >
                            {`${s.name} (${s.grade})`}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {/* Detailed Chart */}
              <div className="border-2 rounded-lg p-6">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={(() => {
                      let currentData = []
                      if (detailView.type === 'award' && analyticsData) {
                        currentData = analyticsData.awardPoints
                      } else if (detailView.type === 'deduct' && analyticsData) {
                        currentData = analyticsData.deductPoints
                      } else if (detailView.type === 'withdraw' && analyticsData) {
                        currentData = analyticsData.withdrawPoints
                      }
                      return processChartData(currentData, period)
                    })()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      angle={period === "1W" ? 0 : -45}
                      textAnchor={period === "1W" ? "middle" : "end"}
                      height={period === "1W" ? 30 : 60}
                    />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar
                      dataKey="points"
                      fill={detailView.color}
                      radius={[4, 4, 0, 0]}
                      barSize={period === "1W" ? 40 : period === "1M" ? 20 : 15}
                      background={{ fill: "#f5f5f5" }}
                      label={{
                        position: "top",
                        fill: "#0f0f0f",
                        fontSize: 12
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Analytics;
