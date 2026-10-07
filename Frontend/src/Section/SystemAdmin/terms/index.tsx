import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { getCurrentTerms, updateTerms } from '@/api';
import { useAuth } from '@/authContext';
import { getAuthToken } from '@/lib/auth';
import { getErrorMessage } from "@/lib/errors"

type LegalKind = 'registration' | 'terms' | 'privacy';

const KINDS: { id: LegalKind; label: string; help: string }[] = [
    {
        id: 'registration',
        label: 'Registration agreement',
        help: 'Shown only while someone is creating an account. It is not published on the website.',
    },
    {
        id: 'terms',
        label: 'Terms of Use',
        help: 'Published at the website Terms link. One document for the whole platform.',
    },
    {
        id: 'privacy',
        label: 'Privacy Policy',
        help: 'Published at the website Privacy link. One document for the whole platform.',
    },
];

interface TermsData {
    title: string;
    content: string;
    version: string;
}

const emptyDoc = (): TermsData => ({ title: '', content: '', version: '' });

export default function TermsManagement() {
    const { user } = useAuth();
    const [kind, setKind] = useState<LegalKind>('registration');
    const [docs, setDocs] = useState<Record<LegalKind, TermsData>>({
        registration: emptyDoc(),
        terms: emptyDoc(),
        privacy: emptyDoc(),
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const fetchDocs = async () => {
            try {
                const [registration, terms, privacy] = await Promise.all([
                    getCurrentTerms('registration'),
                    getCurrentTerms('terms'),
                    getCurrentTerms('privacy'),
                ]);
                const read = (data: any): TermsData => ({
                    title: data?.terms?.title || '',
                    content: data?.terms?.content || '',
                    version: data?.terms?.version || '',
                });
                setDocs({
                    registration: read(registration),
                    terms: read(terms),
                    privacy: read(privacy),
                });
            } catch (error) {
                console.error('Error fetching legal documents:', error);
                setMessage({ type: 'error', text: 'Could not load the legal documents.' });
            } finally {
                setLoading(false);
            }
        };
        fetchDocs();
    }, []);

    const current = docs[kind];
    const meta = KINDS.find((item) => item.id === kind)!;

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
            const response = await updateTerms({ ...current, kind }, token);
            if (response.error) {
                throw new Error(getErrorMessage(response, 'Failed to save this document'));
            }
            if (response.terms) {
                setDocs((prev) => ({
                    ...prev,
                    [kind]: {
                        title: response.terms.title || current.title,
                        content: response.terms.content || current.content,
                        version: response.terms.version || current.version,
                    },
                }));
            }
            setMessage({ type: 'success', text: 'Saved. This version is now the live document.' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Could not save. Please try again.' });
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
            <div className="flex justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Legal documents</h1>
                    <p className="text-gray-500 mt-2">Affective Academy documents for the whole RADU E-Token platform. Only a system admin can change them.</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#00a58c] hover:bg-[#008f7a]"
                >
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save
                </Button>
            </div>

            <div className="flex flex-wrap gap-2">
                {KINDS.map((item) => (
                    <Button
                        key={item.id}
                        type="button"
                        variant={kind === item.id ? "default" : "outline"}
                        className={kind === item.id ? "bg-[#00a58c] hover:bg-[#008f7a]" : ""}
                        onClick={() => { setKind(item.id); setMessage(null); }}
                    >
                        {item.label}
                    </Button>
                ))}
            </div>

            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                    {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    {message.text}
                </div>
            )}

            <Card className="border-0 shadow-sm ring-1 ring-gray-100">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">{meta.label}</CardTitle>
                    <p className="text-sm text-gray-500">{meta.help}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Title</label>
                        <Input
                            value={current.title}
                            onChange={(e) => setDocs({ ...docs, [kind]: { ...current, title: e.target.value } })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Version id</label>
                        <Input
                            value={current.version}
                            onChange={(e) => setDocs({ ...docs, [kind]: { ...current, version: e.target.value } })}
                            placeholder={kind === 'registration' ? 'registration-2026-09' : `${kind}-1.0`}
                        />
                        <p className="text-xs text-gray-500">
                            {kind === 'registration'
                                ? 'Use a new version id when you change the agreement. People registering after that must accept the new text.'
                                : 'Use a new version id each time you save. Until text is saved here, the website keeps showing the existing PDF.'}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Text</label>
                        <Textarea
                            value={current.content}
                            onChange={(e) => setDocs({ ...docs, [kind]: { ...current, content: e.target.value } })}
                            className="min-h-[500px] font-mono text-sm"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
