import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { getCurrentTerms } from '@/api';

interface Terms {
    title: string;
    content: string;
    contentHtml?: string;
    version: string;
    effectiveDate: string;
}

// Default Terms content (fallback if API fails)
const DEFAULT_TERMS_CONTENT = `RADU E-TOKEN USER REGISTRATION AGREEMENT

By creating an account and selecting "I Agree," I confirm that:

1. I am authorized by my school or educational institution to use the RADU E-Token system.
2. I will use RADU E-Token only for authorized educational purposes and in accordance with my school or district policies.
3. I will protect my login credentials and will not share my account with another person.
4. I will access only the student information and system functions that I am authorized to access.
5. I will not enter unnecessary sensitive student information into the system, including medical information, disability status, IEP or Section 504 information, disciplinary records, biometric information, or other information that RADU E-Token is not designed to collect.
6. I understand that RADU E-Token is a positive-recognition and reinforcement tool. It is not a grading, disciplinary, special-education, medical, mental-health, emergency, threat-assessment, or student-safety decision system.
7. I understand that recognition tokens and balances have no monetary value and may be used only according to the recognition and redemption rules established by my school.
8. I understand that RADU E-Token is currently being used as a pilot service and that features may be modified, improved, added, or removed during the pilot.
9. I understand that my use of the service may generate account, access, security, recognition, and activity records necessary to operate and protect the system.
10. I acknowledge that I have reviewed the RADU E-Token Privacy Policy, which explains how information is collected, used, protected, retained, and disclosed.
11. I agree to comply with the RADU E-Token Terms of Use.
12. I will promptly report suspected unauthorized access, misuse, privacy concerns, or security incidents involving RADU E-Token to my school and/or Affective Academy LLC.
13. I understand that my access may be suspended or terminated if my authorization ends, if I violate these requirements, or if suspension is reasonably necessary to protect students, users, data, or the security of the system.
14. I understand that my school or district remains responsible for determining how RADU E-Token is used for educational purposes and which users and students are authorized to participate.

By selecting "I Agree," I acknowledge that I have read and agree to this User Registration Agreement and the RADU E-Token Terms of Use, and that I have reviewed the RADU E-Token Privacy Policy.

Affective Academy LLC
Littleton, Colorado 80127
Privacy: privacy@theraduetoken.com
Administration: admin@theraduetoken.com`;

export default function TermsPage({ isRegistration = false, terms: propTerms }: { isRegistration?: boolean, terms?: Terms | null }) {
    const navigate = useNavigate();
    const [terms, setTerms] = useState<Terms | null>(propTerms || null);
    const [loading, setLoading] = useState(!propTerms);

    useEffect(() => {
        if (propTerms) {
            setTerms(propTerms);
            setLoading(false);
            return;
        }

        const fetchTerms = async () => {
            try {
                const data = await getCurrentTerms();
                if (data.terms) {
                    setTerms(data.terms);
                } else {
                    throw new Error("No terms found");
                }
            } catch (error) {
                console.error('Error fetching terms:', error);
                // Use default terms if API fails
                setTerms({
                    version: 'registration-2026-09',
                    title: 'RADU E-Token User Registration Agreement',
                    content: DEFAULT_TERMS_CONTENT,
                    effectiveDate: new Date().toISOString()
                });
            } finally {
                setLoading(false);
            }
        };

        fetchTerms();
    }, [propTerms]);

    const safeHtml = useMemo(() => {
        if (terms?.contentHtml) {
            return DOMPurify.sanitize(terms.contentHtml);
        }
        return '';
    }, [terms?.contentHtml]);

    if (loading) {
        return (
            <div className={`flex items-center justify-center ${isRegistration ? 'p-8' : 'min-h-screen bg-gray-50'}`}>
                <Loader2 className="h-8 w-8 animate-spin text-[#00a58c]" />
            </div>
        );
    }

    if (isRegistration) {
        return (
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                {terms?.contentHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
                ) : (
                    <div className="whitespace-pre-wrap">
                        {terms?.content || DEFAULT_TERMS_CONTENT}
                    </div>
                )}
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
                    <CardHeader className="bg-gradient-to-r from-[#00a58c] to-[#007a68] text-white rounded-t-lg">
                        <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8" />
                            <div>
                                <CardTitle className="text-2xl">
                                    {terms?.title || 'Terms & Conditions of Use'}
                                </CardTitle>
                                <p className="text-teal-100 text-sm mt-1">
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
                                dangerouslySetInnerHTML={{ __html: safeHtml }}
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
