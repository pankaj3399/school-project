import { getHistoryByTime, getStudents } from "@/api";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom"
import PointsBarChart from "./component/points-bar-chart";
import ViewPointHistoryByData from "./component/point-history-data";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { Input } from "@/components/ui/input"

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
    const [students, setStudents] = useState<any[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
    const [isPopOverOpen, setIsPopOverOpen] = useState(false);
    const [studentId, setStudentId] = useState<string>("");
    const [studentName, setStudentName] = useState<string>("");

    useEffect(() => {
        const fetchStudents = async () => {
            const token = localStorage.getItem('token');
            const resTeacher = await getStudents(token ?? "");
            setStudents(resTeacher.students);
            setFilteredStudents(resTeacher.students);
        };
        fetchStudents();
    }, []);

    const fetchData = async () => {
        const res = await getHistoryByTime({
            formType: searchParams.get('formType'),
            period: period,
            studentId: studentId || undefined // Add studentId to filter
        });
        
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

            }
            break;
        }

        setData(data.map((d:any) => ({...d, points: Math.abs(d.points)})));
        console.log(period,res.data)
    }

    useEffect(()=>{
        switch(searchParams.get('formType')){
            case 'AwardPoints': setMetadata({title: 'Tokens', barColor: '#4CAF50', icon: '/etoken.svg'}); break;
            case 'DeductPoints': setMetadata({title: 'Oopsies', barColor: '#F44336', icon:"/oopsie.svg"}); break;
            case 'PointWithdraw': setMetadata({title: 'Withdrawals', barColor: '#3d59f5', icon:"/Withdraw.svg"}); break;
        }

        const fetchData = async () => {
            const res = await getHistoryByTime({
                formType: searchParams.get('formType'),
                period: period,
                studentId: studentId || undefined // Add studentId to filter
            });

            console.log("History Data: ",studentId);
            
            
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

                    if(studentId){
                        let filteredData = data.filter((d:any) => d.points !== 0);
                        setData(filteredData);
                    }else{
                        setData(data);
                    }

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

                }
                break;
            }

            setData(data.map((d:any) => ({...d, points: Math.abs(d.points)})));
            console.log(period,res.data)
        }
        fetchData();
    },[searchParams, period, studentId])

  return (
    <div>
        <div className="flex flex-col gap-4 mb-4">
            {/* Student Filter */}
            {Array.isArray(students) && students.length > 0 ? (
                <Popover open={isPopOverOpen} onOpenChange={setIsPopOverOpen}>
                    <div className="flex items-center space-x-2">
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
                        {studentName && (
                            <X
                                onClick={() => {
                                    setStudentId("");
                                    setStudentName("");
                                    setFilteredStudents(students);
                                    fetchData();
                                }}
                                className="ml-2 h-4 w-4 shrink-0 opacity-50 cursor-pointer"
                            />
                        )}
                    </div>
                    <PopoverContent className="w-[600px] p-0 flex flex-col space-y-0">
                        <Input
                            onChange={(e) => {
                                const value = e.target.value;
                                if(value === "") {
                                    setFilteredStudents(students);
                                }else{
                                    setFilteredStudents(
                                        students.filter((s: any) =>
                                            s.name.toLowerCase().includes(value.toLowerCase()) ||
                                            s.grade.toLowerCase().includes(value.toLowerCase())
                                        )
                                    );
                                }
                            }}
                            className="w-full"
                            placeholder="Search students..."
                        />
                        {filteredStudents.map((s: any) => (
                            <Button
                                onClick={() => {
                                    setStudentId(s._id);
                                    setStudentName(s.name);
                                    setIsPopOverOpen(false);
                                }}
                                key={s._id}
                                className="justify-start"
                                variant="ghost"
                            >
                                {s.name} (Grade {s.grade})
                            </Button>
                        ))}
                    </PopoverContent>
                </Popover>
            ) : (
                <div>No students available</div>
            )}

            {/* Period Selector */}
            <div className='flex space-x-4'>
                {periods.map((p, index) => (
                    <button
                        key={index}
                        onClick={() => setPeriod(p.label)}
                        className={`flex-1 px-4 py-4 text-xl ${period === p.label ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-md`}
                    >
                        {p.value}
                    </button>
                ))}
            </div>
        </div>

        <PointsBarChart {...metadata} layout="horizontal" data={data} />
        {historyData.length > 0 ? (
            <ViewPointHistoryByData data={historyData} />
        ) : (
            <h1>No History Found</h1>
        )}
    </div>
  )
}

export default DetailedHistory