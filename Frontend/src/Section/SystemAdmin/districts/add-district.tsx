import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { createDistrict, getDistricts, cloneFromTemplate } from '@/api';
import { useAuth } from '@/authContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle, AlertCircle, Loader2, Copy } from 'lucide-react';
import { getAuthToken } from '@/lib/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { US_STATES, COUNTRIES } from '@/lib/locations';

export default function AddDistrict() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [templateDistrictId, setTemplateDistrictId] = useState('');
    const [existingDistricts, setExistingDistricts] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        state: '',
        city: '',
        country: 'USA',
        contactName: '',
        contactEmail: ''
    });

    useEffect(() => {
        const fetchDistricts = async () => {
            try {
                const token = getAuthToken(user);
                if (token) {
                    const res = await getDistricts(token);
                    if (res.districts) setExistingDistricts(res.districts);
                }
            } catch (err) {
                console.error('Failed to load districts for template selector:', err);
            }
        };
        fetchDistricts();
    }, [user]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.state) {
            toast({
                title: "State Required",
                description: "Please select a state.",
                variant: "destructive"
            });
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.contactEmail && !emailRegex.test(formData.contactEmail)) {
            toast({
                title: "Invalid Email",
                description: "Please enter a valid email address.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);

        // Consistent token retrieval
        const token = getAuthToken(user);
        if (!token) {
            toast({
                title: "Authentication Error",
                description: "You must be signed in to register a new district.",
                variant: "destructive"
            });
            setLoading(false);
            return;
        }

        try {
            let response;
            if (templateDistrictId) {
                response = await cloneFromTemplate({
                    templateDistrictId,
                    newDistrictData: formData
                }, token);
            } else {
                response = await createDistrict(formData, token);
            }

            if (response.district) {
                toast({
                    title: "Success",
                    description: `${response.district.name} has been registered successfully.${templateDistrictId ? ' (Cloned from template)' : ''}`,
                });
                navigate('/system-admin/districts');
            } else {
                // Robust error message extraction
                const errorMsg = typeof response.error === 'string' ? response.error : (response.error?.message || response.message || "Failed to create district");
                toast({
                    title: "Registration Failed",
                    description: errorMsg,
                    variant: "destructive"
                });
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: "A network error occurred. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-3xl mx-auto space-y-6">
            <Button
                variant="ghost"
                onClick={() => navigate('/system-admin/districts')}
                className="pl-0 hover:bg-transparent hover:text-[#00a58c] group"
            >
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Districts
            </Button>

            <Card className="border-0 shadow-xl ring-1 ring-gray-100 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-[#00a58c]/5 to-transparent border-b border-gray-100 p-8">
                    <CardTitle className="text-2xl font-bold text-gray-900">New District Registration</CardTitle>
                    <p className="text-gray-500 mt-1">Register a new educational district to the regional platform.</p>
                </CardHeader>
                <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {existingDistricts.length > 0 && (
                            <div className="space-y-2 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                <Label className="text-sm font-bold text-blue-800 flex items-center gap-2">
                                    <Copy className="h-4 w-4" />
                                    Clone Settings from Existing District (Optional)
                                </Label>
                                <Select
                                    value={templateDistrictId || '_none'}
                                    onValueChange={(val) => setTemplateDistrictId(val === '_none' ? '' : val)}
                                >
                                    <SelectTrigger className="bg-white border-blue-200">
                                        <SelectValue placeholder="Start from scratch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="_none">Start from scratch</SelectItem>
                                        {existingDistricts.map((d: any) => (
                                            <SelectItem key={d._id} value={d._id}>
                                                {d.name} ({d.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-[10px] text-blue-600">
                                    Selecting a template will copy its default settings (token name, max tokens/day, form templates) to the new district.
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-bold text-gray-700">District Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="e.g. Springfield Public Schools"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="border-gray-200 focus:ring-[#00a58c] h-11"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-gray-700">District ID / Code</Label>
                                <Input
                                    value="Auto-generated (D101, D102, …)"
                                    disabled
                                    className="font-mono border-gray-200 bg-gray-50 text-gray-500 h-11"
                                />
                                <p className="text-[10px] text-gray-400 font-medium">ASSIGNED AUTOMATICALLY AFTER CREATION</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="country" className="text-sm font-bold text-gray-700">Country</Label>
                                <Select
                                    value={formData.country}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, country: val }))}
                                >
                                    <SelectTrigger id="country" className="border-gray-200 focus:ring-[#00a58c] h-11">
                                        <SelectValue placeholder="Select country" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {COUNTRIES.map(c => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="state" className="text-sm font-bold text-gray-700">State</Label>
                                <Select
                                    value={formData.state}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, state: val }))}
                                >
                                    <SelectTrigger id="state" className="border-gray-200 focus:ring-[#00a58c] h-11">
                                        <SelectValue placeholder="Select state" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-72">
                                        {US_STATES.map(s => (
                                            <SelectItem key={s.abbreviation} value={s.name}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="city" className="text-sm font-bold text-gray-700">City</Label>
                                <Input
                                    id="city"
                                    name="city"
                                    placeholder="e.g. Springfield"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="border-gray-200 focus:ring-[#00a58c] h-11"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="contactName" className="text-sm font-bold text-gray-700">Primary Contact Name</Label>
                                <Input
                                    id="contactName"
                                    name="contactName"
                                    placeholder="Superintendent or Admin Name"
                                    value={formData.contactName}
                                    onChange={handleChange}
                                    className="border-gray-200 focus:ring-[#00a58c] h-11"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="contactEmail" className="text-sm font-bold text-gray-700">Contact Email</Label>
                                <Input
                                    id="contactEmail"
                                    name="contactEmail"
                                    type="email"
                                    placeholder="admin@district.edu"
                                    value={formData.contactEmail}
                                    onChange={handleChange}
                                    className="border-gray-200 focus:ring-[#00a58c] h-11"
                                />
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                            <p className="text-xs text-amber-700 leading-relaxed">
                                Creating a district will generate a shell for school management. You can add schools manually or via bulk import after the district is created.
                            </p>
                        </div>

                        <div className="pt-6 border-t border-gray-100 flex justify-end">
                            <Button
                                type="submit"
                                className="w-full md:w-auto bg-[#00a58c] hover:bg-[#008f7a] text-white px-12 h-11 font-bold shadow-md hover:shadow-lg transition-all"
                                disabled={loading}
                            >
                                {loading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                                ) : (
                                    <span className="flex items-center">
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Complete Registration
                                    </span>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
