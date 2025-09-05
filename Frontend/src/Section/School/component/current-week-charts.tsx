import  { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getHistoryOfCurrentWeek, getHistoryOfCurrentWeekByStudent } from "@/api";
import { useNavigate } from 'react-router-dom';

const CurrentWeekCharts = ({studentId, isTeacher}:{
    studentId: string,
    isTeacher?:boolean
}) => {
    const [currentAwardWeekData, setCurrentAwardWeekData] = useState<any[]>([]);
    const [currentDeductWeekData, setCurrentDeductWeekData] = useState<any[]>([]);
    const [currentWithdrawWeekData, setCurrentWithdrawWeekData] = useState<any[]>([]);
    const navigate = useNavigate()

    const navigateToDetails = (formType: string) => {
      if(!!isTeacher){
        navigate(`/teachers/points-history?formType=${formType}`)
      }else{
        navigate(`/school/points-history?formType=${formType}`)
      }
    }

    useEffect(() => {
        const fetchData = async () => {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

            // Initialize data arrays with zeros
            let awardWeekData = Array.from({length: 7}, (_, dayIndex) => ({
                day: days[dayIndex],
                points: 0,
            }));
            let deductWeekData = Array.from({length: 7}, (_, dayIndex) => ({
                day: days[dayIndex],
                points: 0,
            }));
            let withdrawWeekData = Array.from({length: 7}, (_, dayIndex) => ({
                day: days[dayIndex],
                points: 0,
            }));

            // Fetch data for each point type
            try {
                let awardRes = {data: [], startDate: "", endDate: ""};
                let deductRes = {data: [], startDate: "", endDate: ""};
                let withdrawRes = {data: [], startDate: "", endDate: ""};
                if(studentId === ""){
                    [awardRes, deductRes, withdrawRes] = await Promise.all([
                        getHistoryOfCurrentWeek({formType: 'AwardPoints'}),
                        getHistoryOfCurrentWeek({formType: 'DeductPoints'}),
                        getHistoryOfCurrentWeek({formType: 'PointWithdraw'})
                    ]);
                }else{
                    [awardRes, deductRes, withdrawRes] = await Promise.all([
                        getHistoryOfCurrentWeekByStudent(studentId,{formType: 'AwardPoints'}),
                        getHistoryOfCurrentWeekByStudent(studentId,{formType: 'DeductPoints'}),
                        getHistoryOfCurrentWeekByStudent(studentId,{formType: 'PointWithdraw'})
                    ]);
                }
                

                // Process Award Points
                if(awardRes.data.length > 0){
                    //@ts-ignore
                    
                    awardRes.data.forEach((dayData:any) => {
                        const dayIndex = days.indexOf(dayData.day);
                        // Handle both formats: student-specific data (no date field) and general data (with date field)
                        const shouldInclude = dayData.date ? 
                            (dayIndex !== -1 && new Date(dayData.date) > new Date(awardRes.startDate)) :
                            (dayIndex !== -1);
                        
                        if (shouldInclude) {
                            awardWeekData[dayIndex] = {
                                day: dayData.day,
                                points: awardWeekData[dayIndex].points + Number(dayData.points)
                            };
                        }
                    });

                }

                // Process Deduct Points
                if(deductRes.data.length > 0)
                    deductRes.data.forEach((dayData:any) => {
                        const dayIndex = days.indexOf(dayData.day);
                        // Handle both formats: student-specific data (no date field) and general data (with date field)
                        const shouldInclude = dayData.date ? 
                            (dayIndex !== -1 && new Date(dayData.date) > new Date(deductRes.startDate)) :
                            (dayIndex !== -1);
                            
                        if (shouldInclude) {
                            deductWeekData[dayIndex] = {
                                day: dayData.day,
                                points: deductWeekData[dayIndex].points + Number(dayData.points)
                            };
                        }
                    });

                // Process Withdraw Points
                if(withdrawRes.data.length > 0)
                    withdrawRes.data.forEach((dayData:any) => {
                        const dayIndex = days.indexOf(dayData.day);
                        // Handle both formats: student-specific data (no date field) and general data (with date field)
                        const shouldInclude = dayData.date ? 
                            (dayIndex !== -1 && new Date(dayData.date) > new Date(withdrawRes.startDate)) :
                            (dayIndex !== -1);
                            
                        if (shouldInclude) {
                            withdrawWeekData[dayIndex] = {
                                day: dayData.day,
                                points: withdrawWeekData[dayIndex].points + Number(dayData.points)
                            };
                        }
                    });

                // Update state
                setCurrentAwardWeekData(awardWeekData);
                setCurrentDeductWeekData(deductWeekData.map(d => ({...d, points: Math.abs(d.points)})));
                setCurrentWithdrawWeekData(withdrawWeekData.map(d => ({...d, points: Math.abs(d.points)})));
            } catch (error) {
                console.error("Error fetching week data:", error);
            }
        };

        fetchData();
    }, [studentId]);

    // Chart component to reduce repetition
    const PointsBarChart = ({
      data,
      title,
      barColor,
      icon,
    }: {
      data: any[];
      title: string;
      barColor: string;
      icon: string;
    }) => (
      <div className="w-full grid grid-cols-8 place-items-center border-2 py-5 rounded-lg h-64 mb-6 mt-10">
        <h2 className="text-nowrap col-span-1 px-4 flex flex-col items-center font-bold text-center mb-4">
          <img className='w-44  aspect-square' src={icon} />
          {title}
        </h2>
        <ResponsiveContainer
          className={"col-span-6"}
          width="100%"
          height="100%"
        >
          <BarChart
            data={data.slice(1, 7)} // First 6 days (excluding Sunday)
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <XAxis dataKey="day" axisLine={false} tickLine={false} />
            <YAxis  axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar
              background={{ fill: "#f5f5f5" }}
              dataKey="points"
              fill={barColor}
              label={
                {
                  position: "insideStart",
                  fill: "#0f0f0f",
                  fontSize: 18,
                  offset:12
                } 
              }
            />
          </BarChart>
        </ResponsiveContainer>

        <button
          onClick={() => {
            switch (title) {
              case "Tokens":
                navigateToDetails("AwardPoints");
                break;
              case "Withdrawals":
                navigateToDetails("PointWithdraw");
                break;
              case "Oopsies":
                navigateToDetails("DeductPoints");
                break;
            }
          }}
          className="p-2 rounded-lg text-xs"
          style={{
            backgroundColor: barColor,
            color: "white",
            gridColumn: "span 1",
            cursor: "pointer",
          }}
        >
          More Details
        </button>
      </div>
    );

    return (
        <div className="p-4">
            <PointsBarChart 
                icon='/etoken.svg'
                data={currentAwardWeekData} 
                title="Tokens" 
                barColor="#4CAF50" // Green
            />
            <PointsBarChart 
                icon='/Withdraw.svg'
                data={currentWithdrawWeekData} 
                title="Withdrawals" 
                barColor="#3d59f5" // blue
            />
            <PointsBarChart 
                icon='/oopsie.svg'
                data={currentDeductWeekData} 
                title="Oopsies" 
                barColor="#F44336" // Red
            />
        </div>
    );
};

export default CurrentWeekCharts;