import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Building2,
    School,
    Users,
    GraduationCap,
    Map as MapIcon,
    AlertCircle,
    Globe
} from 'lucide-react';
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
    teacherCount?: number;
    studentCount?: number;
};

type DistrictAnalyticsRow = {
    districtId: string;
    name: string;
    code: string;
    state: string;
    schoolCount: number;
    teacherCount: number;
    studentCount: number;
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

const metricsConfig = {
    states: { label: "States", color: "#ec4899", defaultVisible: true },
    districts: { label: "Districts", color: "#f59e0b", defaultVisible: true },
    schools: { label: "Schools", color: "#8b5cf6", defaultVisible: true },
    teachers: { label: "Teachers", color: "#06b6d4", defaultVisible: true },
    students: { label: "Students", color: "#6366f1", defaultVisible: true },
} as const;

type MetricKey = keyof typeof metricsConfig;
type VisibleBars = Record<MetricKey, boolean>;

type SchoolStatRow = {
    _id: string;
    name: string;
    teacherCount: number;
    studentCount: number;
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
    const [visibleBars, setVisibleBars] = useState<VisibleBars>(() => {
        const initial: Partial<VisibleBars> = {};
        (Object.entries(metricsConfig) as [MetricKey, typeof metricsConfig[MetricKey]][]).forEach(([key, config]) => {
            initial[key] = config.defaultVisible;
        });
        return initial as VisibleBars;
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
            title: "Total Countries",
            value: stats?.totalCountries || 0,
            icon: Globe,
        },
        {
            title: "Total States",
            value: stats?.totalStates || 0,
            icon: MapIcon,
        },
        {
            title: "Total Districts",
            value: stats?.totalDistricts || 0,
            icon: Building2,
        },
        {
            title: "Total Schools",
            value: stats?.totalSchools || 0,
            icon: School,
        },
        {
            title: "Total Teachers",
            value: stats?.totalTeachers || 0,
            icon: Users,
        },
        {
            title: "Total Students",
            value: stats?.totalStudents || 0,
            icon: GraduationCap,
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
            monthName: selectedYear === 'All Year' ? `${monthNames[item.month - 1]} ${getAcademicYear(item)}` : monthNames[item.month - 1],
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
                            const rawLabel = item[labelKey];
                            const trimmed = rawLabel != null ? String(rawLabel).trim() : '';
                            const labelText = trimmed !== '' && trimmed !== 'N/A' ? trimmed : 'Unknown';
                            return (
                                <div key={i} className="flex flex-col gap-1 text-xs">
                                    <div className="flex justify-between items-center text-gray-700 font-medium">
                                        <span className="truncate pr-2">{labelText}</span>
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
                        <h2 className="font-bold text-xl uppercase tracking-wider mb-1">Overview</h2>
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
                    {cards.map((card, index) => {
                        const Icon = card.icon;
                        return (
                            <Card
                                key={index}
                                className="border-2 border-gray-400 rounded-2xl shadow-sm flex flex-col items-center justify-center p-5 text-center bg-white aspect-square"
                            >
                                <Icon className="h-9 w-9 text-gray-700 mb-2" strokeWidth={1.75} />
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">{card.title}</h4>
                                <div className="text-gray-900 text-4xl font-bold">
                                    {loading ? "..." : (card.value || 0).toLocaleString()}
                                </div>
                            </Card>
                        );
                    })}
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
                                            aria-pressed={selectedYear === 'All Year'}
                                            className={`px-3 py-1 rounded-full font-bold transition-all ${selectedYear === 'All Year' ? 'bg-[#00a58c] text-white shadow-sm scale-105' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                        >
                                            All Year
                                        </button>
                                        {availableYears.map(year => (
                                            <button
                                                key={year}
                                                onClick={() => setSelectedYear(year)}
                                                aria-pressed={selectedYear === year}
                                                className={`px-3 py-1 rounded-full font-bold transition-all ${selectedYear === year ? 'bg-[#00a58c] text-white shadow-sm scale-105' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                            >
                                                {year}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex gap-1.5 text-[9px] flex-wrap justify-center w-full">
                                        <button
                                            onClick={() => setSelectedMonth('All')}
                                            aria-pressed={selectedMonth === 'All'}
                                            className={`px-2 py-0.5 rounded-md font-bold transition-all ${selectedMonth === 'All' ? 'bg-[#00a58c] text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                                        >
                                            All Months
                                        </button>
                                        {[8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7].map(m => (
                                            <button
                                                key={m}
                                                onClick={() => setSelectedMonth(m)}
                                                aria-pressed={selectedMonth === m}
                                                className={`px-2 py-0.5 rounded-md font-bold transition-all ${selectedMonth === m ? 'bg-[#00a58c] text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                                            >
                                                {monthNames[m - 1]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Checkboxes */}
                                <div className="grid grid-cols-5 gap-x-2 gap-y-2 text-[10px] font-bold text-gray-500 mt-4 pt-4 border-t w-full">
                                    {(Object.entries(metricsConfig) as [MetricKey, typeof metricsConfig[MetricKey]][]).map(([key, config]) => (
                                        <label key={key} className="flex items-center gap-1.5 cursor-pointer hover:text-gray-800 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={visibleBars[key]}
                                                onChange={(e) => setVisibleBars({ ...visibleBars, [key]: e.target.checked })}
                                                className="w-3 h-3 accent-[#00a58c] rounded border-gray-300 pointer-events-auto"
                                            />
                                            {config.label}
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
                                            {(Object.entries(metricsConfig) as [MetricKey, typeof metricsConfig[MetricKey]][]).map(([key, config]) => (
                                                visibleBars[key] && (
                                                    <Bar 
                                                        key={key} 
                                                        dataKey={key} 
                                                        name={config.label} 
                                                        fill={config.color} 
                                                        radius={[2, 2, 0, 0]} 
                                                    />
                                                )
                                            ))}
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                            <p className="text-center text-[10px] text-gray-500 mt-4 italic">
                                {selectedMonth === 'All'
                                    ? 'The X-axis shows the Aug–Jul academic timeline.'
                                    : `Showing ${monthNames[selectedMonth - 1]} across the selected academic-year range.`}
                            </p>
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
                    </div>
                </div>

                {/* Usage Matrix — unified rollup (Country → District → School) */}
                <Card className="border-2 border-gray-400 shadow-sm rounded-2xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Globe className="h-5 w-5 text-gray-500" />
                            Usage Matrix
                        </CardTitle>
                        <CardDescription>Totals grouped by country, district and school.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="h-32 flex items-center justify-center text-gray-400">Loading...</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b-2 border-gray-300 bg-gray-50 text-gray-600">
                                            <th scope="col" className="py-3 px-4 text-left font-semibold uppercase tracking-wider text-xs">Level</th>
                                            <th scope="col" className="py-3 px-4 text-right font-semibold uppercase tracking-wider text-xs">States</th>
                                            <th scope="col" className="py-3 px-4 text-right font-semibold uppercase tracking-wider text-xs">Districts</th>
                                            <th scope="col" className="py-3 px-4 text-right font-semibold uppercase tracking-wider text-xs">Schools</th>
                                            <th scope="col" className="py-3 px-4 text-right font-semibold uppercase tracking-wider text-xs">Teachers</th>
                                            <th scope="col" className="py-3 px-4 text-right font-semibold uppercase tracking-wider text-xs">Students</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* By Country */}
                                        <tr className="border-b border-gray-200">
                                            <td className="py-3 px-4">
                                                <div className="font-semibold text-gray-900">By Country</div>
                                                <div className="text-xs text-gray-500">
                                                    {stats && Array.isArray(stats.countries) && stats.totalCountries === 1 && stats.countries[0]
                                                        ? stats.countries[0]
                                                        : 'All countries'}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-right text-gray-900">{error || !stats ? '—' : Number(stats.totalStates || 0).toLocaleString()}</td>
                                            <td className="py-3 px-4 text-right text-gray-900">{error || !stats ? '—' : Number(stats.totalDistricts || 0).toLocaleString()}</td>
                                            <td className="py-3 px-4 text-right text-gray-900">{error || !stats ? '—' : Number(stats.totalSchools || 0).toLocaleString()}</td>
                                            <td className="py-3 px-4 text-right text-gray-900">{error || !stats ? '—' : Number(stats.totalTeachers || 0).toLocaleString()}</td>
                                            <td className="py-3 px-4 text-right text-gray-900">{error || !stats ? '—' : Number(stats.totalStudents || 0).toLocaleString()}</td>
                                        </tr>

                                        {/* By District */}
                                        {districtError ? (
                                            <tr className="border-b border-gray-200">
                                                <td className="py-3 px-4">
                                                    <div className="font-semibold text-gray-900">By District</div>
                                                </td>
                                                <td colSpan={5} className="py-3 px-4 text-center text-amber-700">{districtError}</td>
                                            </tr>
                                        ) : districtAnalytics.length === 0 ? (
                                            <tr className="border-b border-gray-200">
                                                <td className="py-3 px-4">
                                                    <div className="font-semibold text-gray-900">By District</div>
                                                </td>
                                                <td colSpan={5} className="py-3 px-4 text-center text-gray-400">No district data yet.</td>
                                            </tr>
                                        ) : districtAnalytics.map((d, i) => (
                                            <tr key={d.districtId} className="border-b border-gray-200">
                                                <td className="py-3 px-4">
                                                    {i === 0 && <div className="font-semibold text-gray-900">By District</div>}
                                                    <div className="text-xs text-gray-600">{d.name}</div>
                                                </td>
                                                <td className="py-3 px-4 text-right text-gray-400">—</td>
                                                <td className="py-3 px-4 text-right text-gray-900">1</td>
                                                <td className="py-3 px-4 text-right text-gray-900">{d.schoolCount.toLocaleString()}</td>
                                                <td className="py-3 px-4 text-right text-gray-900">{d.teacherCount.toLocaleString()}</td>
                                                <td className="py-3 px-4 text-right text-gray-900">{d.studentCount.toLocaleString()}</td>
                                            </tr>
                                        ))}

                                        {/* By School */}
                                        {schoolStats.length === 0 ? (
                                            <tr>
                                                <td className="py-3 px-4">
                                                    <div className="font-semibold text-gray-900">By School</div>
                                                </td>
                                                <td colSpan={5} className="py-3 px-4 text-center text-gray-400">No school data yet.</td>
                                            </tr>
                                        ) : schoolStats.map((s, i) => (
                                            <tr key={s._id} className={i < schoolStats.length - 1 ? 'border-b border-gray-200' : ''}>
                                                <td className="py-3 px-4">
                                                    {i === 0 && <div className="font-semibold text-gray-900">By School</div>}
                                                    <div className="text-xs text-gray-600">{s.name}</div>
                                                </td>
                                                <td className="py-3 px-4 text-right text-gray-400">—</td>
                                                <td className="py-3 px-4 text-right text-gray-400">—</td>
                                                <td className="py-3 px-4 text-right text-gray-400">—</td>
                                                <td className="py-3 px-4 text-right text-gray-900">{s.teacherCount.toLocaleString()}</td>
                                                <td className="py-3 px-4 text-right text-gray-900">{s.studentCount.toLocaleString()}</td>
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
