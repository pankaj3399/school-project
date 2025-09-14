import { useEffect, useState } from "react";
import CurrentWeekCharts from "./current-week-charts";
import EducationYearChart from "./new-chart";
import Ranks from "./ranks";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getStudents, getHistoryByTime } from "@/api";
import PointsBarChart from "./points-bar-chart";
import { FormType } from '@/lib/types';

const periods = [
  {label: '1W', value: '1 WEEK'},
  {label: '1M', value: '1 MONTH'},
  {label: '3M', value: '3 MONTHS'},
  {label: '6M', value: '6 MONTHS'},
  {label: '1Y', value: '1 YEAR'},
];

const AllCharts = () => {
  const [studentName, setStudentName] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setfilteredStudents] = useState<any[]>([]);
  const [isPopOverOpen, setIsPopOverOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('1W');
  const [tokensData, setTokensData] = useState<any[]>([]);
  const [withdrawalsData, setWithdrawalsData] = useState<any[]>([]);
  const [oopsiesData, setOopsiesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      const token = localStorage.getItem("token");
      const resTeacher = await getStudents(token ?? "");
      setStudents(resTeacher.students);
      setfilteredStudents(resTeacher.students);
    };
    fetchStudents();
  }, []);

  // Helper function to format data by period (similar to detailed-history.tsx)
  const formatDataByPeriod = (responseData: any, period: string, timezone: string) => {
    const periodDays: Record<string, number> = {
      '1W': 7,
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365
    };

    const days = periodDays[period];
    if (!days) return [];

    const offsetMatch = timezone.match(/UTC([+-]?\d+)/);
    const offsetHours = offsetMatch ? parseInt(offsetMatch[1], 10) : 0;

    const now = new Date();
    const targetDate = new Date(now.getTime() + (offsetHours * 60 * 60 * 1000));

    const data = Array.from({length: days}, (_, dayIndex) => {
      const date = new Date(targetDate);
      date.setDate(date.getDate() - (days - 1 - dayIndex));
      return {
        day: date.toISOString().split('T')[0],
        points: 0
      };
    });

    responseData.forEach((dayData: any) => {
      const dayIndex = data.findIndex((day: any) => day.day === dayData.day);
      if (dayIndex !== -1) {
        data[dayIndex].points += Number(dayData.points);
      }
    });

    return data.map((d: any) => ({
      ...d,
      points: Math.abs(d.points)
    }));
  };

  // Fetch time period data when studentId or selectedPeriod changes
  useEffect(() => {
    const fetchTimeData = async () => {
      if (!studentId) {
        setTokensData([]);
        setWithdrawalsData([]);
        setOopsiesData([]);
        return;
      }

      try {
        setLoading(true);
        const [tokensRes, withdrawalsRes, oopsiesRes] = await Promise.all([
          getHistoryByTime({ formType: FormType.AwardPoints, period: selectedPeriod, studentId }),
          getHistoryByTime({ formType: FormType.PointWithdraw, period: selectedPeriod, studentId }),
          getHistoryByTime({ formType: FormType.DeductPoints, period: selectedPeriod, studentId })
        ]);

        const timezone = tokensRes?.timeZone || 'UTC+0';

        console.log('Tokens data:', tokensRes?.data);
        console.log('Withdrawals data:', withdrawalsRes?.data);
        console.log('Oopsies data:', oopsiesRes?.data);

        const formattedTokens = formatDataByPeriod(tokensRes?.data || [], selectedPeriod, timezone);
        const formattedWithdrawals = formatDataByPeriod(withdrawalsRes?.data || [], selectedPeriod, timezone);
        const formattedOopsies = formatDataByPeriod(oopsiesRes?.data || [], selectedPeriod, timezone);

        console.log('Formatted tokens:', formattedTokens);
        console.log('Formatted withdrawals:', formattedWithdrawals);
        console.log('Formatted oopsies:', formattedOopsies);

        setTokensData(formattedTokens);
        setWithdrawalsData(formattedWithdrawals);
        setOopsiesData(formattedOopsies);
      } catch (error) {
        console.error('Error fetching time period data:', error);
        setTokensData([]);
        setWithdrawalsData([]);
        setOopsiesData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeData();
  }, [studentId, selectedPeriod]);

  return (
    <div>
      <div>
      {Array.isArray(students) && students.length > 0 ? (
        <Popover open={isPopOverOpen} onOpenChange={setIsPopOverOpen}>
          <div className="flex items-center space-x-2 mt-10">
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
              >
                {studentName
                  ? students.find((s: any) => s._id === studentId)?.name
                  : "Select student..."}
              </Button>
            </PopoverTrigger>
            <X
              onClick={() => {
                setStudentId("");
                setStudentName("");
              }}
              className="ml-2 h-4 w-4 shrink-0 opacity-50 cursor-pointer"
            />
          </div>
          <PopoverContent className="w-[600px]  p-0 flex flex-col space-y-0">
            <Input
              onChange={(e) => {
                const value = e.target.value;
                setfilteredStudents(
                  students.filter((s: any) =>
                    s.name.toLowerCase().includes(value.toLowerCase())
                  )
                );
              }}
              className="w-full"
            />
            <div className="flex flex-col h-[400px] overflow-y-auto">
            {filteredStudents.map((s: any) => (
              <Button
                onClick={() => {
                  setStudentId(s._id);
                  setStudentName(s.name);
                  setIsPopOverOpen(false);
                }}
                key={s._id}
                className="justify-start"
                variant={"ghost"}
              >
                {s.name} (Grade {s.grade})
              </Button>
            ))}
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        <div>No students available</div>
      )}
      </div>


      <div className="mt-12 space-y-4 grid grid-cols-4">
        <div className="col-span-3">
          <EducationYearChart studentId={studentId} />
          <CurrentWeekCharts studentId={studentId} />

          {/* Additional charts when student is selected */}
          {studentId && !loading && (
            <div className="mt-8 space-y-6">
              <PointsBarChart
                title="Tokens"
                barColor="#4CAF50"
                icon="/etoken.svg"
                data={tokensData}
                layout="horizontal"
              />
              <PointsBarChart
                title="Withdrawals"
                barColor="#3d59f5"
                icon="/Withdraw.svg"
                data={withdrawalsData}
                layout="horizontal"
              />
              <PointsBarChart
                title="Oopsies"
                barColor="#F44336"
                icon="/oopsie.svg"
                data={oopsiesData}
                layout="horizontal"
              />
              {tokensData.length === 0 && withdrawalsData.length === 0 && oopsiesData.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No data available for the selected student and time period.</p>
                </div>
              )}
            </div>
          )}

          {loading && studentId && (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-500">Loading time period data...</div>
            </div>
          )}
        </div>
        <Ranks />
      </div>
    </div>
  );
};

export default AllCharts;