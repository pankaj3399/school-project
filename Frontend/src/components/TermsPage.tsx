import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Default Terms content (fallback if API fails)
const DEFAULT_TERMS_CONTENT = `
RADU E-Token™ Pilot Participation Agreement

This Pilot Participation Agreement (the "Agreement") is entered into between the participating teacher/school ("Pilot Participant") and Affective Academy LLC ("Provider"), regarding the use of the RADU E-Token™ System ("System") for educational purposes during a limited pilot period. By signing this document, the Pilot Participant agrees to the terms outlined below.

1. Purpose of the Pilot
The purpose of this pilot is to test the RADU E-Token System in a real-world classroom environment. The System allows educators to recognize and record positive student behaviors and efforts by issuing digital tokens aligned with behavior goals, IEPs, or classroom expectations. The Provider seeks feedback regarding usability, effectiveness, and system performance.

2. Scope of Use
The Pilot Participant will be granted access to a test environment of the RADU E-Token System. Access is limited to use by designated classroom teachers and their students for the duration of the pilot. No commercial use or redistribution of the System is permitted.

3. Data and Privacy
The System may collect data related to token distribution, behavior categories, and classroom interactions. All data will be handled in accordance with applicable data protection laws, including FERPA and COPPA. No personal identifiable information will be shared with third parties. Student email addresses will only be used to deliver tokens and generate usage reports.

4. Confidentiality
The Pilot Participant agrees not to disclose, share, or publicly demonstrate the features, screenshots, or interface of the System without written consent from the Provider. This includes sharing images or functionality through social media, blogs, webinars, or third-party communications.

5. Feedback and Intellectual Property
Feedback provided by Pilot Participants may be used by the Provider to improve the System. All intellectual property rights in the System remain solely with the Provider. Participation does not grant any ownership or license beyond this limited evaluation purpose.

6. Term and Termination
This Agreement shall be effective for the duration of the pilot program, unless terminated earlier by either party with written notice. Upon termination, the Pilot Participant agrees to discontinue use of the System and delete all access materials.

7. Acceptance of Terms
By participating in the pilot program, the Pilot Participant acknowledges and agrees to abide by the terms of this Agreement.
`;

export default function TermsPage() {
    const navigate = useNavigate();
    const [terms, setTerms] = useState<{
        version: string;
        title: string;
        content: string;
        contentHtml?: string;
        effectiveDate: string;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTerms = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/system-admin/terms`);
                if (response.data.terms) {
                    setTerms(response.data.terms);
                }
            } catch (err) {
                console.error('Error fetching terms:', err);
                // Use default terms if API fails
                setTerms({
                    version: '1.0-pilot',
                    title: 'RADU E-Token™ Pilot Participation Agreement',
                    content: DEFAULT_TERMS_CONTENT,
                    effectiveDate: new Date().toISOString()
                });
            } finally {
                setLoading(false);
            }
        };

        fetchTerms();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="mb-6 text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>

                <Card className="shadow-lg border-0">
                    <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                        <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8" />
                            <div>
                                <CardTitle className="text-2xl">
                                    {terms?.title || 'Terms & Conditions of Use'}
                                </CardTitle>
                                <p className="text-blue-100 text-sm mt-1">
                                    Version: {terms?.version || '1.0'} |
                                    Effective: {terms?.effectiveDate
                                        ? new Date(terms.effectiveDate).toLocaleDateString()
                                        : 'Current'}
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        {terms?.contentHtml ? (
                            <div
                                className="prose prose-lg max-w-none"
                                dangerouslySetInnerHTML={{ __html: terms.contentHtml }}
                            />
                        ) : (
                            <div className="prose prose-lg max-w-none whitespace-pre-wrap text-gray-700 leading-relaxed">
                                {terms?.content || DEFAULT_TERMS_CONTENT}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="text-center mt-8 text-sm text-gray-500">
                    <p>© {new Date().getFullYear()} Affective Academy LLC. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}
