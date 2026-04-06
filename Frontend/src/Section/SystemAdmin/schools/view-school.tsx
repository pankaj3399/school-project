import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { getCurrrentSchool, getStats, deleteSchool, getDistricts, updateSchool } from '@/api'
import { useToast } from '@/hooks/use-toast'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IconTrash, IconSettings, IconLayoutDashboard, IconUsers, IconUserStar, IconCoins, IconArrowBackUp, IconMessage2, IconAlertCircle, IconCheck, IconChevronRight, IconShieldCheck } from '@tabler/icons-react'
import { InviteAdminDialog } from '@/components/InviteAdminDialog'
import { Role } from '@/enum'
import EducationYearChart from '../../School/component/new-chart'
import TeacherRanks from '../../School/component/TeacherRanks'
import StudentRanks from '../../School/component/StudentRanks'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Modal from '@/Section/School/Modal'

const ViewSchool = () => {
    const { id } = useParams<{ id: string }>()
    const [searchParams, setSearchParams] = useSearchParams()
    const activeTab = searchParams.get('tab') || 'dashboard'
    const [school, setSchool] = useState<any>(null)
    const [stats, setStats] = useState<any>(null)
    const [districts, setDistricts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [fetchError, setFetchError] = useState<Error | null>(null)
    const navigate = useNavigate()
    const { toast } = useToast()
    const requestRef = useRef(0)

    // Form state for settings
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        districtId: '',
        state: '',
        country: '',
        timeZone: '',
        domain: ''
    })

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
                setFormData({
                    name: schoolRes.school.name || '',
                    address: schoolRes.school.address || '',
                    districtId: schoolRes.school.districtId?._id || '',
                    state: schoolRes.school.state || '',
                    country: schoolRes.school.country || '',
                    timeZone: schoolRes.school.timeZone || '',
                    domain: schoolRes.school.domain || ''
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

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!id) return
        setSaving(true)
        try {
            const token = localStorage.getItem('token') || ''
            const response = await updateSchool(id, formData, token)
            if (response.error) throw new Error(typeof response.error === 'string' ? response.error : response.error.message)
            
            toast({
                title: "Success",
                description: "School settings updated successfully",
            })
            setSchool(response.school)
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

    const handleDelete = async () => {
        if (!id || !school) return
        
        try {
            setIsDeleting(true)
            const token = localStorage.getItem('token') || ''
            const response = await deleteSchool(id, token)
            if (response.error) throw new Error(typeof response.error === 'string' ? response.error : response.error.message)
            
            toast({ description: `${school.name} deleted successfully.` })
            navigate('/system-admin/schools')
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete school",
                variant: "destructive"
            })
        } finally {
            setIsDeleting(false)
        }
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
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                <div className="flex items-center gap-4">
                    {school.logo ? (
                        <img src={school.logo} alt="" className="w-20 h-20 rounded-xl object-contain border p-2 bg-neutral-50" />
                    ) : (
                        <div className="w-20 h-20 rounded-xl bg-neutral-100 flex items-center justify-center border">
                            <IconSettings className="w-10 h-10 text-neutral-400" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900">{school.name}</h1>
                        <div className="flex items-center gap-2 text-neutral-500 mt-1">
                            <span className="text-sm">{school.districtId?.name || school.district || 'Unassigned District'}</span>
                            <IconChevronRight className="w-4 h-4" />
                            <span className="text-sm">{school.state}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        onClick={() => navigate('/system-admin/schools')}
                        className="rounded-xl"
                    >
                        Back to List
                    </Button>
                    <Button 
                        variant="ghost" 
                        onClick={() => setShowDeleteModal(true)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl gap-2"
                    >
                        <IconTrash className="w-5 h-5" />
                        Delete
                    </Button>
                </div>
            </div>

            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete School"
                description={`Are you sure you want to delete ${school?.name}? This action will permanently remove the school and its data.`}
                callToAction="Delete"
                variant="danger"
                confirmDisabled={isDeleting}
            />

            <Tabs value={activeTab} onValueChange={(val) => setSearchParams({ tab: val })} className="space-y-6">
                <TabsList className="bg-white border border-neutral-200 p-1 rounded-xl shadow-sm">
                    <TabsTrigger value="dashboard" className="rounded-lg gap-2 data-[state=active]:bg-neutral-100">
                        <IconLayoutDashboard className="w-4 h-4" /> Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="admins" className="rounded-lg gap-2 data-[state=active]:bg-neutral-100">
                        <IconShieldCheck className="w-4 h-4" /> Admins
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="rounded-lg gap-2 data-[state=active]:bg-neutral-100">
                        <IconSettings className="w-4 h-4" /> Settings
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="space-y-6 outline-none">
                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        <StatCard title="Students" value={stats?.totalStudents || 0} icon={<IconUsers className="w-6 h-6" />} color="blue" />
                        <StatCard title="Teachers" value={stats?.totalTeachers || 0} icon={<IconUserStar className="w-6 h-6" />} color="green" />
                        <StatCard title="Points" value={stats?.totalPoints || 0} icon={<IconCoins className="w-6 h-6" />} color="yellow" />
                        <StatCard title="Withdrawals" value={-(stats?.totalWithdrawPoints || 0)} icon={<IconArrowBackUp className="w-6 h-6" />} color="red" />
                        <StatCard title="Oopsies" value={-(stats?.totalDeductPoints || 0)} icon={<IconAlertCircle className="w-6 h-6" />} color="orange" />
                        <StatCard title="Feedbacks" value={stats?.totalFeedbackCount || 0} icon={<IconMessage2 className="w-6 h-6" />} color="purple" />
                    </div>

                    <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
                        <div className='lg:col-span-3 space-y-6'>
                            <Card className="border-neutral-200 shadow-sm overflow-hidden rounded-2xl">
                                <CardHeader className="border-b bg-neutral-50/50">
                                    <CardTitle className="text-sm font-semibold text-neutral-500">Academic Year Performance</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <EducationYearChart studentId='' schoolId={id} />
                                </CardContent>
                            </Card>
                        </div>
                        <div className="space-y-6">
                           <TeacherRanks studentId='' schoolId={id} />
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1">
                            <StudentRanks studentId="" schoolId={id} />
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
                        <CardContent className="p-6">
                            <p className="text-sm text-neutral-500">
                                Use the "Invite School Admin" button to assign an administrator to this school. They will receive an email invitation to set up their account.
                            </p>
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
                            <form onSubmit={handleUpdate} className="space-y-8 max-w-2xl">
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-neutral-700">School Name</label>
                                        <Input 
                                            value={formData.name} 
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                            className="rounded-xl border-neutral-300 focus:ring-neutral-900 h-11"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-neutral-700">Address</label>
                                        <Input 
                                            value={formData.address} 
                                            onChange={e => setFormData({...formData, address: e.target.value})}
                                            className="rounded-xl border-neutral-300"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-neutral-700">District Association</label>
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <Select 
                                                    value={formData.districtId} 
                                                    onValueChange={val => setFormData({...formData, districtId: val})}
                                                >
                                                    <SelectTrigger className="rounded-xl h-11">
                                                        <SelectValue placeholder="Select a district" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {districts.length > 0 ? (
                                                            districts.map(d => (
                                                                <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                                                            ))
                                                        ) : (
                                                            <div className="p-2 text-sm text-neutral-500 italic">No districts available</div>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {!formData.districtId && (
                                                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-sm font-medium">
                                                    <IconAlertCircle className="w-4 h-4" />
                                                    Legacy School
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-neutral-500 mt-1">Assigning a district will move this school under that district's management.</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-neutral-700">State</label>
                                            <Input 
                                                value={formData.state} 
                                                onChange={e => setFormData({...formData, state: e.target.value})}
                                                className="rounded-xl border-neutral-300"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-neutral-700">Country</label>
                                            <Input 
                                                value={formData.country} 
                                                onChange={e => setFormData({...formData, country: e.target.value})}
                                                className="rounded-xl border-neutral-300"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-neutral-700">Domain</label>
                                        <Input 
                                            value={formData.domain} 
                                            onChange={e => setFormData({...formData, domain: e.target.value})}
                                            className="rounded-xl border-neutral-300"
                                            placeholder="e.g. school.edu"
                                        />
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
        </div>
    )
}

const StatCard = ({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) => {
    const colorMap: any = {
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
                <div className="text-2xl font-bold text-neutral-900">{value.toLocaleString()}</div>
                <div className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mt-1">{title}</div>
            </CardContent>
        </Card>
    )
}

export default ViewSchool
