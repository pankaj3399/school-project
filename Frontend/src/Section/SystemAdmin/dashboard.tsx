import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Building2,
    School,
    Users,
    GraduationCap,
    Coins,
    ArrowUpRight,
    TrendingUp,
    Map,
    Plus,
    Download,
    AlertCircle
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
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
import { useToast } from '@/hooks/use-toast';
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
};

export default function SystemAdminDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stateAnalytics, setStateAnalytics] = useState<StateAnalyticsRow[]>([]);
    const [geoError, setGeoError] = useState<string | null>(null);
    const [districtAnalytics, setDistrictAnalytics] = useState<DistrictAnalyticsRow[]>([]);
    const [districtError, setDistrictError] = useState<string | null>(null);

    const { toast } = useToast();

    const geoChartData = useMemo(() => {
        return [...stateAnalytics]
            .map((row) => ({
                name: row.state || 'Unknown',
                schools: row.schoolCount,
                districts: row.districtCount,
            }))
            .sort((a, b) => b.schools + b.districts - (a.schools + a.districts));
    }, [stateAnalytics]);

    const hasGeoData = geoChartData.some((d) => d.schools > 0 || d.districts > 0);

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
                    } else if (dash.error) {
                        setError("Failed to load dashboard metrics");
                    }
                    if (Array.isArray(geo.stateAnalytics)) {
                        setStateAnalytics(geo.stateAnalytics);
                        setGeoError(null);
                    } else if (geo.error) {
                        setStateAnalytics([]);
                        setGeoError(typeof geo.error === 'string' ? geo.error : 'Could not load geographic data');
                    } else {
                        setStateAnalytics([]);
                    }
                    if (Array.isArray(distComp.districtStats)) {
                        setDistrictAnalytics(distComp.districtStats);
                        setDistrictError(null);
                    } else if (distComp.error) {
                        setDistrictAnalytics([]);
                        setDistrictError(typeof distComp.error === 'string' ? distComp.error : 'Could not load district analytics');
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

    const handleDownloadWaitlist = async () => {
        let url: string | null = null;
        try {
            const token = getAuthToken(user);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/waitlist/export`, {
                method: 'GET',
                headers: {
                    'token': `${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to download waitlist');
            }

            const blob = await response.blob();
            url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `waitlist-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading waitlist:', error);
            toast({
                title: "Error",
                description: "Failed to download waitlist data",
                variant: "destructive"
            });
        } finally {
            if (url) {
                window.URL.revokeObjectURL(url);
            }
        }
    };

    const cards = [
        {
            title: "Active Districts",
            value: stats?.activeDistricts || 0,
            total: stats?.totalDistricts || 0,
            icon: Building2,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
            link: "/system-admin/districts"
        },
        {
            title: "Total Schools",
            value: stats?.totalSchools || 0,
            icon: School,
            color: "text-indigo-600",
            bgColor: "bg-indigo-100",
            link: "/system-admin/schools"
        },
        {
            title: "Teachers",
            value: stats?.totalTeachers || 0,
            icon: Users,
            color: "text-emerald-600",
            bgColor: "bg-emerald-100",
            link: "/system-admin/search?type=teacher"
        },
        {
            title: "Students",
            value: stats?.totalStudents || 0,
            icon: GraduationCap,
            color: "text-amber-600",
            bgColor: "bg-amber-100",
            link: "/system-admin/search?type=student"
        }
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        System Overview
                    </h1>
                    <p className="text-gray-500 mt-2">Manage districts, schools, and monitor system performance.</p>
                </div>
                <div className="flex gap-4">
                    <Button
                        onClick={handleDownloadWaitlist}
                        variant="outline"
                        className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Download Waitlist
                    </Button>
                    <Button
                        onClick={() => navigate('/system-admin/districts/new')}
                        className="bg-[#00a58c] hover:bg-[#008f7a]"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add District
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/system-admin/districts')}>
                        Manage Districts
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl flex items-center gap-3">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, index) => (
                    <Card
                        key={index}
                        className="hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-sm ring-1 ring-gray-100"
                        onClick={() => card.link && navigate(card.link)}
                    >
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div className={`p-3 rounded-xl ${card.bgColor} ${card.color}`}>
                                    <card.icon className="h-6 w-6" />
                                </div>
                                {card.total !== undefined && (
                                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                        Total: {card.total}
                                    </span>
                                )}
                            </div>
                            <div className="mt-4">
                                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                                    {loading ? "-" : card.value.toLocaleString()}
                                </h3>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="col-span-2 border-0 shadow-sm ring-1 ring-gray-100">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Map className="h-5 w-5 text-gray-500" />
                            Geographic Distribution
                        </CardTitle>
                        <CardDescription>
                            Schools and districts by U.S. state (from district records).{" "}
                            <button
                                type="button"
                                className="text-[#00a58c] font-medium hover:underline"
                                onClick={() => navigate('/system-admin/schools')}
                            >
                                Manage schools
                            </button>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg">
                                Loading map data…
                            </div>
                        ) : geoError ? (
                            <div className="h-64 flex items-center justify-center text-center text-sm text-amber-800 bg-amber-50 rounded-lg border border-amber-100 px-4">
                                {geoError}
                            </div>
                        ) : !hasGeoData ? (
                            <div className="h-64 flex flex-col items-center justify-center text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200 px-6">
                                <p className="text-sm font-medium text-gray-700">No state breakdown yet</p>
                                <p className="text-sm mt-1 max-w-md">
                                    Add districts with a state, or link schools to those districts, to see counts by state.
                                </p>
                            </div>
                        ) : (
                            <div className="h-72 w-full min-h-[260px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        layout="vertical"
                                        data={geoChartData}
                                        margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100" horizontal={false} />
                                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            width={44}
                                            tick={{ fontSize: 12 }}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: 8,
                                                border: '1px solid #e5e7eb',
                                                fontSize: 13,
                                            }}
                                            formatter={(value: number, name: string) => [
                                                value,
                                                name === 'schools' ? 'Schools' : 'Districts',
                                            ]}
                                        />
                                        <Legend
                                            wrapperStyle={{ fontSize: 13 }}
                                            formatter={(value) => (value === 'schools' ? 'Schools' : 'Districts')}
                                        />
                                        <Bar dataKey="schools" name="schools" fill="#00a58c" radius={[0, 4, 4, 0]} maxBarSize={28} />
                                        <Bar dataKey="districts" name="districts" fill="#94a3b8" radius={[0, 4, 4, 0]} maxBarSize={28} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm ring-1 ring-gray-100 bg-gradient-to-br from-[#00a58c] to-[#008f7a] text-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Coins className="h-5 w-5" />
                            Token Economy
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div>
                                <p className="text-emerald-100 text-sm font-medium mb-1">Total Tokens Distributed</p>
                                <h3 className="text-3xl font-bold">
                                    {loading ? "-" : (stats?.totalTokensEarned || 0).toLocaleString()}
                                </h3>
                            </div>

                            <div className="pt-4 border-t border-emerald-400/30">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-emerald-100 text-sm">Growth (30d)</span>
                                    <span className="flex items-center text-white font-bold bg-white/20 px-2 py-0.5 rounded text-sm">
                                        <TrendingUp className="h-3 w-3 mr-1" /> {stats?.growth30d ? `${stats.growth30d}%` : "N/A"}
                                    </span>
                                </div>
                                <div className="h-2 bg-emerald-900/20 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-white/90 rounded-full transition-all duration-500" 
                                        style={{ width: `${(stats?.totalDistricts ? (stats.activeDistricts / stats.totalDistricts) * 100 : 0)}%` }}
                                    />
                                </div>
                            </div>

                            <Button
                                variant="secondary"
                                className="w-full mt-4 bg-white text-[#00a58c] hover:bg-emerald-50 border-0"
                                onClick={() => navigate('/analytics')}
                            >
                                View Detailed Analytics
                                <ArrowUpRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
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
                                        <th className="pb-3 font-medium">District</th>
                                        <th className="pb-3 font-medium">State</th>
                                        <th className="pb-3 font-medium text-right">Schools</th>
                                        <th className="pb-3 font-medium text-right">Teachers</th>
                                        <th className="pb-3 font-medium text-right">Students</th>
                                        <th className="pb-3 font-medium text-right">Tokens</th>
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
                                            <td className="py-3 text-right text-gray-900">{d.schoolCount}</td>
                                            <td className="py-3 text-right text-gray-900">{d.teacherCount}</td>
                                            <td className="py-3 text-right text-gray-900">{d.studentCount}</td>
                                            <td className="py-3 text-right font-semibold text-[#00a58c]">{d.totalTokens.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
