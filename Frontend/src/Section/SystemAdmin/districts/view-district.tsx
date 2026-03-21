import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams, useNavigate } from 'react-router-dom';
import { getDistrictById, updateDistrict } from '@/api';
import { useAuth } from '@/authContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Building2, School, Users, Globe, MapPin, Mail, Phone, CheckCircle2, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ViewDistrict() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editData, setEditData] = useState<any>(null);

    const getAuthToken = () => {
        // @ts-ignore
        return user?.token || localStorage.getItem('token');
    };

    useEffect(() => {
        const fetchDistrict = async () => {
            const token = getAuthToken();
            if (token && id) {
                try {
                    const response = await getDistrictById(id, token);
                    if (response.district) {
                        setData(response);
                        setEditData({
                            name: response.district.name,
                            contactEmail: response.district.contactEmail,
                            contactPhone: response.district.contactPhone,
                            subscriptionStatus: response.district.subscriptionStatus
                        });
                    } else if (response.error) {
                        toast({
                            title: "Error",
                            description: response.error.message || "Failed to load district data.",
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
            const token = getAuthToken();
            const response = await updateDistrict(id, editData, token || '');
            if (response.district) {
                setData({ ...data, district: response.district });
                toast({
                    title: "Success",
                    description: "District settings updated successfully.",
                });
            } else {
                throw new Error(response.error?.message || "Update failed");
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
    
    if (!data || !data.district) return (
        <div className="p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900">District not found</h2>
            <Button variant="link" onClick={() => navigate('/system-admin/districts')}>Return to list</Button>
        </div>
    );

    const { district, schools, adminCount } = data;

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
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                                {district.name}
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs font-bold text-gray-600 tracking-wider">
                                    {district.code}
                                </span>
                                <span className="text-gray-400">•</span>
                                <p className="text-sm text-gray-500 font-medium flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {district.state}, {district.country}
                                </p>
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
                    <Button className="bg-[#00a58c] hover:bg-[#008f7a]">
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

            <Tabs defaultValue="schools" className="w-full">
                <TabsList className="bg-gray-100/50 p-1 rounded-xl">
                    <TabsTrigger value="schools" className="rounded-lg px-6">Schools</TabsTrigger>
                    <TabsTrigger value="admins" className="rounded-lg px-6">Admins</TabsTrigger>
                    <TabsTrigger value="settings" className="rounded-lg px-6">Settings</TabsTrigger>
                </TabsList>
                
                <TabsContent value="schools" className="mt-6">
                    <Card className="border-0 shadow-sm ring-1 ring-gray-100">
                        <CardHeader className="border-b bg-gray-50/30">
                            <CardTitle className="text-lg">District Schools</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {schools?.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {schools.map((school: any) => (
                                        <div key={school._id} className="flex justify-between items-center p-4 border rounded-xl hover:shadow-md transition-shadow bg-white">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-gray-50 rounded-lg flex items-center justify-center border">
                                                    <School className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{school.name}</h4>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {school.address || "No address provided"}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => navigate(`/system-admin/schools/${school._id}`)}
                                                className="hover:bg-[#00a58c]/10 hover:text-[#00a58c]"
                                            >
                                                View
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500 bg-gray-50/50 rounded-xl border-2 border-dashed">
                                    <School className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                                    <p className="font-medium">No schools registered in this district yet.</p>
                                    <div className="mt-6 flex justify-center gap-3">
                                        <Button variant="outline" size="sm">Add School Manually</Button>
                                        <Button variant="outline" size="sm" className="bg-white">Bulk Import</Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="admins" className="mt-6">
                    <Card className="border-0 shadow-sm ring-1 ring-gray-100">
                        <CardContent className="p-12 text-center text-gray-500 space-y-4">
                            <Users className="h-12 w-12 mx-auto text-gray-300" />
                            <div className="max-w-xs mx-auto">
                                <h4 className="font-bold text-gray-900 mb-1">Admin Management</h4>
                                <p className="text-sm">Manage district-level administrators and their permissions here.</p>
                            </div>
                            <Button variant="outline" className="mt-4">
                                Invite Administrator
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="mt-6">
                    <Card className="border-0 shadow-sm ring-1 ring-gray-100">
                        <CardHeader className="border-b bg-gray-50/30">
                            <CardTitle className="text-lg">General Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-gray-700">District Name</Label>
                                        <Input 
                                            value={editData?.name} 
                                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                            className="border-gray-200 focus:ring-[#00a58c]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-gray-700">Contact Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input 
                                                value={editData?.contactEmail} 
                                                onChange={(e) => setEditData({ ...editData, contactEmail: e.target.value })}
                                                className="pl-10 border-gray-200 focus:ring-[#00a58c]"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-gray-700">Contact Phone</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input 
                                                value={editData?.contactPhone || ''} 
                                                onChange={(e) => setEditData({ ...editData, contactPhone: e.target.value })}
                                                className="pl-10 border-gray-200 focus:ring-[#00a58c]"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-gray-700">Status</Label>
                                        <select 
                                            className="w-full h-10 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00a58c]/20 transition-shadow"
                                            value={editData?.subscriptionStatus}
                                            onChange={(e) => setEditData({ ...editData, subscriptionStatus: e.target.value })}
                                        >
                                            <option value="active">Active</option>
                                            <option value="suspended">Suspended</option>
                                            <option value="expired">Expired</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-6 border-t flex justify-end">
                                <Button 
                                    className="bg-[#00a58c] hover:bg-[#008f7a] px-8"
                                    onClick={handleUpdate}
                                    disabled={saving}
                                >
                                    {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
