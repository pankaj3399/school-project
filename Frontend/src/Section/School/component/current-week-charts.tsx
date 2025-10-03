import React, { useEffect, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {getHistoryByTime } from "@/api";
import { FormType } from '@/lib/types';
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

    const fetchData = useCallback(async () => {
            // Initialize empty data arrays - we'll populate them based on what the API returns
            let awardWeekData: any[] = [];
            let deductWeekData: any[] = [];
            let withdrawWeekData: any[] = [];

            // Fetch data for each point type
            try {
                let awardRes, deductRes, withdrawRes;


                if(studentId === "" || !studentId){
                    [awardRes, deductRes, withdrawRes] = await Promise.all([
                        getHistoryByTime({formType: FormType.AwardPoints, period: '1W'}),
                        getHistoryByTime({formType: FormType.DeductPoints, period: '1W'}),
                        getHistoryByTime({formType: FormType.PointWithdraw, period: '1W'})
                    ]);
                } else {
                    [awardRes, deductRes, withdrawRes] = await Promise.all([
                        getHistoryByTime({formType: FormType.AwardPoints, period: '1W', studentId}),
                        getHistoryByTime({formType: FormType.DeductPoints, period: '1W', studentId}),
                        getHistoryByTime({formType: FormType.PointWithdraw, period: '1W', studentId})
                    ]);
                }
                

                // Create a full week structure and populate with API data
                const createFullWeekData = (apiData: any[]) => {
                    console.log('=== createFullWeekData DEBUG ===');
                    console.log('API Data received:', apiData);

                    // Create a map of API data by date for quick lookup
                    const apiDataMap = new Map();
                    apiData.forEach((dayData: any) => {
                        const dateKey = dayData.day || dayData.date;
                        apiDataMap.set(dateKey, Math.abs(Number(dayData.points)));
                        console.log(`Mapped ${dateKey} -> ${Math.abs(Number(dayData.points))}`);
                    });

                    // Extract dates from API data or create last 7 days
                    let weekData = [];

                    if (apiData.length > 0 && apiData[0].date) {
                        // Use dates directly from API response
                        weekData = apiData.map((dayData: any) => {
                            const dateString = dayData.date;
                            const date = new Date(dateString + 'T00:00:00Z'); // Parse as UTC
                            const dayName = date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });

                            return {
                                day: dayName,
                                date: dateString,
                                points: Math.abs(Number(dayData.points))
                            };
                        });
                        console.log('Using API dates directly:', weekData);
                    } else {
                        // Fallback: Create 7 days for the last 7 days using UTC
                        const today = new Date();

                        for (let i = 6; i >= 0; i--) {
                            const date = new Date(today);
                            date.setUTCDate(today.getUTCDate() - i);
                            // Use UTC methods to avoid timezone shifting
                            const year = date.getUTCFullYear();
                            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                            const day = String(date.getUTCDate()).padStart(2, '0');
                            const dateString = `${year}-${month}-${day}`;
                            const dayName = date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });

                            weekData.push({
                                day: dayName,
                                date: dateString,
                                points: apiDataMap.get(dateString) || 0
                            });
                        }
                        console.log('Using fallback 7-day range:', weekData);
                    }

                    return weekData;
                };

                // Convert API responses to full week chart data
                awardWeekData = createFullWeekData(awardRes?.data || awardRes?.history || []);
                deductWeekData = createFullWeekData(deductRes?.data || deductRes?.history || []);
                withdrawWeekData = createFullWeekData(withdrawRes?.data || withdrawRes?.history || []);

                // Update state (points are already processed as absolute values)
                setCurrentAwardWeekData(awardWeekData);
                setCurrentDeductWeekData(deductWeekData);
                setCurrentWithdrawWeekData(withdrawWeekData);
            } catch (error) {
                console.error("Error fetching week data:", error);
            }
        }, [studentId, isTeacher]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
            data={data} // Show all 7 days (last 6 days + today)
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
                navigateToDetails(FormType.AwardPoints);
                break;
              case "Withdrawals":
                navigateToDetails(FormType.PointWithdraw);
                break;
              case "Oopsies":
                navigateToDetails(FormType.DeductPoints);
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
        <div className="p-4" key={`current-week-charts-${studentId}-${isTeacher}`}>
            <PointsBarChart
                key={`tokens-${studentId}`}
                icon='/etoken.svg'
                data={currentAwardWeekData}
                title="Tokens"
                barColor="#4CAF50" // Green
            />
            <PointsBarChart
                key={`withdrawals-${studentId}`}
                icon='/Withdraw.svg'
                data={currentWithdrawWeekData}
                title="Withdrawals"
                barColor="#3d59f5" // blue
            />
            <PointsBarChart
                key={`oopsies-${studentId}`}
                icon='/oopsie.svg'
                data={currentDeductWeekData}
                title="Oopsies"
                barColor="#F44336" // Red
            />
        </div>
    );
};

export default React.memo(CurrentWeekCharts);