import { getHistoryOfYear } from '@/api';
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
  ResponsiveContainer 
} from 'recharts';



const generateData = async (month: string | null = null) => {
    let data:any[] = [];
    try{
        const res = await getHistoryOfYear();
        if (!month) {
            const months = [
                'Oct', 'Nov', 'Dec', 'Jan', 
                'Feb', 'Mar', 'Apr', 'May'
              ];

              data = months.map(monthName => ({
                month: monthName,
                withdrawals: 0,
                tokens:0,
                oopsies: 0,
                yellowTrend: 0,
                blueTrend:0,
                redTrend: 0
              }));
            // Monthly aggregated data
            res.data.forEach((monthData:any) => {
                const index = months.indexOf(monthData.month);
                data[index] = {
                    month: monthData.month,
                    withdrawals: Math.round(monthData.avgDeductedPoints),
                    tokens: Math.round(monthData.avgAwardedPoints),
                    oopsies: Math.round(monthData.avgDeductedPoints),
                    yellowTrend: Math.round(monthData.avgDeductedPoints),
                    blueTrend: Math.round(monthData.avgAwardedPoints),
                    redTrend: Math.round(monthData.avgDeductedPoints)
                }
            })
        }else{
            const daysInMonth = month === 'Feb' ? 28 : 
                      ['Apr', 'Nov'].includes(month) ? 30 : 31;

            data = Array.from({length: daysInMonth}, (_, dayIndex) => ({
                day: dayIndex + 1,
                withdrawals: 0,
                tokens: 0,
                oopsies: 0,
                yellowTrend: 0,
                blueTrend: 0,
                redTrend: 0
              }));
            // Daily data for the selected month
            const monthData = res.data.find((monthData:any) => monthData.month === month);
            let formattedDayData = data
            formattedDayData = formattedDayData.map((dayData:any) => {
                return {
                    day: dayData.day,
                    awardPoints: 0,
                    deductPoints: 0,
                    withdrawPoints: 0
                }
            })

            monthData.days.forEach((dayData:any) => {
                const dayIndex = dayData.day - 1;
                switch(dayData.formType){
                    case 'AwardPoints': formattedDayData[dayIndex] = {
                        ...formattedDayData[dayIndex],
                        day: dayData.day,
                        awardPoints: formattedDayData[dayIndex].awardPoints + Number(dayData.points),
                    }
                    break;
                    case 'DeductPoints': formattedDayData[dayIndex] = {
                        ...formattedDayData[dayIndex],
                        day: dayData.day,
                        deductPoints: formattedDayData[dayIndex].deductPoints + Number(dayData.points),
                    }
                    break;
                    case 'PointWithdraw': formattedDayData[dayIndex] = {
                        ...formattedDayData[dayIndex],
                        day: dayData.day,
                        withdrawPoints: formattedDayData[dayIndex].withdrawPoints + Number(dayData.points),
                    }
                }
            })

            data = formattedDayData.map((dayData:any) => {
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


        
    }catch(e){
        console.log(e);
    }finally{
        return data;
    }
}

const EducationYearChart = () => {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  // Months in the US educational year
  const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
  
  // Get data based on selected month
  

  useEffect(() => {
    const fetchData = async () => {
        const data = await generateData(selectedMonth);
        setChartData(data);
    }

    fetchData();
  },[selectedMonth])

  return (
    <div className="w-full">
      <div className="flex flex-wrap justify-center mb-4">
        <button 
          onClick={() => setSelectedMonth(null)} 
          className={`m-1 px-3 py-1 rounded ${selectedMonth === null ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          All Year
        </button>
        {months.map(month => (
          <button
            key={month}
            onClick={() => setSelectedMonth(month)}
            className={`m-1 px-3 py-1 rounded ${selectedMonth === month ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            {month}
          </button>
        ))}
      </div>

      <div className="w-full h-[450px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={selectedMonth ? "day" : "month"} 
              label={{ value: selectedMonth ? `Days in ${selectedMonth}` : 'Months', position: 'insideBottom', offset: -10 }}

            />
            <YAxis  />
            <Tooltip />
            <Legend 
    orientation="horizontal" 
    verticalAlign="top" 
    align="center"
/>
            
            {/* Bars */}
            <Bar dataKey="withdrawals" fill="#FFD700" name="Withdrawals" barSize={20} />
            <Bar dataKey="tokens" fill="#1E90FF" name="Total tokens" barSize={20} />
            <Bar dataKey="oopsies" fill="#FF4500" name="Oopsies" barSize={20} />
            
            {/* Trend Lines */}
            <Line 
              type="monotone" 
              dataKey="yellowTrend" 
              stroke="#DAA520" 
              name="Yellow Trend" 
              dot={false}
              legendType='none'
              tooltipType='none'
              />
            <Line 
              type="monotone" 
              tooltipType='none'
              dataKey="blueTrend" 
              stroke="#4169E1" 
              name="Blue Trend" 
              dot={false}
              legendType='none'
              />
            <Line 
              type="monotone" 
              dataKey="redTrend" 
              tooltipType='none'
              stroke="#B22222" 
              name="Red Trend" 
              dot={false}
              legendType='none'
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EducationYearChart;
