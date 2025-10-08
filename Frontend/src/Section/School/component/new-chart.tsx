import { getHistoryOfYear, getHistoryOfYearByStudent } from '@/api';
import { FormType } from '@/lib/types';
import { useEffect, useState } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Months in the US educational year
const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

const generateData = async (month: string | null = null, studentId: string | null = null) => {
  let data: any[] = [];
  try {
    let res = studentId !== "" && studentId !== null ? await getHistoryOfYearByStudent(studentId) : await getHistoryOfYear();

    
    if (!month) {


      data = months.map(monthName => ({
        month: monthName,
        withdrawals: 0,
        tokens: 0,
        oopsies: 0,
        yellowTrend: 0,
        blueTrend: 0,
        redTrend: 0
      }));
      // Monthly aggregated data
      res.data.forEach((monthData: any) => {
        const index = months.indexOf(monthData.month);
        data[index] = {
          month: monthData.month,
          withdrawals: Math.round(Math.abs(monthData.avgWithdrawPoints)),
          tokens: Math.round(monthData.avgAwardedPoints),
          oopsies: Math.round(monthData.avgDeductedPoints),
          yellowTrend: Math.round(Math.abs(monthData.avgWithdrawPoints)),
          blueTrend: Math.round(monthData.avgAwardedPoints),
          redTrend: Math.round(monthData.avgDeductedPoints)
        }
      })
    } else {
      const daysInMonth = month === 'Feb' ? 28 :
        ['Apr', 'Nov'].includes(month) ? 30 : 31;

      data = Array.from({ length: daysInMonth }, (_, dayIndex) => ({
        day: dayIndex + 1,
        withdrawals: 0,
        tokens: 0,
        oopsies: 0,
        yellowTrend: 0,
        blueTrend: 0,
        redTrend: 0
      }));
      // Daily data for the selected month
      const monthData = res.data.find((monthData: any) => monthData.month === month);
      let formattedDayData = data
      formattedDayData = formattedDayData.map((dayData: any) => {
        return {
          day: dayData.day,
          awardPoints: 0,
          deductPoints: 0,
          withdrawPoints: 0
        }
      })

      if (monthData && monthData.days) {
        monthData.days.forEach((dayData: any) => {
          const dayIndex = dayData.day - 1;
          switch (dayData.formType) {
            case FormType.AwardPointsIEP: formattedDayData[dayIndex] = {
              ...formattedDayData[dayIndex],
              day: dayData.day,
              awardPoints: formattedDayData[dayIndex].awardPoints + Number(dayData.points),
            }
              break;
            case FormType.DeductPoints: formattedDayData[dayIndex] = {
              ...formattedDayData[dayIndex],
              day: dayData.day,
              deductPoints: formattedDayData[dayIndex].deductPoints + Number(dayData.points),
            }
              break;
            case FormType.PointWithdraw: formattedDayData[dayIndex] = {
              ...formattedDayData[dayIndex],
              day: dayData.day,
              withdrawPoints: formattedDayData[dayIndex].withdrawPoints + Number(dayData.points),
            }
          }
        })
      }

      data = formattedDayData.map((dayData: any) => {
        return {
          day: dayData.day,
          oopsies: Math.abs(dayData.deductPoints),
          tokens: dayData.awardPoints,
          withdrawals: Math.abs(dayData.withdrawPoints),
          yellowTrend: Math.abs(dayData.withdrawPoints),
          blueTrend: dayData.awardPoints,
          redTrend: Math.abs(dayData.deductPoints)
        }
      })
    }

    console.log('my data', data);
  } catch (e) {
    console.log(e);
  } finally {
    return data;
  }
}

const EducationYearChart = ({ studentId, slimLines }: {
  studentId: string,
  slimLines?: boolean
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);


  // Get data based on selected month


  useEffect(() => {
    const fetchData = async () => {
      const data = await generateData(selectedMonth, studentId);
      setChartData(data);
    }

    fetchData();
  }, [selectedMonth, studentId])


  return (
    <div className="w-full">
      <div className="flex flex-wrap justify-center mb-4 mr-12">
        <button
          onClick={() => setSelectedMonth(null)}
          className={`m-1 px-3 py-1 rounded text-sm ${selectedMonth === null ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          All Year
        </button>
        {months.map(month => (
          <button
            key={month}
            onClick={() => setSelectedMonth(month)}
            className={`m-1 px-3 py-1 text-sm rounded ${selectedMonth === month ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            {month}
          </button>
        ))}
      </div>

      <div id="graph" className="w-full h-[450px] ">
        <ResponsiveContainer width="100%" height="100%"   >
          <ComposedChart
            data={chartData}
            margin={{
              top: 20,
              right: 80,
              left: -10,
              bottom: 70,
            }}

          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={selectedMonth ? "day" : "month"}
              label={{ value: selectedMonth ? `${selectedMonth}` : `${new Date().getFullYear()}`, position: 'insideBottom', offset: -5, fontSize: 16 }}

            />
            <YAxis />
            <Tooltip />
            <Legend
              orientation="horizontal"
              verticalAlign="top"
              align="center"
            />

            {/* Bars */}
            <Bar dataKey="withdrawals" fill="#3d59f5" name="Withdrawals" barSize={20} />
            <Bar dataKey="tokens" fill="#4CAF50" name="Total tokens" barSize={20} />
            <Bar dataKey="oopsies" fill="#F44336" name="Oopsies" barSize={20} />

            {/* Trend Lines */}
            <Line
              type="monotone"
              dataKey="yellowTrend"
              stroke="#3d59f5"
              name="Withdraw Trend"
              dot={false}
              legendType='none'
              tooltipType='none'
              strokeWidth={!!slimLines ? 2 : 4}
              className='opacity-40'
            />
            <Line
              type="monotone"
              tooltipType='none'
              dataKey="blueTrend"
              stroke="#4CAF50"
              name="Token Trend"
              dot={false}
              legendType='none'
              strokeWidth={!!slimLines ? 2 : 4}
              className='opacity-40'
            />
            <Line
              type="monotone"
              dataKey="redTrend"
              tooltipType='none'
              stroke="#B22222"
              name="Red Trend"
              dot={false}
              legendType='none'
              strokeWidth={!!slimLines ? 2 : 4}
              className='opacity-35'
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EducationYearChart;