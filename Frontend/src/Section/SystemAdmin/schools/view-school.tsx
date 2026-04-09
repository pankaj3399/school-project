import React, { useEffect, useState, useRef, useCallback, ReactNode } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { getCurrrentSchool, getStats, getDistricts, updateSchool, getAnalyticsData } from '@/api'
import { useToast } from '@/hooks/use-toast'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IconSettings, IconLayoutDashboard, IconUsers, IconUserStar, IconCoins, IconArrowBackUp, IconMessage2, IconAlertCircle, IconCheck, IconChevronRight, IconShieldCheck, IconMapPin, IconSchool, IconPhoto, IconUpload } from '@tabler/icons-react'
import { InviteAdminDialog } from '@/components/InviteAdminDialog'
import { EditAdminDialog } from '@/components/EditAdminDialog'
import { Role } from '@/enum'
import EducationYearChart from '../../School/component/new-chart'
import TeacherRanks from '../../School/component/TeacherRanks'
import StudentRanks from '../../School/component/StudentRanks'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { reInviteAdmin } from '@/api'
import { cn } from "@/lib/utils"

const US_STATES = [
    { name: "Alabama", abbreviation: "AL" }, { name: "Alaska", abbreviation: "AK" }, { name: "Arizona", abbreviation: "AZ" },
    { name: "Arkansas", abbreviation: "AR" }, { name: "California", abbreviation: "CA" }, { name: "Colorado", abbreviation: "CO" },
    { name: "Connecticut", abbreviation: "CT" }, { name: "Delaware", abbreviation: "DE" }, { name: "Florida", abbreviation: "FL" },
    { name: "Georgia", abbreviation: "GA" }, { name: "Hawaii", abbreviation: "HI" }, { name: "Idaho", abbreviation: "ID" },
    { name: "Illinois", abbreviation: "IL" }, { name: "Indiana", abbreviation: "IN" }, { name: "Iowa", abbreviation: "IA" },
    { name: "Kansas", abbreviation: "KS" }, { name: "Kentucky", abbreviation: "KY" }, { name: "Louisiana", abbreviation: "LA" },
    { name: "Maine", abbreviation: "ME" }, { name: "Maryland", abbreviation: "MD" }, { name: "Massachusetts", abbreviation: "MA" },
    { name: "Michigan", abbreviation: "MI" }, { name: "Minnesota", abbreviation: "MN" }, { name: "Mississippi", abbreviation: "MS" },
    { name: "Missouri", abbreviation: "MO" }, { name: "Montana", abbreviation: "MT" }, { name: "Nebraska", abbreviation: "NE" },
    { name: "Nevada", abbreviation: "NV" }, { name: "New Hampshire", abbreviation: "NH" }, { name: "New Jersey", abbreviation: "NJ" },
    { name: "New Mexico", abbreviation: "NM" }, { name: "New York", abbreviation: "NY" }, { name: "North Carolina", abbreviation: "NC" },
    { name: "North Dakota", abbreviation: "ND" }, { name: "Ohio", abbreviation: "OH" }, { name: "Oklahoma", abbreviation: "OK" },
    { name: "Oregon", abbreviation: "OR" }, { name: "Pennsylvania", abbreviation: "PA" }, { name: "Rhode Island", abbreviation: "RI" },
    { name: "South Carolina", abbreviation: "SC" }, { name: "South Dakota", abbreviation: "SD" }, { name: "Tennessee", abbreviation: "TN" },
    { name: "Texas", abbreviation: "TX" }, { name: "Utah", abbreviation: "UT" }, { name: "Vermont", abbreviation: "VT" },
    { name: "Virginia", abbreviation: "VA" }, { name: "Washington", abbreviation: "WA" }, { name: "West Virginia", abbreviation: "WV" },
    { name: "Wisconsin", abbreviation: "WI" }, { name: "Wyoming", abbreviation: "WY" }
];

const COUNTRIES = ["United States", "Canada", "Other"];

interface ChartDataPoint {
    date: string;
    points: number;
    label?: string;
}

interface AnalyticsData {
    awardPoints: ChartDataPoint[];
    deductPoints: ChartDataPoint[];
    withdrawPoints: ChartDataPoint[];
}

type StatCardColor = 'blue' | 'green' | 'yellow' | 'red' | 'orange' | 'purple';

interface StatCardProps {
    title: string;
    value: number;
    icon: ReactNode;
    color: StatCardColor;
}

const StatCard = ({ title, value, icon, color }: StatCardProps) => {
    const colorMap: Record<StatCardColor, string> = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-green-50 text-green-600",
        yellow: "bg-yellow-50 text-yellow-600",
        red: "bg-red-50 text-red-600",
        orange: "bg-orange-50 text-orange-600",
        purple: "bg-purple-50 text-purple-600",
    }

    return (
        <Card className="border-none shadow-sm bg-white overflow-hidden rounded-2xl">
            <CardContent className="p-4 flex flex-col items-center text-center">
                <div className={`p-2.5 rounded-xl mb-3 ${colorMap[color]}`}>
                    {icon}
                </div>
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">{title}</div>
                <div className="text-2xl font-black text-neutral-900 leading-none">{value.toLocaleString()}</div>
            </CardContent>
        </Card>
    )
}

const ViewSchool = () => {
    const { id } = useParams<{ id: string }>()
    const [searchParams, setSearchParams] = useSearchParams()
    const activeTab = searchParams.get('tab') || 'dashboard'
    const [school, setSchool] = useState<any>(null)
    const [admins, setAdmins] = useState<any[]>([])
    const [reinvitingIds, setReinvitingIds] = useState<Record<string, boolean>>({})
    const [stats, setStats] = useState<any>(null)
    const [districts, setDistricts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [fetchError, setFetchError] = useState<Error | null>(null)
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const navigate = useNavigate()
    const { toast } = useToast()
    const requestRef = useRef(0)
    const analyticsRequestRef = useRef(0)
    const [imageLoadError, setImageLoadError] = useState(false)

    // Analytics state
    const [period, setPeriod] = useState<string>("1W")
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
    const [analyticsLoading, setAnalyticsLoading] = useState(false)
    const [detailView, setDetailView] = useState<{
        type: 'award' | 'deduct' | 'withdraw' | null;
        data: ChartDataPoint[];
        title: string;
        color: string;
        icon: string;
    } | null>(null);

    // Form state for settings
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        districtId: '',
        state: '',
        country: '',
        domain: '',
        logo: ''
    })

    useEffect(() => {
        setImageLoadError(false)
    }, [formData.logo])

    const fetchData = useCallback(async () => {
        if (!id) return
        const requestId = ++requestRef.current
        try {
            setLoading(true)
            const token = localStorage.getItem('token') || ''
            const [schoolRes, statsRes, districtsRes] = await Promise.all([
                getCurrrentSchool(token, id),
                getStats(id),
                getDistricts(token)
            ])

            if (requestId !== requestRef.current) return

            if (schoolRes.school) {
                setSchool(schoolRes.school)
                setAdmins(schoolRes.admins || [])
                setLogoPreview(schoolRes.school.logo || null)
                setFormData({
                    name: schoolRes.school.name || '',
                    address: schoolRes.school.address || '',
                    districtId: schoolRes.school.districtId?._id || schoolRes.school.districtId || '',
                    state: schoolRes.school.state || 'CO',
                    country: schoolRes.school.country || 'United States',
                    domain: schoolRes.school.domain || '',
                    logo: schoolRes.school.logo || ''
                })
            }
            setStats(statsRes)
            setDistricts(districtsRes.districts || [])
        } catch (error: any) {
            if (requestId !== requestRef.current) return
            setFetchError(error)
        } finally {
            if (requestId === requestRef.current) {
                setLoading(false)
            }
        }
    }, [id])

    const fetchAnalytics = useCallback(async () => {
        if (!id || activeTab !== 'dashboard') return
        const requestId = ++analyticsRequestRef.current
        setAnalyticsLoading(true)
        try {
            const data = await getAnalyticsData({
                period,
                schoolId: id
            })
            if (requestId !== analyticsRequestRef.current) return

            if (data.success) {
                setAnalyticsData(data.data)
            } else {
                setAnalyticsData(null)
            }
        } catch (error) {
            console.error("Error fetching analytics:", error)
            if (requestId === analyticsRequestRef.current) {
                setAnalyticsData(null)
            }
        } finally {
            if (requestId === analyticsRequestRef.current) {
                setAnalyticsLoading(false)
            }
        }
    }, [id, activeTab, period])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    useEffect(() => {
        fetchAnalytics()
    }, [fetchAnalytics])

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const token = localStorage.getItem('token') || ''
            
            const data = new FormData();
            data.append('name', formData.name);
            data.append('address', formData.address);
            data.append('district', formData.districtId);
            data.append('state', formData.state);
            data.append('country', formData.country);
            data.append('domain', formData.domain);
            
            if (logoFile) {
                data.append('logo', logoFile);
            }

            const response = await updateSchool(id!, data, token)
            
            if (response.error) throw new Error(typeof response.error === 'string' ? response.error : response.error.message)
            
            toast({
                title: "Success",
                description: "School settings updated successfully",
            })
            setSchool(response.school)
            setLogoFile(null)
            fetchData()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update school settings",
                variant: "destructive"
            })
        } finally {
            setSaving(false)
        }
    }

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setLogoFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setLogoPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleReInvite = async (adminId: string, adminName: string) => {
        if (reinvitingIds[adminId]) return;

        setReinvitingIds(prev => ({ ...prev, [adminId]: true }));
        try {
            const response = await reInviteAdmin(adminId);
            if (response.error) {
                toast({
                    title: "Error",
                    description: response.error,
                    variant: "destructive"
                });
            } else if (response.emailError) {
                toast({
                    title: "Partial Success",
                    description: "Invitation token regenerated, but email failed to send.",
                    variant: "destructive"
                });
            } else {
                const nameFallback = adminName || 'the administrator';
                toast({
                    title: "Success",
                    description: `Invitation resent to ${nameFallback}.`,
                });
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "An error occurred while resending the invitation.",
                variant: "destructive"
            });
        } finally {
            setReinvitingIds(prev => ({ ...prev, [adminId]: false }));
        }
    };

    const formatDateLabel = (dateStr: string, period: string) => {
        const [year, month, day] = dateStr.split('-').map(Number)
        const date = new Date(Date.UTC(year, month - 1, day))
        if (period === "1W") {
            return date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
    }

    const processChartData = (data: ChartDataPoint[], period: string) => {
        if (!data) return []
        return data.map(d => ({
            ...d,
            label: formatDateLabel(d.date, period)
        }))
    }

    const PointsChart = ({
        data,
        title,
        color,
        icon,
        type
    }: {
        data: ChartDataPoint[];
        title: string;
        color: string;
        icon: string;
        type: 'award' | 'deduct' | 'withdraw';
    }) => {
        const processedData = processChartData(data, period)
        return (
            <Card className="border-neutral-200 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-neutral-50/50 border-b p-4 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={icon} alt="" className="w-10 h-10 object-contain" />
                        <CardTitle className="text-lg font-bold text-neutral-900">{title}</CardTitle>
                    </div>
                    <Button
                        onClick={() => setDetailView({ type, data, title, color, icon })}
                        variant="outline"
                        size="sm"
                        className="rounded-xl h-8 px-4"
                    >
                        View Details
                    </Button>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="h-[240px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={processedData}>
                                <XAxis 
                                    dataKey="label" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    className="text-[10px] text-neutral-400"
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    className="text-[10px] text-neutral-400"
                                />
                                <Tooltip />
                                <Bar 
                                    dataKey="points" 
                                    fill={color} 
                                    radius={[4, 4, 0, 0]} 
                                    barSize={period === "1W" ? 32 : 12}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (loading) return (
        <div className="p-8 flex items-center gap-3 text-neutral-500">
            <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
            Loading school data...
        </div>
    )

    if (fetchError || !school) return (
        <div className="p-8 flex flex-col items-center justify-center gap-4 text-center">
            <IconAlertCircle className="w-12 h-12 text-red-500" />
            <h2 className="text-xl font-semibold">School Not Found</h2>
            <Button onClick={() => navigate('/system-admin/schools')}>Back to Schools</Button>
        </div>
    )

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center gap-4">
                    {school.logo && !imageLoadError ? (
                        <img 
                            src={school.logo} 
                            alt="" 
                            className="w-20 h-20 rounded-xl object-contain border p-2 bg-neutral-50" 
                            onError={() => setImageLoadError(true)}
                            onLoad={() => setImageLoadError(false)}
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-xl bg-neutral-100 flex items-center justify-center border">
                            <IconSchool className="w-10 h-10 text-neutral-400" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900">{school.name}</h1>
                        <div className="flex items-center gap-2 text-neutral-500 mt-1">
                            <span className="text-sm font-medium">{school.districtId?.name || school.district || 'Unassigned District'}</span>
                            <IconChevronRight className="w-4 h-4 text-neutral-300" />
                            <span className="text-sm">{school.state}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        onClick={() => navigate('/system-admin/schools')}
                        className="rounded-xl border-neutral-200 hover:bg-neutral-50"
                    >
                        Back to List
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={(val) => setSearchParams({ tab: val })} className="space-y-6">
                <TabsList className="bg-white border border-neutral-200 p-1 rounded-xl shadow-sm inline-flex">
                    <TabsTrigger value="dashboard" className="rounded-lg gap-2 data-[state=active]:bg-neutral-100 px-4 h-9">
                        <IconLayoutDashboard className="w-4 h-4" /> Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="admins" className="rounded-lg gap-2 data-[state=active]:bg-neutral-100 px-4 h-9">
                        <IconShieldCheck className="w-4 h-4" /> Admins
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="rounded-lg gap-2 data-[state=active]:bg-neutral-100 px-4 h-9">
                        <IconSettings className="w-4 h-4" /> Settings
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="space-y-8 outline-none">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        <StatCard title="Total Teachers" value={stats?.totalTeachers || 0} icon={<IconUserStar className="w-6 h-6" />} color="green" />
                        <StatCard title="Total Students" value={stats?.totalStudents || 0} icon={<IconUsers className="w-6 h-6" />} color="blue" />
                        <StatCard title="Total Tokens" value={stats?.totalPoints || 0} icon={<IconCoins className="w-6 h-6" />} color="yellow" />
                        <StatCard title="Total Feedbacks" value={stats?.totalFeedbackCount || 0} icon={<IconMessage2 className="w-6 h-6" />} color="purple" />
                        <StatCard title="Total Oopsies" value={-(stats?.totalDeductPoints || 0)} icon={<IconAlertCircle className="w-6 h-6" />} color="orange" />
                        <StatCard title="Total Withdrawals" value={-(stats?.totalWithdrawPoints || 0)} icon={<IconArrowBackUp className="w-6 h-6" />} color="red" />
                    </div>

                    <div className='grid grid-cols-1 lg:grid-cols-6 gap-6 items-start'>
                        {/* LEFT: Students */}
                        <div className="lg:col-span-1">
                            <StudentRanks studentId="" schoolId={id} />
                        </div>

                        {/* MIDDLE: Charts */}
                        <div className='lg:col-span-4 space-y-8'>
                            {/* Academic Year Chart */}
                            <Card className="border-neutral-200 shadow-sm overflow-hidden rounded-2xl">
                                <CardHeader className="border-b bg-neutral-50/50 flex flex-row items-center justify-between">
                                    <CardTitle className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Academic Year Performance</CardTitle>
                                    <Select value={period} onValueChange={setPeriod}>
                                        <SelectTrigger className="w-[140px] h-8 rounded-lg text-xs bg-white">
                                            <SelectValue placeholder="Period" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1W">Last Week</SelectItem>
                                            <SelectItem value="1M">Last Month</SelectItem>
                                            <SelectItem value="3M">3 Months</SelectItem>
                                            <SelectItem value="6M">6 Months</SelectItem>
                                            <SelectItem value="1Y">Yearly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <EducationYearChart studentId='' schoolId={id} />
                                </CardContent>
                            </Card>

                            {/* Detailed Analytics Charts */}
                            {analyticsLoading ? (
                                <div className="flex items-center justify-center h-[400px] text-neutral-400">Loading analytics...</div>
                            ) : analyticsData ? (
                                <div className="space-y-6">
                                    <PointsChart
                                        data={analyticsData.awardPoints}
                                        title="Tokens Awarded"
                                        color="#4CAF50"
                                        icon="/etoken.svg"
                                        type="award"
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <PointsChart
                                            data={analyticsData.withdrawPoints}
                                            title="Withdrawals"
                                            color="#3d59f5"
                                            icon="/Withdraw.svg"
                                            type="withdraw"
                                        />
                                        <PointsChart
                                            data={analyticsData.deductPoints}
                                            title="Oopsies"
                                            color="#f44336"
                                            icon="/oopsie.svg"
                                            type="deduct"
                                        />
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {/* RIGHT: Teachers */}
                        <div className="lg:col-span-1">
                            <TeacherRanks studentId='' schoolId={id} />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="admins" className="outline-none">
                    <Card className="border-neutral-200 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="bg-neutral-50/50 border-b p-6 flex flex-row items-center justify-between">
                            <CardTitle className="text-xl font-bold text-neutral-900">School Administrators</CardTitle>
                            <InviteAdminDialog
                                districtId={school.districtId?._id || school.districtId}
                                schoolId={id}
                                role={Role.SchoolAdmin}
                                label="Invite School Admin"
                            />
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-neutral-50/50">
                                            <TableHead className="font-bold text-neutral-500 uppercase tracking-wider text-[10px] pl-6">NAME</TableHead>
                                            <TableHead className="font-bold text-neutral-500 uppercase tracking-wider text-[10px]">SCHOOL NAME</TableHead>
                                            <TableHead className="font-bold text-neutral-500 uppercase tracking-wider text-[10px]">ADDRESS</TableHead>
                                            <TableHead className="font-bold text-neutral-500 uppercase tracking-wider text-[10px]">POSITION</TableHead>
                                            <TableHead className="font-bold text-neutral-500 uppercase tracking-wider text-[10px]">EMAIL</TableHead>
                                            <TableHead className="font-bold text-neutral-500 uppercase tracking-wider text-[10px]">PHONE</TableHead>
                                            <TableHead className="font-bold text-neutral-500 uppercase tracking-wider text-[10px]">ROLE</TableHead>
                                            <TableHead className="font-bold text-neutral-500 uppercase tracking-wider text-[10px]">STATUS</TableHead>
                                            <TableHead className="font-bold text-neutral-500 uppercase tracking-wider text-[10px] text-right pr-6">ACTIONS</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {admins.length > 0 ? (
                                            admins.map((admin) => (
                                                <TableRow key={admin._id} className="hover:bg-neutral-50/30 transition-colors">
                                                    <TableCell className="pl-6 font-medium text-neutral-900 truncate max-w-[200px]">
                                                        {admin.name}
                                                    </TableCell>
                                                    <TableCell className="text-neutral-500 text-xs font-medium">
                                                        {school.name}
                                                    </TableCell>
                                                    <TableCell className="text-neutral-500 text-xs truncate max-w-[200px]">
                                                        {admin.address || "N/A"}
                                                    </TableCell>
                                                    <TableCell className="text-neutral-600 font-medium">{admin.position || "Other"}</TableCell>
                                                    <TableCell className="text-neutral-500 font-medium">
                                                        {admin.email}
                                                    </TableCell>
                                                    <TableCell className="text-neutral-500 font-medium">
                                                        {admin.phone || "N/A"}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                                                            {admin.contactRole || "Leadership"}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={cn(
                                                            "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                                            admin.hasCompletedRegistration ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                                        )}>
                                                            {admin.hasCompletedRegistration ? 'Active' : 'Pending'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <EditAdminDialog admin={admin} onSuccess={fetchData} />
                                                            {!admin.hasCompletedRegistration && (
                                                                <Button 
                                                                    variant="link" 
                                                                    onClick={() => handleReInvite(admin._id, admin.name)}
                                                                    disabled={reinvitingIds[admin._id]}
                                                                    className="h-8 px-2 text-[#00a58c] hover:text-[#008f7a] text-xs font-bold"
                                                                >
                                                                    {reinvitingIds[admin._id] ? 'Sending...' : 'Invite'}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-12 text-neutral-400">
                                                    No administrators found for this school.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="outline-none">
                    <Card className="border-neutral-200 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="bg-neutral-50/50 border-b p-6">
                            <CardTitle className="text-xl font-bold text-neutral-900">School Settings</CardTitle>
                            <p className="text-sm text-neutral-500 mt-1">Configure basic information and district association.</p>
                        </CardHeader>
                        <CardContent className="p-8">
                            <form onSubmit={handleUpdate} className="space-y-8 max-w-3xl">
                                {/* Branding & Identity Section */}
                                <div className="space-y-6">
                                    <h3 className="text-sm font-bold text-[#00a58c] uppercase tracking-[0.2em] flex items-center gap-2">
                                        <div className="w-1 h-4 bg-[#00a58c] rounded-full" />
                                        Branding & Identity
                                    </h3>
                                    
                                    <div className="flex flex-col md:flex-row items-start gap-8 bg-neutral-50/50 p-6 rounded-2xl border border-neutral-100">
                                        <div className="relative group shrink-0">
                                            <div className="w-32 h-32 rounded-2xl bg-white border-2 border-neutral-200 overflow-hidden flex items-center justify-center shadow-sm group-hover:border-[#00a58c] transition-colors relative">
                                                {logoPreview && !imageLoadError ? (
                                                    <img 
                                                        src={logoPreview} 
                                                        alt="School Logo" 
                                                        className="w-full h-full object-contain p-4" 
                                                        onError={() => setImageLoadError(true)}
                                                        onLoad={() => setImageLoadError(false)}
                                                    />
                                                ) : (
                                                    <IconPhoto className="w-10 h-10 text-neutral-300" />
                                                )}
                                                
                                                {/* Edit Overlay */}
                                                <button 
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <IconUpload className="w-8 h-8 text-white" />
                                                </button>
                                            </div>
                                            <input 
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleLogoChange}
                                                accept="image/*"
                                                className="hidden"
                                            />
                                        </div>

                                        <div className="space-y-3 flex-1">
                                            <div>
                                                <h4 className="text-sm font-bold text-neutral-900">School Logo</h4>
                                                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                                                    This logo will be displayed on the dashboard, reports, and student IDs. 
                                                    For best results, use a square PNG or JPG at least 256x256px.
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Button 
                                                    type="button" 
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="h-8 rounded-lg text-xs font-semibold"
                                                >
                                                    <IconUpload className="w-3.5 h-3.5 mr-2" />
                                                    Change Logo
                                                </Button>
                                                {logoFile && (
                                                    <Button 
                                                        type="button" 
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setLogoFile(null);
                                                            setLogoPreview(school.logo || null);
                                                        }}
                                                        className="h-8 rounded-lg text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    >
                                                        Cancel
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* General Information Section */}
                                <div className="space-y-6">
                                    <h3 className="text-sm font-bold text-[#00a58c] uppercase tracking-[0.2em] flex items-center gap-2">
                                        <div className="w-1 h-4 bg-[#00a58c] rounded-full" />
                                        General Information
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-neutral-700">School Name</label>
                                            <Input 
                                                value={formData.name} 
                                                onChange={e => setFormData({...formData, name: e.target.value})}
                                                className="rounded-xl border-neutral-300 focus:ring-[#00a58c] h-11"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-neutral-700">Official Domain</label>
                                            <Input 
                                                value={formData.domain} 
                                                onChange={e => setFormData({...formData, domain: e.target.value})}
                                                className="rounded-xl border-neutral-300 focus:ring-[#00a58c] h-11"
                                                placeholder="e.g. school.edu"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-neutral-700">Street Address</label>
                                        <div className="relative">
                                            <IconMapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                            <Input 
                                                value={formData.address} 
                                                onChange={e => setFormData({...formData, address: e.target.value})}
                                                className="rounded-xl border-neutral-300 focus:ring-[#00a58c] h-11 pl-10"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-neutral-700">District Association</label>
                                        <Select 
                                            value={formData.districtId} 
                                            onValueChange={val => setFormData({...formData, districtId: val})}
                                        >
                                            <SelectTrigger className="rounded-xl h-11 border-neutral-300 bg-white">
                                                <SelectValue placeholder="Select a district" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {districts.map(d => (
                                                    <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {!formData.districtId && (
                                            <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 text-[10px] font-bold uppercase tracking-wider w-fit">
                                                <IconAlertCircle className="w-3.5 h-3.5" />
                                                Legacy School (No District)
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-neutral-700">State</label>
                                            <Select 
                                                value={formData.state} 
                                                onValueChange={val => setFormData({...formData, state: val})}
                                            >
                                                <SelectTrigger className="rounded-xl h-11 border-neutral-300">
                                                    <SelectValue placeholder="Select state" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {US_STATES.map(s => (
                                                        <SelectItem key={s.abbreviation} value={s.abbreviation}>
                                                            {s.name} ({s.abbreviation})
                                                        </SelectItem>
                                                    ))}
                                                    {formData.state && !US_STATES.some(s => s.abbreviation === formData.state) && (
                                                        <SelectItem key={formData.state} value={formData.state}>{formData.state}</SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-neutral-700">Country</label>
                                            <Select 
                                                value={formData.country} 
                                                onValueChange={val => setFormData({...formData, country: val})}
                                            >
                                                <SelectTrigger className="rounded-xl h-11 border-neutral-300">
                                                    <SelectValue placeholder="Select country" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {COUNTRIES.map(c => (
                                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                                    ))}
                                                    {formData.country && !COUNTRIES.includes(formData.country) && (
                                                        <SelectItem key={formData.country} value={formData.country}>{formData.country}</SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t flex items-center justify-between">
                                    <Button 
                                        type="submit" 
                                        disabled={saving}
                                        className="bg-[#00a58c] hover:bg-[#008f7a] text-white px-8 rounded-xl h-11 gap-2 min-w-[160px]"
                                    >
                                        {saving ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <IconCheck className="w-5 h-5" />
                                        )}
                                        {saving ? 'Saving...' : 'Save Settings'}
                                    </Button>
                                    {school.updatedAt && (
                                        <p className="text-xs text-neutral-400 italic">
                                            Last updated: {new Date(school.updatedAt).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Detail View Dialog */}
            <Dialog open={!!detailView} onOpenChange={() => setDetailView(null)}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
                    <DialogHeader className="border-b pb-4 mb-4">
                        <div className="flex items-center gap-4">
                            <img src={detailView?.icon} alt="" className="w-12 h-12" />
                            <DialogTitle className="text-2xl font-bold">{detailView?.title} - Detailed View</DialogTitle>
                        </div>
                    </DialogHeader>

                    {detailView && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between bg-neutral-50 p-4 rounded-xl">
                                <div className="text-sm font-medium text-neutral-500">History for {period === "1W" ? "Last Week" : "Selected Period"}</div>
                                <div className="text-sm text-neutral-400">Analysis for {school?.name}</div>
                            </div>

                            <div className="h-[450px] w-full border border-neutral-100 p-6 rounded-2xl bg-white shadow-sm">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={processChartData(detailView.data, period)}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                    >
                                        <XAxis
                                            dataKey="label"
                                            axisLine={false}
                                            tickLine={false}
                                            angle={period === "1W" ? 0 : -45}
                                            textAnchor={period === "1W" ? "middle" : "end"}
                                            height={period === "1W" ? 30 : 60}
                                            className="text-xs font-medium text-neutral-400"
                                        />
                                        <YAxis axisLine={false} tickLine={false} className="text-xs font-medium text-neutral-400" />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            cursor={{ fill: '#f8f9fa' }}
                                        />
                                        <Bar
                                            dataKey="points"
                                            fill={detailView.color}
                                            radius={[8, 8, 0, 0]}
                                            barSize={period === "1W" ? 60 : 30}
                                            label={{
                                                position: "top",
                                                fill: "#17171e",
                                                fontWeight: 600,
                                                fontSize: 12
                                            }}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default ViewSchool
