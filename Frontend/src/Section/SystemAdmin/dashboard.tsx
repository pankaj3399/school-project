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
};

type SchoolStatRow = {
    _id: string;
    name: string;
    teacherCount: number;
    studentCount: number;
    totalTokens: number;
};

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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
    const [visibleBars, setVisibleBars] = useState({
        states: true,
        districts: true,
        schools: true,
        teachers: true,
        students: true
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
            subValue: stats?.totalTeachers || 0
        },
        {
            title: "Total states",
            value: stats?.totalStates || 0,
            icon: Map,
            color: "text-blue-500",
            subLabel: "Total Students",
            subValue: stats?.totalStudents || 0
        },
        {
            title: "Total Districts",
            value: stats?.totalDistricts || 0,
            icon: Building2,
            color: "text-amber-500",
            subLabel: "Total Tokens",
            subValue: stats?.totalTokensEarned || 0
        },
        {
            title: "Total Schools",
            value: stats?.totalSchools || 0,
            icon: School,
            color: "text-indigo-500",
            subLabel: "Total Feedbacks",
            subValue: stats?.totalFeedbacks || 0
        },
        {
            title: "Total teachers",
            value: stats?.totalTeachers || 0,
            icon: Users,
            color: "text-green-500",
            subLabel: "Total Oopsies",
            subValue: stats?.totalOopsies || 0
        },
        {
            title: "Total students",
            value: stats?.totalStudents || 0,
            icon: GraduationCap,
            color: "text-red-500",
            subLabel: "Total Withdrawals",
            subValue: stats?.totalWithdrawals || 0
        }
    ];

    // Chart processing
    const filteredChartData = useMemo(() => {
        let list = [...chartData];
        if (selectedYear !== 'All Year') {
            list = list.filter(item => item.year === selectedYear);
        }
        return list.map(item => ({
            ...item,
            monthName: selectedYear === 'All Year' ? `${monthNames[item.month - 1]} ${item.year}` : monthNames[item.month - 1]
        }));
    }, [chartData, selectedYear]);

    const availableYears = useMemo(() => {
        const years = new Set<string>();
        chartData.forEach(item => years.add(item.year));
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


    const RankBox = ({ title, data, labelKey, valueKey, labelSuffix = "" }: any) => (
        <Card className="border-0 shadow-sm ring-1 ring-gray-100 flex-1">
            <CardHeader className="py-4">
                <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {data.length === 0 ? <p className="text-xs text-gray-400">No data available</p> : null}
                    {data.map((item: any, i: number) => {
                        const maxValue = Math.max(...data.map((d: any) => d[valueKey] || 0), 1);
                        const pct = ((item[valueKey] || 0) / maxValue) * 100;
                        return (
                            <div key={i} className="flex flex-col gap-1 text-xs">
                                <div className="flex justify-between items-center text-gray-700 font-medium">
                                    <span className="truncate pr-2">{item[labelKey] || "Unknown"}</span>
                                    <span>{item[valueKey] || 0} {labelSuffix}</span>
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

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Dark Header Strip representing top UI */}
            <div className="bg-[#5B4365] text-white">
                <div className="max-w-7xl mx-auto px-8 py-3 flex justify-between items-center">
                    <div className="text-sm">
                        <h2 className="font-bold text-xl uppercase tracking-wider mb-1">SYSTEM OVERVIEW HOME PAGE</h2>
                        <p className="text-gray-300 text-xs">Active Instances (Active States, Active Districts, Active Schools)</p>
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
                        <Card key={index} className="border-0 shadow-sm ring-1 ring-gray-100 flex flex-col items-center justify-between p-4 text-center min-h-[140px]">
                            <h4 className={`text-[10px] font-bold uppercase mb-1 ${card.color}`}>{card.title}</h4>
                            <div className="flex flex-col items-center flex-1 justify-center">
                                <span className="text-gray-400 text-[10px] mb-1 font-medium italic">{card.subLabel}</span>
                                <div className={'bg-gray-50 text-gray-800 px-4 py-2 rounded-lg text-xl font-black shadow-inner'}>
                                    {loading ? "..." : (card.value || 0).toLocaleString()}
                                </div>
                            </div>
                            <div className="mt-2 text-[10px] font-bold text-gray-500 bg-gray-100/50 px-2 py-0.5 rounded-full">
                                {card.subLabel.split(' ')[1]}: {loading ? "..." : (card.subValue || 0).toLocaleString()}
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
                            <div className="flex gap-2 text-xs mb-4 flex-wrap justify-center">
                                <button
                                    onClick={() => setSelectedYear('All Year')}
                                    className={`px-3 py-1 rounded-full font-medium ${selectedYear === 'All Year' ? 'bg-[#00a58c] text-white' : 'bg-gray-100 text-gray-600'}`}
                                >
                                    All Year
                                </button>
                                {availableYears.map(year => (
                                    <button
                                        key={year}
                                        onClick={() => setSelectedYear(year)}
                                        className={`px-3 py-1 rounded-full font-medium ${selectedYear === year ? 'bg-[#00a58c] text-white' : 'bg-gray-100 text-gray-600'}`}
                                    >
                                        {year}
                                    </button>
                                ))}
                            </div>
                            
                            {/* Checkboxes */}
                            <div className="flex gap-4 text-xs font-semibold text-gray-600 mb-2 border-t pt-4 w-full justify-center flex-wrap">
                                {Object.keys(visibleBars).map(key => (
                                    <label key={key} className="flex items-center gap-1 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={(visibleBars as any)[key]}
                                            onChange={(e) => setVisibleBars({ ...visibleBars, [key]: e.target.checked })}
                                            className="w-3 h-3 accent-[#00a58c]"
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
                                            <Legend wrapperStyle={{ fontSize: 12, marginTop: 10 }} />
                                            {visibleBars.states && <Bar dataKey="states" name="States" fill="#3b82f6" radius={[4, 4, 0, 0]} />}
                                            {visibleBars.districts && <Bar dataKey="districts" name="Districts" fill="#f59e0b" radius={[4, 4, 0, 0]} />}
                                            {visibleBars.schools && <Bar dataKey="schools" name="Schools" fill="#10b981" radius={[4, 4, 0, 0]} />}
                                            {visibleBars.teachers && <Bar dataKey="teachers" name="Teachers" fill="#ef4444" radius={[4, 4, 0, 0]} />}
                                            {visibleBars.students && <Bar dataKey="students" name="Students" fill="#8b5cf6" radius={[4, 4, 0, 0]} />}
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                            <p className="text-center text-xs text-gray-500 mt-4 italic">The X-Axis views the full historical timeline</p>
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
                                                <td className="py-3 text-right font-semibold text-blue-600">{d.withdrawals?.toLocaleString() || 0}</td>
                                                <td className="py-3 text-right font-semibold text-red-500">{d.oopsies?.toLocaleString() || 0}</td>
                                                <td className="py-3 text-right font-semibold text-amber-600">{d.feedbacks?.toLocaleString() || 0}</td>
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
