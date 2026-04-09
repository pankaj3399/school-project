import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Building2,
    School,
    Users,
    GraduationCap,
    Map,
    AlertCircle,
    Globe
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { getSystemDashboardStats, getStateAnalytics, getDistrictAnalytics } from '@/api';
import { useAuth } from '@/authContext';
import { getAuthToken } from '@/lib/auth';

type StateAnalyticsRow = {
    state: string;
    districtCount: number;
    activeDistrictCount: number;
    schoolCount: number;
};

type DistrictAnalyticsRow = {
    districtId: string;
    name: string;
    code: string;
    state: string;
    schoolCount: number;
    teacherCount: number;
    studentCount: number;
    totalTokens: number;
    withdrawals: number;
    oopsies: number;
    feedbacks: number;
};

type ChartDataRow = {
    year: string;
    month: number;
    states: number;
    districts: number;
    schools: number;
    teachers: number;
    students: number;
    tokens: number;
    oopsies: number;
    withdrawals: number;
};

interface VisibleBars {
    states: boolean;
    districts: boolean;
    schools: boolean;
    teachers: boolean;
    students: boolean;
    tokens: boolean;
    oopsies: boolean;
    withdrawals: boolean;
}

type SchoolStatRow = {
    _id: string;
    name: string;
    teacherCount: number;
    studentCount: number;
    totalTokens: number;
};

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const getAcademicYear = (item: { year: string, month: number }) => {
    const yearNum = parseInt(item.year);
    if (item.month >= 8) {
        return `${yearNum}-${yearNum + 1}`;
    }
    return `${yearNum - 1}-${yearNum}`;
};

export default function SystemAdminDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stateAnalytics, setStateAnalytics] = useState<StateAnalyticsRow[]>([]);
    const [districtAnalytics, setDistrictAnalytics] = useState<DistrictAnalyticsRow[]>([]);
    const [districtError, setDistrictError] = useState<string | null>(null);
    const [chartData, setChartData] = useState<ChartDataRow[]>([]);
    const [schoolStats, setSchoolStats] = useState<SchoolStatRow[]>([]);

    // Chart Filters
    const [selectedYear, setSelectedYear] = useState<string>('All Year');
    const [selectedMonth, setSelectedMonth] = useState<number | 'All'>( 'All');
    const [visibleBars, setVisibleBars] = useState<VisibleBars>({
        states: true,
        districts: true,
        schools: true,
        teachers: true,
        students: true,
        tokens: false,
        oopsies: false,
        withdrawals: false
    });

    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;
            try {
                const token = getAuthToken(user);
                if (token) {
                    const [dash, geo, distComp] = await Promise.all([
                        getSystemDashboardStats(token),
                        getStateAnalytics(token),
                        getDistrictAnalytics(token),
                    ]);
                    if (dash.stats) {
                        setStats(dash.stats);
                        setChartData(Array.isArray(dash.chartData) ? dash.chartData : []);
                        setSchoolStats(Array.isArray(dash.schoolStats) ? dash.schoolStats : []);
                    } else if (dash.error) {
                        setError("Failed to load dashboard metrics");
                    }
                    if (Array.isArray(geo.stateAnalytics)) {
                        setStateAnalytics(geo.stateAnalytics);
                    } else {
                        setStateAnalytics([]);
                    }
                    if (Array.isArray(distComp.districtStats)) {
                        setDistrictAnalytics(distComp.districtStats);
                        setDistrictError(null);
                    } else if (distComp.error) {
                        setDistrictAnalytics([]);
                        setDistrictError(typeof distComp.error === 'string' ? distComp.error : 'Could not load district analytics');
                    } else {
                        setDistrictAnalytics([]);
                        setDistrictError('Could not load district analytics');
                    }
                }
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
                setError("Network error occurred while fetching stats");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user]);

    const cards = [
        {
            title: "Total countries",
            value: stats?.totalCountries || 0,
            icon: Globe,
            color: "text-orange-500",
            subLabel: "Total Teachers",
            shortLabel: "Teachers",
            subValue: stats?.totalTeachers || 0
        },
        {
            title: "Total states",
            value: stats?.totalStates || 0,
            icon: Map,
            color: "text-blue-500",
            subLabel: "Total Students",
            shortLabel: "Students",
            subValue: stats?.totalStudents || 0
        },
        {
            title: "Total Districts",
            value: stats?.totalDistricts || 0,
            icon: Building2,
            color: "text-amber-500",
            subLabel: "Total Tokens",
            shortLabel: "Tokens",
            subValue: stats?.totalTokensEarned || 0
        },
        {
            title: "Total Schools",
            value: stats?.totalSchools || 0,
            icon: School,
            color: "text-indigo-500",
            subLabel: "Total Feedbacks",
            shortLabel: "Feedbacks",
            subValue: stats?.totalFeedbacks || 0
        },
        {
            title: "Total teachers",
            value: stats?.totalTeachers || 0,
            icon: Users,
            color: "text-green-500",
            subLabel: "Total Oopsies",
            shortLabel: "Oopsies",
            subValue: stats?.totalOopsies || 0
        },
        {
            title: "Total students",
            value: stats?.totalStudents || 0,
            icon: GraduationCap,
            color: "text-red-500",
            subLabel: "Total Withdrawals",
            shortLabel: "Withdrawals",
            subValue: stats?.totalWithdrawals || 0
        }
    ];

    // Chart processing
    const filteredChartData = useMemo(() => {
        let list = [...chartData];
        if (selectedYear !== 'All Year') {
            list = list.filter(item => getAcademicYear(item) === selectedYear);
        }
        if (selectedMonth !== 'All') {
            list = list.filter(item => item.month === selectedMonth);
        }

        // Academic Year Ordering (Aug to Jul)
        const academicOrder = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7];
        
        return list.sort((a, b) => {
            const ayA = getAcademicYear(a);
            const ayB = getAcademicYear(b);
            
            if (ayA !== ayB) return ayA.localeCompare(ayB);
            
            return academicOrder.indexOf(a.month) - academicOrder.indexOf(b.month);
        }).map(item => ({
            ...item,
            monthName: selectedYear === 'All Year' ? `${monthNames[item.month - 1]} ${item.year}` : monthNames[item.month - 1],
            academicYear: getAcademicYear(item)
        }));
    }, [chartData, selectedYear, selectedMonth]);

    const availableYears = useMemo(() => {
        const years = new Set<string>();
        chartData.forEach(item => years.add(getAcademicYear(item)));
        return Array.from(years).sort().reverse();
    }, [chartData]);

    // Box Rankings Prep
    const topStatesByDistricts = useMemo(() => {
        return [...stateAnalytics].sort((a, b) => b.activeDistrictCount - a.activeDistrictCount).slice(0, 3);
    }, [stateAnalytics]);

    const topDistrictsBySchools = useMemo(() => {
        return [...districtAnalytics].sort((a, b) => b.schoolCount - a.schoolCount).slice(0, 3);
    }, [districtAnalytics]);

    const topSchoolsByTeachers = useMemo(() => {
        return [...schoolStats].sort((a, b) => b.teacherCount - a.teacherCount).slice(0, 5);
    }, [schoolStats]);

    const topSchoolsByStudents = useMemo(() => {
        return [...schoolStats].sort((a, b) => b.studentCount - a.studentCount).slice(0, 5);
    }, [schoolStats]);

    const topSchoolsByTokens = useMemo(() => {
        return [...schoolStats].sort((a, b) => b.totalTokens - a.totalTokens).slice(0, 5);
    }, [schoolStats]);


    interface RankBoxProps<T> {
        title: string;
        data: T[];
        labelKey: keyof T;
        valueKey: keyof T;
        labelSuffix?: string;
    }

    function RankBox<T extends Record<string, any>>({ title, data, labelKey, valueKey, labelSuffix = "" }: RankBoxProps<T>) {
        return (
            <Card className="border-0 shadow-sm ring-1 ring-gray-100 flex-1">
                <CardHeader className="py-4">
                    <CardTitle className="text-sm font-semibold">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {data.length === 0 ? <p className="text-xs text-gray-400">No data available</p> : null}
                        {data.map((item, i) => {
                            const val = Number(item[valueKey]) || 0;
                            const maxValue = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);
                            const pct = (val / maxValue) * 100;
                            return (
                                <div key={i} className="flex flex-col gap-1 text-xs">
                                    <div className="flex justify-between items-center text-gray-700 font-medium">
                                        <span className="truncate pr-2">{String(item[labelKey]) || "Unknown"}</span>
                                        <span>{val} {labelSuffix}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div className="bg-[#00a58c] h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Dark Header Strip representing top UI */}
            <div className="bg-[#5B4365] text-white">
                <div className="max-w-7xl mx-auto px-8 py-3 flex justify-between items-center">
                    <div className="text-sm">
                        <h2 className="font-bold text-xl uppercase tracking-wider mb-1">System Overview</h2>
                        <p className="text-gray-300 text-xs">Totals, rankings, and historical growth for states, districts and schools</p>
                    </div>
                </div>
            </div>

            <div className="p-8 max-w-7xl mx-auto space-y-8">
                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl flex items-center gap-3">
                        <AlertCircle className="h-5 w-5" />
                        {error}
                    </div>
                )}

                {/* Stats Grid top header */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {cards.map((card, index) => (
                        <Card key={index} className="border-0 shadow-sm ring-1 ring-gray-100 flex flex-col items-center justify-between p-4 text-center min-h-[160px] bg-white">
                            <h4 className={`text-[10px] font-bold uppercase mb-1 tracking-wider ${card.color}`}>{card.title}</h4>
                            <span className="text-gray-400 text-[10px] mb-2 font-medium italic">{card.subLabel}</span>
                            <div className="flex flex-col items-center flex-1 justify-center">
                                <div className={'text-gray-900 text-3xl font-black'}>
                                    {loading ? "..." : (card.value || 0).toLocaleString()}
                                </div>
                            </div>
                            <div className="mt-3 text-[10px] font-bold text-gray-500 border-t pt-2 w-full">
                                {card.shortLabel}: {loading ? "..." : (card.subValue || 0).toLocaleString()}
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Main Middle Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Rank Boxes */}
                    <div className="lg:col-span-3 space-y-4 flex flex-col">
                        <RankBox 
                            title="Top 3 States (By Active Districts)" 
                            data={topStatesByDistricts} 
                            labelKey="state" 
                            valueKey="activeDistrictCount" 
                        />
                        <RankBox 
                            title="Top Districts (By Active Schools)" 
                            data={topDistrictsBySchools} 
                            labelKey="name" 
                            valueKey="schoolCount" 
                        />
                    </div>

                    {/* Chart Center */}
                    <Card className="lg:col-span-6 border-0 shadow-sm ring-1 ring-gray-100">
                        <CardHeader className="flex flex-col items-center pb-2">
                                <div className="flex flex-col items-center gap-4 w-full">
                                    <div className="flex gap-2 text-[10px] flex-wrap justify-center border-b pb-4 w-full">
                                        <button
                                            onClick={() => setSelectedYear('All Year')}
                                            className={`px-3 py-1 rounded-full font-bold transition-all ${selectedYear === 'All Year' ? 'bg-[#00a58c] text-white shadow-sm scale-105' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                        >
                                            All Year
                                        </button>
                                        {availableYears.map(year => (
                                            <button
                                                key={year}
                                                onClick={() => setSelectedYear(year)}
                                                className={`px-3 py-1 rounded-full font-bold transition-all ${selectedYear === year ? 'bg-[#00a58c] text-white shadow-sm scale-105' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                            >
                                                {year}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex gap-1.5 text-[9px] flex-wrap justify-center w-full">
                                        <button
                                            onClick={() => setSelectedMonth('All')}
                                            className={`px-2 py-0.5 rounded-md font-bold transition-all ${selectedMonth === 'All' ? 'bg-[#00a58c] text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                                        >
                                            All Months
                                        </button>
                                        {[8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7].map(m => (
                                            <button
                                                key={m}
                                                onClick={() => setSelectedMonth(m)}
                                                className={`px-2 py-0.5 rounded-md font-bold transition-all ${selectedMonth === m ? 'bg-[#00a58c] text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                                            >
                                                {monthNames[m - 1]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Checkboxes */}
                                <div className="grid grid-cols-4 gap-x-2 gap-y-2 text-[10px] font-bold text-gray-500 mt-4 pt-4 border-t w-full">
                                    {Object.keys(visibleBars).map(key => (
                                        <label key={key} className="flex items-center gap-1.5 cursor-pointer hover:text-gray-800 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={visibleBars[key as keyof VisibleBars]}
                                                onChange={(e) => setVisibleBars({ ...visibleBars, [key]: e.target.checked })}
                                                className="w-3 h-3 accent-[#00a58c] rounded border-gray-300 pointer-events-auto"
                                            />
                                            {key.charAt(0).toUpperCase() + key.slice(1)}
                                        </label>
                                    ))}
                                </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-72 w-full min-h-[300px]">
                                {loading ? (
                                    <div className="h-full flex items-center justify-center text-gray-400">Loading chart...</div>
                                ) : filteredChartData.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-gray-400 border border-dashed rounded bg-gray-50">No data available for selected year.</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={filteredChartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                            <XAxis dataKey="monthName" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                                            <Legend wrapperStyle={{ fontSize: 10, marginTop: 20 }} />
                                            {visibleBars.states && <Bar dataKey="states" name="States" fill="#ec4899" radius={[2, 2, 0, 0]} />}
                                            {visibleBars.districts && <Bar dataKey="districts" name="Districts" fill="#f59e0b" radius={[2, 2, 0, 0]} />}
                                            {visibleBars.schools && <Bar dataKey="schools" name="Schools" fill="#8b5cf6" radius={[2, 2, 0, 0]} />}
                                            {visibleBars.teachers && <Bar dataKey="teachers" name="Teachers" fill="#06b6d4" radius={[2, 2, 0, 0]} />}
                                            {visibleBars.students && <Bar dataKey="students" name="Students" fill="#6366f1" radius={[2, 2, 0, 0]} />}
                                            {visibleBars.tokens && <Bar dataKey="tokens" name="Tokens" fill="#10b981" radius={[2, 2, 0, 0]} />}
                                            {visibleBars.oopsies && <Bar dataKey="oopsies" name="Oopsies" fill="#ef4444" radius={[2, 2, 0, 0]} />}
                                            {visibleBars.withdrawals && <Bar dataKey="withdrawals" name="Withdrawals" fill="#3b82f6" radius={[2, 2, 0, 0]} />}
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                            <p className="text-center text-[10px] text-gray-500 mt-4 italic">The X-Axis views the Aug-Jul (full 12 months) timeline</p>
                        </CardContent>
                    </Card>

                    {/* Right Rank Boxes */}
                    <div className="lg:col-span-3 space-y-4 flex flex-col">
                        <RankBox 
                            title="Schools By Active Teachers" 
                            data={topSchoolsByTeachers} 
                            labelKey="name" 
                            valueKey="teacherCount" 
                        />
                        <RankBox 
                            title="Schools By Active Students" 
                            data={topSchoolsByStudents} 
                            labelKey="name" 
                            valueKey="studentCount" 
                        />
                        <RankBox 
                            title="Schools By Tokens Issued" 
                            data={topSchoolsByTokens} 
                            labelKey="name" 
                            valueKey="totalTokens" 
                        />
                    </div>
                </div>

                {/* District-Level Analytics */}
                <Card className="border-0 shadow-sm ring-1 ring-gray-100">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-gray-500" />
                            District-Level Analytics
                        </CardTitle>
                        <CardDescription>Performance breakdown by district (active districts).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="h-32 flex items-center justify-center text-gray-400">Loading...</div>
                        ) : districtError ? (
                            <div className="h-32 flex items-center justify-center text-center text-sm text-amber-800 bg-amber-50 rounded-lg border border-amber-100 px-4">
                                {districtError}
                            </div>
                        ) : districtAnalytics.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                                No active districts with data yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-gray-500">
                                            <th scope="col" className="pb-3 font-medium">District</th>
                                            <th scope="col" className="pb-3 font-medium">State</th>
                                            <th scope="col" className="pb-3 font-medium text-right">Schools</th>
                                            <th scope="col" className="pb-3 font-medium text-right">Teachers</th>
                                            <th scope="col" className="pb-3 font-medium text-right">Students</th>
                                            <th scope="col" className="pb-3 font-medium text-right">Tokens</th>
                                            <th scope="col" className="pb-3 font-medium text-right">Withdrawals</th>
                                            <th scope="col" className="pb-3 font-medium text-right">Oopsies</th>
                                            <th scope="col" className="pb-3 font-medium text-right">Feedbacks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {districtAnalytics.map((d) => (
                                            <tr
                                                key={d.districtId}
                                                className="border-b last:border-0 hover:bg-gray-50 transition-colors"
                                            >
                                                <td className="py-3 font-medium text-gray-900">
                                                    <Link
                                                        to={`/system-admin/districts/${d.districtId}`}
                                                        className="hover:text-[#00a58c] hover:underline focus:outline-none focus:ring-2 focus:ring-[#00a58c]/30 rounded"
                                                    >
                                                        {d.name}
                                                    </Link>
                                                    <span className="ml-2 text-xs text-gray-400 font-mono">{d.code}</span>
                                                </td>
                                                <td className="py-3 text-gray-600">{d.state || '—'}</td>
                                                <td className="py-3 text-right text-gray-900">{d.schoolCount.toLocaleString()}</td>
                                                <td className="py-3 text-right text-gray-900">{d.teacherCount.toLocaleString()}</td>
                                                <td className="py-3 text-right text-gray-900">{d.studentCount.toLocaleString()}</td>
                                                <td className="py-3 text-right font-semibold text-[#00a58c]">{d.totalTokens.toLocaleString()}</td>
                                                <td className="py-3 text-right font-semibold text-blue-600">{d.withdrawals.toLocaleString()}</td>
                                                <td className="py-3 text-right font-semibold text-red-500">{d.oopsies.toLocaleString()}</td>
                                                <td className="py-3 text-right font-semibold text-amber-600">{d.feedbacks.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );

}
