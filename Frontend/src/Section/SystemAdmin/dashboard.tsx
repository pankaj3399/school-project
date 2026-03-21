import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSystemDashboardStats } from '@/api';
import { useAuth } from '@/authContext';

export default function SystemAdminDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;
            // @ts-ignore
            const token = user.token || localStorage.getItem('token');
            if (token) {
                const data = await getSystemDashboardStats(token);
                if (data.stats) {
                    setStats(data.stats);
                }
            }
            setLoading(false);
        };

        fetchStats();
    }, [user]);

    const handleDownloadWaitlist = async () => {
        try {
            // @ts-ignore
            const token = user?.token || localStorage.getItem('token');
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
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `waitlist-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading waitlist:', error);
            alert('Failed to download waitlist data');
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
            link: "/system-admin/districts"
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
                                {card.total && (
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
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                            State-level map/chart will go here
                        </div>
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
                                        <TrendingUp className="h-3 w-3 mr-1" /> +12.5%
                                    </span>
                                </div>
                                <div className="h-2 bg-emerald-900/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-white/90 w-3/4 rounded-full" />
                                </div>
                            </div>

                            <Button
                                variant="secondary"
                                className="w-full mt-4 bg-white text-[#00a58c] hover:bg-emerald-50 border-0"
                            >
                                View Detailed Analytics
                                <ArrowUpRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
