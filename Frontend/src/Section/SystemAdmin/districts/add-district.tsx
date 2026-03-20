import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { createDistrict } from '@/api';
import { useAuth } from '@/authContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function AddDistrict() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [contactEmailError, setContactEmailError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        state: '',
        city: '',
        contactName: '',
        contactEmail: ''
    });

    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const finalValue = name === 'code' ? value.toUpperCase() : value;
        
        if (name === 'contactEmail') {
            if (value && !validateEmail(value)) {
                setContactEmailError('Please enter a valid email address');
            } else {
                setContactEmailError('');
            }
        }
        
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.contactEmail && !validateEmail(formData.contactEmail)) {
            setContactEmailError('Please enter a valid email address');
            return;
        }

        setLoading(true);

        const token = user?.token || localStorage.getItem('token');
        if (!token) {
            toast({
                title: "Error",
                description: "You must be logged in to create a district",
                variant: "destructive"
            });
            setLoading(false);
            return;
        }

        try {
            // Note: createDistrict returns { error } for API failures; 
            // the catch block handles unexpected runtime/network exceptions.
            const response = await createDistrict(formData, token);

            if (response?.district) {
                toast({
                    title: "Success",
                    description: "District created successfully",
                });
                navigate('/system-admin/districts');
            } else {
                const errorMessage = 
                    response?.error?.response?.data?.message || 
                    response?.error?.message || 
                    response?.message || 
                    "Failed to create district";
                toast({
                    title: "Error",
                    description: errorMessage,
                    variant: "destructive"
                });
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred";
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-3xl mx-auto">
            <Button
                variant="ghost"
                onClick={() => navigate('/system-admin/districts')}
                className="mb-6 pl-0 hover:bg-transparent hover:text-[#00a58c]"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Districts
            </Button>

            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                    <CardTitle className="text-2xl font-bold text-gray-900">New District Registration</CardTitle>
                    <p className="text-gray-500">Enter the details for the new educational district.</p>
                </CardHeader>
                <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">District Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="e.g. Springfield Public Schools"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="code">District ID / Code</Label>
                                <Input
                                    id="code"
                                    name="code"
                                    placeholder="e.g. SPS-001"
                                    value={formData.code}
                                    onChange={handleChange}
                                    required
                                    className="uppercase font-mono"
                                />
                                <p className="text-xs text-gray-500">Must be unique across the system</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="state">State</Label>
                                <Input
                                    id="state"
                                    name="state"
                                    placeholder="e.g. California"
                                    value={formData.state}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    name="city"
                                    placeholder="e.g. Springfield"
                                    value={formData.city}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="contactName">Primary Contact Name</Label>
                                <Input
                                    id="contactName"
                                    name="contactName"
                                    placeholder="Superintendent or Admin Name"
                                    value={formData.contactName}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="contactEmail">Contact Email</Label>
                                <Input
                                    id="contactEmail"
                                    name="contactEmail"
                                    type="email"
                                    placeholder="admin@district.edu"
                                    value={formData.contactEmail}
                                    onChange={handleChange}
                                    className={contactEmailError ? "border-red-500" : ""}
                                />
                                {contactEmailError && (
                                    <p className="text-xs text-red-500 mt-1">{contactEmailError}</p>
                                )}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100">
                            <Button
                                type="submit"
                                className="w-full md:w-auto bg-[#00a58c] hover:bg-[#008f7a] text-white"
                                disabled={loading || !!contactEmailError}
                            >
                                {loading ? "Creating..." : (
                                    <span className="flex items-center">
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Create District
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
