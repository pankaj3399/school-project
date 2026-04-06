import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getDistrictById, updateDistrict, deleteSchool, reInviteAdmin } from '@/api';
import { useAuth } from '@/authContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Building2, School, Users, Globe, MapPin, Mail, Phone, CheckCircle2, Loader2 } from 'lucide-react';
import { getAuthToken } from '@/lib/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { InviteAdminDialog } from '@/components/InviteAdminDialog';
import { EditAdminDialog } from '@/components/EditAdminDialog';
import { Role } from '@/enum';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export default function ViewDistrict() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'schools';
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editData, setEditData] = useState<any>(null);


    useEffect(() => {
        const fetchDistrict = async () => {
            const token = getAuthToken(user);
            if (token && id) {
                try {
                    const response = await getDistrictById(id, token);
                    if (response.district) {
                        setData(response);
                        setEditData({
                            name: response.district.name,
                            contactEmail: response.district.contactEmail || '',
                            contactPhone: response.district.contactPhone || '',
                            additionalPhone: response.district.additionalPhone || '',
                            website: response.district.website || '',
                            logo: response.district.logo || '',
                            address: response.district.address || '',
                            city: response.district.city || '',
                            zipCode: response.district.zipCode || '',
                            subscriptionStatus: response.district.subscriptionStatus
                        });
                    } else if (response.error) {
                        const errorMsg = typeof response.error === 'string' ? response.error : (response.error.message || "Failed to load district data.");
                        toast({
                            title: "Error",
                            description: errorMsg,
                            variant: "destructive"
                        });
                    }
                } catch (error) {
                    console.error('Error fetching district:', error);
                    toast({
                        title: "Error",
                        description: "Network error while fetching district.",
                        variant: "destructive"
                    });
                }
            }
            setLoading(false);
        };

        fetchDistrict();
    }, [id, user]);

    const handleUpdate = async () => {
        if (!id) return;
        setSaving(true);
        try {
            const token = getAuthToken(user);
            if (!token) {
                toast({
                    title: "Authentication Error",
                    description: "You must be signed in to update district settings.",
                    variant: "destructive"
                });
                setSaving(false);
                return;
            }
            const response = await updateDistrict(id, editData, token);
            if (response.district) {
                setData({ ...data, district: response.district });
                toast({
                    title: "Success",
                    description: response.message || "District settings updated successfully.",
                });
            } else {
                const errorMsg = typeof response.error === 'string' ? response.error : (response.error?.message || "Update failed");
                throw new Error(errorMsg);
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update district settings.",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-[#00a58c]" />
        </div>
    );

    const handleDeleteSchool = async (schoolId: string, schoolName: string) => {
        if (!window.confirm(`Are you sure you want to delete ${schoolName}? This action cannot be undone.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token') || '';
            const response = await deleteSchool(schoolId, token);
            if (response.error) {
                const errorMsg = typeof response.error === 'string' ? response.error : (response.error.message || "Failed to delete school");
                toast({
                    title: "Error",
                    description: errorMsg,
                    variant: "destructive"
                });
            } else {
                toast({
                    description: `${schoolName} deleted successfully.`,
                });
                // Update local state to remove the school
                setData((prev: any) => ({
                    ...prev,
                    schools: prev.schools.filter((s: any) => s._id !== schoolId)
                }));
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "An unexpected error occurred while deleting the school.",
                variant: "destructive"
            });
        }
    };

    const handleReInvite = async (adminId: string, adminName: string) => {
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
                toast({
                    title: "Success",
                    description: `Invitation resent to ${adminName}.`,
                });
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "An error occurred while resending the invitation.",
                variant: "destructive"
            });
        }
    };

    if (!data || !data.district) return (
        <div className="p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900">District not found</h2>
            <Button variant="link" onClick={() => navigate('/system-admin/districts')}>Return to list</Button>
        </div>
    );

    const { district, schools, adminCount, admins = [] } = data;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <Button
                variant="ghost"
                onClick={() => navigate('/system-admin/districts')}
                className="pl-0 hover:bg-transparent hover:text-[#00a58c] group"
            >
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Districts
            </Button>

            {/* Header Info */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-[#00a58c]/10 text-[#00a58c] rounded-2xl">
                            <Building2 className="h-8 w-8" />
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{district.name}</h1>
                            <div className="flex items-center gap-3 text-gray-500 font-medium">
                                <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-gray-600">{district.code}</span>
                                <span className="text-gray-300">•</span>
                                <div className="flex items-center gap-1 text-sm">
                                    {district.state}, {district.country || 'USA'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button 
                        variant="outline" 
                        onClick={() => {
                            if (!district.website) return;
                            let url = district.website;
                            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                                url = 'https://' + url;
                            }
                            window.open(url, '_blank', 'noopener,noreferrer');
                        }} 
                        disabled={!district.website}
                    >
                        <Globe className="h-4 w-4 mr-2" />
                        Website
                    </Button>
                                <Button
                                    className="bg-[#00a58c] hover:bg-[#008f7a]"
                                    onClick={() => setSearchParams({ tab: 'admins' })}
                                >
                                    Manage Admins
                                </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-0 shadow-sm ring-1 ring-gray-100">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <School className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Schools</p>
                            <h3 className="text-2xl font-bold text-gray-900">{schools?.length || 0}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm ring-1 ring-gray-100">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">District Admins</p>
                            <h3 className="text-2xl font-bold text-gray-900">{adminCount || 0}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm ring-1 ring-gray-100 border-l-4 border-l-[#00a58c]">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-[#00a58c]/10 text-[#00a58c] rounded-xl">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Status</p>
                            <h3 className="text-2xl font-bold text-gray-900 capitalize">{district.subscriptionStatus}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs 
                value={activeTab} 
                onValueChange={(value) => setSearchParams({ tab: value })} 
                className="w-full"
            >
                <TabsList className="bg-gray-100/50 p-1 rounded-xl">
                    <TabsTrigger value="schools" className="rounded-lg px-6">Schools</TabsTrigger>
                    <TabsTrigger value="admins" className="rounded-lg px-6">Admins</TabsTrigger>
                    <TabsTrigger value="settings" className="rounded-lg px-6">Settings</TabsTrigger>
                </TabsList>
                
                <TabsContent value="schools" className="mt-6">
                    <Card className="border-0 shadow-sm ring-1 ring-gray-100">
                        <CardHeader className="border-b bg-gray-50/30 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">District Schools</CardTitle>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => navigate(`/system-admin/schools/new?districtId=${id}`)}>Add School</Button>
                                <Button variant="outline" size="sm" className="bg-white" onClick={() => navigate('/system-admin/schools/import')}>Bulk Import</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {schools?.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50/50">
                                                <TableHead className="font-bold text-gray-700">SCHOOL NAME</TableHead>
                                                <TableHead className="font-bold text-gray-700">Address</TableHead>
                                                <TableHead className="font-bold text-gray-700 text-center">TEACHERS</TableHead>
                                                <TableHead className="font-bold text-gray-700 text-center">STUDENTS</TableHead>
                                                <TableHead className="font-bold text-gray-700 text-center">TOKENS</TableHead>
                                                <TableHead className="font-bold text-gray-700 text-center">WITHDRAWALS</TableHead>
                                                <TableHead className="font-bold text-gray-700 text-center">OOPSIES</TableHead>
                                                <TableHead className="font-bold text-gray-700 text-center">FEEDBACK</TableHead>
                                                <TableHead className="font-bold text-gray-700 text-right">ACTIONS</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {schools.map((school: any) => (
                                                <TableRow key={school._id} className="hover:bg-gray-50/50 transition-colors">
                                                    <TableCell className="font-bold text-gray-900">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1.5 bg-gray-100 rounded-lg">
                                                                <School className="h-4 w-4 text-gray-500" />
                                                            </div>
                                                            {school.name}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="max-w-[200px]">
                                                        <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                                                            <MapPin className="h-3 w-3 shrink-0" />
                                                            {school.address || "No address"}
                                                        </p>
                                                    </TableCell>
                                                    <TableCell className="text-center font-medium">{school.teacherCount?.toLocaleString() || 0}</TableCell>
                                                    <TableCell className="text-center font-medium">{school.studentCount?.toLocaleString() || 0}</TableCell>
                                                    <TableCell className="text-center font-bold text-[#00a58c]">{school.tokens?.toLocaleString() || 0}</TableCell>
                                                    <TableCell className="text-center font-bold text-amber-600">{school.withdrawals?.toLocaleString() || 0}</TableCell>
                                                    <TableCell className="text-center font-bold text-red-500">{school.oopsies?.toLocaleString() || 0}</TableCell>
                                                    <TableCell className="text-center font-medium">
                                                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                                            {school.feedbackCount?.toLocaleString() || 0}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <Button 
                                                                variant="link" 
                                                                size="sm"
                                                                onClick={() => navigate(`/system-admin/schools/${school._id}`)}
                                                                className="text-[#00a58c] hover:text-[#008f7a] font-bold text-xs"
                                                            >
                                                                View
                                                            </Button>
                                                            <Button 
                                                                variant="link" 
                                                                size="sm"
                                                                onClick={() => handleDeleteSchool(school._id, school.name)}
                                                                className="text-red-500 hover:text-red-600 font-bold text-xs"
                                                            >
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500 bg-gray-50/50 rounded-xl border-2 border-dashed m-6">
                                    <School className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                                    <p className="font-medium">No schools registered in this district yet.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="admins" className="mt-6">
                    <Card className="border-0 shadow-sm ring-1 ring-gray-100">
                        <CardHeader className="border-b bg-gray-50/30 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">District Administrators</CardTitle>
                            <InviteAdminDialog districtId={id} role={Role.DistrictAdmin} label="Invite District Admin" />
                        </CardHeader>
                        <CardContent className="p-6">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50/50">
                                        <TableHead className="font-bold text-gray-700">SCHOOL NAME</TableHead>
                                        <TableHead className="font-bold text-gray-700">ADDRESS</TableHead>
                                        <TableHead className="font-bold text-gray-700">POSITION</TableHead>
                                        <TableHead className="font-bold text-gray-700">EMAIL</TableHead>
                                        <TableHead className="font-bold text-gray-700">PHONE</TableHead>
                                        <TableHead className="font-bold text-gray-700">ROLE</TableHead>
                                        <TableHead className="font-bold text-gray-700">STATUS</TableHead>
                                        <TableHead className="font-bold text-gray-700 text-right">ACTIONS</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {admins && admins.length > 0 ? (
                                        admins.map((admin: any) => (
                                            <TableRow key={admin._id} className="hover:bg-gray-50/50 transition-colors">
                                                <TableCell className="font-medium">
                                                    {admin.schoolId ? (
                                                        <div className="flex items-center gap-2">
                                                            <School className="w-3.5 h-3.5 text-neutral-400" />
                                                            {admin.schoolId.name}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 italic">District Office</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-gray-600 truncate max-w-[150px]">
                                                    {admin.address || <span className="text-gray-400 italic">N/A</span>}
                                                </TableCell>
                                                <TableCell className="text-gray-600">
                                                    {admin.position || 'Other'}
                                                </TableCell>
                                                <TableCell className="text-gray-600">{admin.email}</TableCell>
                                                <TableCell className="text-gray-600">
                                                    {admin.phone || <span className="text-gray-400 italic">N/A</span>}
                                                </TableCell>
                                                <TableCell className="text-gray-600">
                                                    <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded text-[10px] font-bold uppercase tracking-wider">
                                                        {admin.contactRole || 'Leadership'}
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
                                                <TableCell className="text-gray-600">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <EditAdminDialog 
                                                            admin={admin} 
                                                            onSuccess={() => {
                                                                const token = getAuthToken(user);
                                                                if (token && id) {
                                                                    getDistrictById(id, token).then(res => {
                                                                        if (res.district) setData(res);
                                                                    });
                                                                }
                                                            }} 
                                                        />
                                                        {!admin.hasCompletedRegistration && (
                                                            <Button 
                                                                variant="link" 
                                                                onClick={() => handleReInvite(admin._id, admin.name)}
                                                                className="h-8 px-2 text-[#00a58c] hover:text-[#008f7a] hover:bg-[#00a58c]/10 text-xs font-bold"
                                                            >
                                                                Invite
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                                No administrators found for this district.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="mt-6">
                    <Card className="border-0 shadow-sm ring-1 ring-gray-100">
                        <CardHeader className="border-b bg-gray-50/10">
                            <CardTitle className="text-lg font-bold text-gray-800">General Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-10">
                            {/* Basic Info & Branding */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold text-[#00a58c] uppercase tracking-wider">Branding & Identity</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-gray-700">District Name</Label>
                                        <Input 
                                            value={editData?.name} 
                                            onChange={(e) => setEditData({...editData, name: e.target.value})}
                                            placeholder="e.g. Legacy Schools District"
                                            className="h-11 bg-white border-gray-200"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-gray-700">District Logo URL</Label>
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <Input 
                                                    value={editData?.logo} 
                                                    onChange={(e) => setEditData({...editData, logo: e.target.value})}
                                                    placeholder="https://example.com/logo.png"
                                                    className="h-11 bg-white border-gray-200"
                                                />
                                            </div>
                                            {editData?.logo && (
                                                <div className="h-11 w-11 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                                                    <img src={editData.logo} alt="Logo preview" className="max-h-full max-w-full object-contain" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold text-[#00a58c] uppercase tracking-wider">Contact Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-gray-700">Main Contact Phone</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input 
                                                value={editData?.contactPhone} 
                                                onChange={(e) => setEditData({...editData, contactPhone: e.target.value})}
                                                placeholder="(555) 000-0000"
                                                className="pl-10 h-11 bg-white border-gray-200"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-gray-700">Additional Phone</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input 
                                                value={editData?.additionalPhone} 
                                                onChange={(e) => setEditData({...editData, additionalPhone: e.target.value})}
                                                placeholder="(555) 000-0000"
                                                className="pl-10 h-11 bg-white border-gray-200"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-gray-700">Contact Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input 
                                                value={editData?.contactEmail} 
                                                onChange={(e) => setEditData({...editData, contactEmail: e.target.value})}
                                                placeholder="email@example.edu"
                                                className="pl-10 h-11 bg-white border-gray-200"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-gray-700">Official Website</Label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input 
                                                value={editData?.website} 
                                                onChange={(e) => setEditData({...editData, website: e.target.value})}
                                                placeholder="https://www.district.edu"
                                                className="pl-10 h-11 bg-white border-gray-200"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Location Section */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold text-[#00a58c] uppercase tracking-wider">Main Office Address</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label className="text-sm font-bold text-gray-700">Street Address</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input 
                                                value={editData?.address} 
                                                onChange={(e) => setEditData({...editData, address: e.target.value})}
                                                placeholder="e.g. 100 Main St"
                                                className="pl-10 h-11 bg-white border-gray-200"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-gray-700">City</Label>
                                        <Input 
                                            value={editData?.city} 
                                            onChange={(e) => setEditData({...editData, city: e.target.value})}
                                            placeholder="e.g. Buffalo"
                                            className="h-11 bg-white border-gray-200"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-gray-700">Zip Code</Label>
                                        <Input 
                                            value={editData?.zipCode} 
                                            onChange={(e) => setEditData({...editData, zipCode: e.target.value})}
                                            placeholder="e.g. 14201"
                                            className="h-11 bg-white border-gray-200"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Account Status Section */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold text-[#00a58c] uppercase tracking-wider">Account Maintenance</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-gray-700">Subscription Status</Label>
                                        <Select 
                                            value={editData?.subscriptionStatus} 
                                            onValueChange={(v) => setEditData({...editData, subscriptionStatus: v})}
                                        >
                                            <SelectTrigger className="h-11 bg-white border-gray-200">
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="paused">Paused</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="suspended">Suspended</SelectItem>
                                                <SelectItem value="expired">Expired</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 pt-8 border-t border-gray-100 flex justify-end">
                                <Button 
                                    onClick={handleUpdate} 
                                    disabled={saving}
                                    className="bg-[#00a58c] hover:bg-[#008f7a] h-12 px-10 rounded-lg font-bold shadow-lg shadow-[#00a58c]/20 transition-all active:scale-95"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving Changes...
                                        </>
                                    ) : (
                                        "Save Changes"
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
