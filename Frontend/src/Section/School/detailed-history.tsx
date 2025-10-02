import { getHistoryByTime, getStudents } from "@/api";
import { FormType } from '@/lib/types';
import { useEffect, useState, useCallback } from "react";
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

// Helper function to format data by period
const formatDataByPeriod = (responseData: any, period: string, timezone: string) => {
    const periodDays: Record<string, number> = {
        '1W': 7,
        '1M': 30,
        '3M': 90,
        '6M': 180,
        '1Y': 365
    };
    // Filter data for student if needed
    
    const days = periodDays[period];
    if (!days) {
        console.error('Invalid period:', period);
        return [];
    }

    // Parse timezone offset
    const offsetMatch = timezone.match(/UTC([+-]?\d+)/);
    const offsetHours = offsetMatch ? parseInt(offsetMatch[1], 10) : 0;

    // Get current date in target timezone
    const now = new Date();
    const targetDate = new Date(now.getTime() + (offsetHours * 60 * 60 * 1000));

    // Generate date range
    const data = Array.from({length: days}, (_, dayIndex) => {
        const date = new Date(targetDate);
        date.setDate(date.getDate() - (days - 1 - dayIndex));
        return {
            day: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
            points: 0
        };
    });

    // Merge actual data points
    responseData.forEach((dayData: any) => {
        const dayIndex = data.findIndex((day: any) => day.day === dayData.day);
        if (dayIndex !== -1) {
            data[dayIndex].points += Number(dayData.points);
        }
    });

   

    return data;
};

// Helper function to get form metadata
const getFormMetadata = (formType: string | null) => {
    switch(formType) {
        case FormType.AwardPoints: 
            return {title: 'Tokens', barColor: '#4CAF50', icon: '/etoken.svg'};
        case FormType.DeductPoints: 
            return {title: 'Oopsies', barColor: '#F44336', icon: "/oopsie.svg"};
        case FormType.PointWithdraw: 
            return {title: 'Withdrawals', barColor: '#3d59f5', icon: "/Withdraw.svg"};
        default: 
            return {title: 'Points', barColor: '#4CAF50', icon: '/etoken.svg'};
    }
};

const DetailedHistory = () => {
    const [searchParams] = useSearchParams();
    const [period, setPeriod] = useState<string>('1W');
    const [data, setData] = useState<any[]>([]);
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [metadata, setMetadata] = useState<any>({});
    const [students, setStudents] = useState<any[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
    const [isPopOverOpen, setIsPopOverOpen] = useState(false);
    const [studentId, setStudentId] = useState<string>("");
    const [studentName, setStudentName] = useState<string>("");
    const [loading, setLoading] = useState(false);

    // Fetch students on component mount
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                
                const resTeacher = await getStudents(token);
                setStudents(resTeacher.students || []);
                setFilteredStudents(resTeacher.students || []);
            } catch (error) {
                console.error('Error fetching students:', error);
                setStudents([]);
                setFilteredStudents([]);
            }
        };
        fetchStudents();
    }, []);

    // Set metadata based on form type
    useEffect(() => {
        const formType = searchParams.get('formType');
        setMetadata(getFormMetadata(formType));
    }, [searchParams]);

    // Fetch data function
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const formType = searchParams.get('formType');

            let res;
            let combinedHistory: any[] = [];
            let combinedData: any[] = [];

            // Handle AwardPoints by including both regular and IEP award points
            if (formType === FormType.AwardPoints) {
                const requestData = {
                    period,
                    studentId: studentId || undefined
                };

                const [awardBasicRes, awardIEPRes] = await Promise.all([
                    getHistoryByTime({ ...requestData, formType: FormType.AwardPoints }),
                    getHistoryByTime({ ...requestData, formType: FormType.AwardPointsIEP })
                ]);

                // Combine both award types
                combinedHistory = [
                    ...(awardBasicRes?.history || []),
                    ...(awardIEPRes?.history || [])
                ];

                combinedData = [
                    ...(awardBasicRes?.data || []),
                    ...(awardIEPRes?.data || [])
                ];

                // Use the first response for metadata (timezone, etc.)
                res = awardBasicRes || awardIEPRes || {};
                res.history = combinedHistory;
                res.data = combinedData;
            } else {
                // For other form types, use the original API
                const requestData = {
                    formType,
                    period,
                    studentId: studentId || undefined
                };

                res = await getHistoryByTime(requestData);
            }

            if (!res) {
                setData([]);
                setHistoryData([]);
                return;
            }

            setHistoryData(res.history || []);

            // Format data using the helper function
            const formattedData = formatDataByPeriod(
                res.data || [],
                period,
                res.timeZone || 'UTC+0'
            );


            // Apply absolute values to points
            const finalData = formattedData.map((d: any) => ({
                ...d, 
                points: Math.abs(d.points)
            }));

            setData(finalData);
        } catch (error: any) {
            console.error('=== ERROR FETCHING DETAILED HISTORY ===');
            console.error('Error:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            const requestDataForLog = {
                formType: searchParams.get('formType'),
                period,
                studentId: studentId || undefined
            };
            console.error('Request that failed:', requestDataForLog);

            if (error.response?.status === 403) {
                console.error('Access denied error details:', error.response.data);
            }

            setData([]);
            setHistoryData([]);
        } finally {
            setLoading(false);
        }
    }, [searchParams, period, studentId]);

    // Fetch data when dependencies change
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle student selection
    const handleStudentSelect = (student: any) => {
        setStudentId(student._id);
        setStudentName(student.name);
        setIsPopOverOpen(false);
    };

    // Handle student clear
    const handleStudentClear = () => {
        setStudentId("");
        setStudentName("");
        setFilteredStudents(students);
    };

    // Handle student search
    const handleStudentSearch = (searchValue: string) => {
        if (searchValue === "") {
            setFilteredStudents(students);
        } else {
            setFilteredStudents(
                students.filter((s: any) =>
                    s.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
                    s.grade?.toLowerCase().includes(searchValue.toLowerCase())
                )
            );
        }
    };

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
                                    disabled={loading}
                                >
                                    {studentName || "Select student..."}
                                </Button>
                            </PopoverTrigger>
                            {studentName && (
                                <X
                                    onClick={handleStudentClear}
                                    className="ml-2 h-4 w-4 shrink-0 opacity-50 cursor-pointer hover:opacity-100"
                                />
                            )}
                        </div>
                        <PopoverContent className="w-[600px] p-0 flex flex-col space-y-0">
                            <Input
                                onChange={(e) => handleStudentSearch(e.target.value)}
                                className="w-full"
                                placeholder="Search students..."
                            />
                            <div className="max-h-60 overflow-y-auto">
                                {filteredStudents.map((s: any) => (
                                    <Button
                                        onClick={() => handleStudentSelect(s)}
                                        key={s._id}
                                        className="justify-start w-full"
                                        variant="ghost"
                                    >
                                        {s.name} {s.grade && `(${s.grade})`}
                                    </Button>
                                ))}
                                {filteredStudents.length === 0 && (
                                    <div className="p-4 text-center text-gray-500">
                                        No students found
                                    </div>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                ) : (
                    <div className="text-gray-500">No students available</div>
                )}

                {/* Period Selector */}
                <div className='flex space-x-4'>
                    {periods.map((p, index) => (
                        <button
                            key={index}
                            onClick={() => setPeriod(p.label)}
                            disabled={loading}
                            className={`flex-1 px-4 py-4 text-xl transition-colors ${
                                period === p.label 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                            } rounded-md disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {p.value}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-8">
                    <div className="text-gray-500">Loading...</div>
                </div>
            ) : (
                <>
                    <PointsBarChart {...metadata} layout="horizontal" data={data} />
                    {historyData.length > 0 ? (
                        <ViewPointHistoryByData data={historyData} />
                    ) : (
                        <h1 className="text-center py-8 text-gray-500">No History Found</h1>
                    )}
                </>
            )}
        </div>
    )
}

export default DetailedHistory