import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
    FileText, 
    Save, 
    History, 
    CheckCircle2, 
    AlertCircle,
    Loader2
} from 'lucide-react';
import { getCurrentTerms, updateTerms } from '@/api';
import { useAuth } from '@/authContext';
import { getAuthToken } from '@/lib/auth';

interface TermsData {
    title: string;
    content: string;
    version: string;
    isActive: boolean;
}

export default function TermsManagement() {
    const { user } = useAuth();
    const [terms, setTerms] = useState<TermsData>({
        title: '',
        content: '',
        version: '',
        isActive: true
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const fetchTerms = async () => {
            try {
                const data = await getCurrentTerms();
                if (data.terms) {
                    setTerms({
                        title: data.terms.title || '',
                        content: data.terms.content || '',
                        version: data.terms.version || '',
                        isActive: data.terms.isActive ?? true
                    });
                } else if (data.error) {
                    setMessage({ type: 'error', text: data.error.message || 'Failed to load terms' });
                }
            } catch (error: any) {
                console.error('Error fetching terms:', error);
                setMessage({ type: 'error', text: 'Network error while loading terms' });
            } finally {
                setLoading(false);
            }
        };

        fetchTerms();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const token = getAuthToken(user);
            if (!token) {
                setMessage({ type: 'error', text: 'Authentication required' });
                setSaving(false);
                return;
            }
            const response = await updateTerms(terms, token);

            if (!response.error) {
                setMessage({ type: 'success', text: 'Terms updated successfully' });
            } else {
                const errorMsg = response.error?.response?.data?.message || response.error?.message || 'Failed to update terms';
                throw new Error(errorMsg);
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Error saving terms. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-[#00a58c]" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Terms of Use Management</h1>
                    <p className="text-gray-500 mt-2">Update the legal agreement that all users must accept.</p>
                </div>
                <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="bg-[#00a58c] hover:bg-[#008f7a]"
                >
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </div>

            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                    {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="md:col-span-2 border-0 shadow-sm ring-1 ring-gray-100">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <FileText className="h-5 w-5 text-gray-400" />
                            Content Editor
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Document Title</label>
                            <Input 
                                value={terms.title} 
                                onChange={(e) => setTerms({ ...terms, title: e.target.value })}
                                placeholder="e.g., Pilot Participation Agreement"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Contract Content (Markdown supported)</label>
                            <Textarea 
                                value={terms.content} 
                                onChange={(e) => setTerms({ ...terms, content: e.target.value })}
                                className="min-h-[500px] font-mono text-sm"
                                placeholder="Enter terms of use content here..."
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="border-0 shadow-sm ring-1 ring-gray-100">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <History className="h-5 w-5 text-gray-400" />
                                Versioning
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Version ID</label>
                                <Input 
                                    value={terms.version} 
                                    onChange={(e) => setTerms({ ...terms, version: e.target.value })}
                                    placeholder="e.g., 2.1-beta"
                                />
                                <p className="text-xs text-gray-500 italic">Incrementing the version will force all users to re-accept the terms on their next login.</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-50 border-0 shadow-sm ring-blue-100 p-6">
                        <h4 className="font-bold text-blue-900 flex items-center gap-2 mb-2">
                            <CheckCircle2 className="h-5 w-5" />
                            Live Preview
                        </h4>
                        <p className="text-sm text-blue-700 mb-4">You can see how this will look to users by visiting the public terms page.</p>
                        <Button 
                            variant="outline" 
                            className="w-full bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
                            onClick={() => window.open('/terms', '_blank')}
                        >
                            Open Preview
                        </Button>
                    </Card>
                </div>
            </div>
        </div>
    );
}
