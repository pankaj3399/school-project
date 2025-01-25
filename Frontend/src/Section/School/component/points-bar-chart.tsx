import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const PointsBarChart = ({ 
    data, 
    title, 
    icon,
    barColor ,
    layout
}: { 
    data: any[], 
    title: string, 
    barColor: string ,
    icon: string,
    layout: 'vertical' | 'horizontal'
}) => {
    const [showData, setShowData] = useState(data);
    const [ticks, setTicks] = useState<string[]>([]);
    useEffect(() => {
        setShowData(data);
        setTicks(data.map((value) => {
            if (data.length > 31) {
                const date = new Date(value.day);
                if (date.getDate() === 1) {
                    return date.toLocaleString('default', { month: 'short' });
                }
                return ''; 
            }

            if(data.length > 8){
                return value.day.split('-')[2];
            }

            return new Date(value.day).toLocaleString('default', { weekday: 'short' }); 
        }));
    }, [data]);
    return (
    <div className="w-full grid grid-cols-8 place-items-center border-2 py-5 rounded-lg h-[400px] mb-6 mt-10">
        <h2 className="text-nowrap col-span-1 px-4 flex flex-col items-center font-bold text-center mb-4">
        <img src={icon} />
            {title}
        </h2>
        
        <ResponsiveContainer className={"col-span-8"} width="100%" height="100%">
            <BarChart
                data={showData}
                margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
                layout={layout}  
            >
                <XAxis 
    dataKey="day" 
    axisLine={false} 
    tickLine={false} 
    fontSize={16}
    tickFormatter={(_, i)=>{
        console.log(ticks[i]);
        
        return ticks[i]
    }}
/>
                <YAxis axisLine={false} tickLine={false}  />
                <Tooltip />
                <Bar dataKey="points" fill={barColor} background={{ fill: '#f5f5f5' }}  label={
                {
                  position: "insideBottom",
                  fill: "#0f0f0f",
                  fontSize: 10,
                  offset: 10,
                  formatter: (value:any) => value === 0 || data.length > 31 ? '' : value
                } 
              }  />
            </BarChart>
        </ResponsiveContainer>
    </div>)
};


export default PointsBarChart;
