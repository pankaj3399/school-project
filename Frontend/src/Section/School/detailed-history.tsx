import { getHistoryByTime } from "@/api";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom"
import PointsBarChart from "./component/points-bar-chart";
import ViewPointHistoryByData from "./component/point-history-data";

const periods = [
    {label: '1W', value: '1 WEEK'},
    {label: '1M', value: '1 MONTH'},
    {label: '3M', value: '3 MONTHS'},
    {label: '6M', value: '6 MONTHS'},
    {label: '1Y', value: '1 YEAR'},
]

const DetailedHistory = () => {
    const [searchParams, _] = useSearchParams();
    const [period, setPeriod] = useState<string>('1W');
    const [data, setData] = useState<any[]>([]);
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [metadata, setMetadata] = useState<any>({});



    useEffect(()=>{
        console.log(searchParams.get('formType'))

        switch(searchParams.get('formType')){
            case 'AwardPoints': setMetadata({title: 'Tokens', barColor: '#4CAF50', icon: '/etoken.svg'}); break;
            case 'DeductPoints': setMetadata({title: 'Oopsies', barColor: '#F44336', icon:"/oopsie.svg"}); break;
            case 'PointWithdraw': setMetadata({title: 'Withdrawals', barColor: '#3d59f5', icon:"/Withdraw.svg"}); break;
        }

        const fetchData = async () => {
            const res = await getHistoryByTime({formType: searchParams.get('formType'), period: period});
            console.log(res);
            
            setHistoryData(res.history)
            let data:any[] = [];
            switch(period){
                case '1W': {
                    data = Array.from({length: 7}, (_, dayIndex) => ({
                        day: new Date(new Date().setDate(new Date().getDate() - dayIndex)).toISOString().split('T')[0],
                        points: 0,
                    })).reverse();
                    
                    res.data.forEach((dayData:any) => {
                        const dayIndex = data.findIndex((day:any) => day.day === dayData.day);
                        if (dayIndex !== -1) {
                            data[dayIndex] = {
                                ...data[dayIndex],
                                points: data[dayIndex].points + Number(dayData.points)
                            };
                        }
                    })

                    setData(data);

                    console.log("Data: ",data);
                    
                }
                break;
                case '1M': {
                    data = Array.from({length: 30}, (_, dayIndex) => ({
                        day: new Date(new Date().setDate(new Date().getDate() - dayIndex)).toISOString().split('T')[0],
                        points: 0,
                    })).reverse();
                    res.data.forEach((dayData:any) => {
                        const dayIndex = data.findIndex((day:any) => day.day === dayData.day);
                        if (dayIndex !== -1) {
                            data[dayIndex] = {
                                ...data[dayIndex],
                                points: data[dayIndex].points + Number(dayData.points)
                            };
                        }
                    })

                    setData(data);

                    console.log("Data: ",data);
                }
                break;
                case '3M': {
                    data = Array.from({length: 90}, (_, dayIndex) => ({
                        day: new Date(new Date().setDate(new Date().getDate() - dayIndex)).toISOString().split('T')[0],
                        points: 0,
                    })).reverse();
                    res.data.forEach((dayData:any) => {
                        const dayIndex = data.findIndex((day:any) => day.day === dayData.day);
                        if (dayIndex !== -1) {
                            data[dayIndex] = {
                                ...data[dayIndex],
                                points: data[dayIndex].points + Number(dayData.points)
                            };
                        }
                    })

                    setData(data);

                    console.log("Data: ",data);
                }
                break;
                case '6M': {
                    data = Array.from({length: 180}, (_, dayIndex) => ({
                        day: new Date(new Date().setDate(new Date().getDate() - dayIndex)).toISOString().split('T')[0],
                        points: 0,
                    })).reverse();
                    res.data.forEach((dayData:any) => {
                        const dayIndex = data.findIndex((day:any) => day.day === dayData.day);
                        if (dayIndex !== -1) {
                            data[dayIndex] = {
                                ...data[dayIndex],
                                points: data[dayIndex].points + Number(dayData.points)
                            };
                        }
                    })

                    setData(data);

                    console.log("Data: ",data);
                }
                break;
                case '1Y': {
                    data = Array.from({length: 365}, (_, dayIndex) => ({
                        day: new Date(new Date().setDate(new Date().getDate() - dayIndex)).toISOString().split('T')[0],
                        points: 0,
                    })).reverse();
                    res.data.forEach((dayData:any) => {
                        const dayIndex = data.findIndex((day:any) => day.day === dayData.day);
                        if (dayIndex !== -1) {
                            data[dayIndex] = {
                                ...data[dayIndex],
                                points: data[dayIndex].points + Number(dayData.points)
                            };
                        }
                    })

                    setData(data);

                    console.log("Data: ",data);
                }
                break;
            }

            setData(data.map((d:any) => ({...d, points: Math.abs(d.points)})));
            console.log(period,res.data)
        }
        fetchData();
    },[searchParams, period])

  return (
    <div>
        <div className='flex mt-4 space-x-4'>
            {periods.map((p, index) => (
            <button key={index} onClick={() => setPeriod(p.label)} className={`flex-1 px-4 py-4 text-xl ${period === p.label ? `bg-blue-500 text-white` : 'bg-gray-200 text-gray-800'} rounded-md`}>{p.value}</button>
            ))}
            
        </div>
        
        <PointsBarChart {...metadata} layout="horizontal" data={data}  />
        {
            historyData.length > 0 ? <ViewPointHistoryByData data={historyData} /> : <h1>No History Found</h1>
        }
    </div>
  )
}

export default DetailedHistory
