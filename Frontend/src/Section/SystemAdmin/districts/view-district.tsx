import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams, useNavigate } from 'react-router-dom';
import { getDistrictById } from '@/api';
import { useAuth } from '@/authContext';
import { ArrowLeft, Building2, School, Users, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ViewDistrict() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [district, setDistrict] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDistrict = async () => {
            // @ts-ignore
            const token = user?.token || localStorage.getItem('token');
            if (token && id) {
                const data = await getDistrictById(id, token);
                if (data.district) {
                    setDistrict(data); // Contains district, schools, adminCount
                }
            }
            setLoading(false);
        };

        fetchDistrict();
    }, [id, user]);

    if (loading) return <div className="p-8">Loading...</div>;
    if (!district) return <div className="p-8">District not found</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <Button
                variant="ghost"
                onClick={() => navigate('/system-admin/districts')}
                className="mb-6 pl-0 hover:bg-transparent hover:text-[#00a58c]"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Districts
            </Button>

            {/* Header Info */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Building2 className="h-8 w-8 text-[#00a58c]" />
                        {district.district.name}
                    </h1>
                    <p className="text-gray-500 mt-2 flex items-center gap-2">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-sm text-gray-700">
                            {district.district.code}
                        </span>
                        • {district.district.state}, {district.district.country}
                    </p>
                </div>
                <Button variant="outline">Edit District</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <School className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total Schools</p>
                            <h3 className="text-2xl font-bold">{district.schools?.length || 0}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">District Admins</p>
                            <h3 className="text-2xl font-bold">{district.adminCount || 0}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                            <Settings className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Status</p>
                            <h3 className="text-2xl font-bold capitalize">{district.district.subscriptionStatus}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="schools" className="w-full">
                <TabsList>
                    <TabsTrigger value="schools">Schools</TabsTrigger>
                    <TabsTrigger value="admins">Admins</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                <TabsContent value="schools" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Registered Schools</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {district.schools?.length > 0 ? (
                                <div className="space-y-4">
                                    {district.schools.map((school: any) => (
                                        <div key={school._id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
                                            <div>
                                                <h4 className="font-semibold">{school.name}</h4>
                                                <p className="text-sm text-gray-500">{school.address || "No address provided"}</p>
                                            </div>
                                            <Button variant="ghost" size="sm">View</Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    No schools registered in this district yet.
                                    <div className="mt-4">
                                        <Button variant="outline" size="sm">Add School Manualy</Button>
                                        <Button variant="outline" size="sm" className="ml-2">Bulk Import</Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="admins">
                    <Card>
                        <CardContent className="p-8 text-center text-gray-500">
                            Admin management coming soon.
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
