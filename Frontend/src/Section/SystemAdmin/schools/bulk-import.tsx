import { useState} from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { bulkImportSchools } from '@/api';
import { useAuth } from '@/authContext';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileUp, CheckCircle, AlertCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function BulkImportSchools() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<any[]>([]);
    const [results, setResults] = useState<{
        success: any[];
        errors: any[];
    } | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setResults(null);

            // Preview file content
            const reader = new FileReader();
            reader.onload = (evt) => {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                // Get first 5 rows for preview
                setPreview(data.slice(0, 6));
            };
            reader.readAsBinaryString(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        // @ts-ignore
        const token = user?.token || localStorage.getItem('token');

        try {
            const response = await bulkImportSchools(file, token);

            if (response.results) {
                setResults(response.results);
                toast({
                    title: "Import Completed",
                    description: `Successfully imported ${response.results.success.length} schools.`,
                });
            } else {
                toast({
                    title: "Import Failed",
                    description: response.message || "Failed to import schools.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An unexpected error occurred during upload.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const downloadTemplate = () => {
        const headers = ['District ID', 'District Name', 'School Name', 'Address', 'State', 'Country'];
        const data = [
            ['DIST-001', 'Example District', 'Elementary School A', '123 Main St', 'California', 'USA'],
            ['DIST-001', 'Example District', 'Middle School B', '456 Oak Ave', 'California', 'USA'],
        ];

        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Schools");
        XLSX.writeFile(wb, "school_import_template.xlsx");
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="h-6 w-6" />
                        Bulk Import Schools
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-blue-900">Instructions</h4>
                            <p className="text-sm text-blue-700 mt-1">
                                Upload an Excel file (.xlsx) containing school details.
                                The system will automatically create districts if they don't exist based on the District ID.
                                Make sure your file matches the template format.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-3 bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
                                onClick={downloadTemplate}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download Template
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="file">Excel File</Label>
                            <Input id="file" type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
                        </div>

                        {preview.length > 0 && (
                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-gray-50 px-4 py-2 border-b text-sm font-medium text-gray-700">
                                    File Preview
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                {preview[0].map((header: any, i: number) => (
                                                    <th key={i} className="px-4 py-2 text-left font-medium text-gray-600">{header}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.slice(1).map((row: any, i: number) => (
                                                <tr key={i} className="border-t">
                                                    {row.map((cell: any, j: number) => (
                                                        <td key={j} className="px-4 py-2 text-gray-600">{cell}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <Button
                            onClick={handleUpload}
                            disabled={!file || loading}
                            className="bg-[#00a58c] hover:bg-[#008f7a]"
                        >
                            {loading ? (
                                "Importing..."
                            ) : (
                                <>
                                    <FileUp className="mr-2 h-4 w-4" />
                                    Start Import
                                </>
                            )}
                        </Button>
                    </div>

                    {results && (
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="font-semibold text-lg">Import Results</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                    <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                                        <CheckCircle className="h-5 w-5" />
                                        Success ({results.success.length})
                                    </div>
                                    <ul className="text-sm text-green-600 max-h-40 overflow-y-auto space-y-1">
                                        {results.success.map((item: any, i: number) => (
                                            <li key={i}>{item.schoolName} in {item.districtName}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                                    <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                                        <AlertCircle className="h-5 w-5" />
                                        Errors ({results.errors.length})
                                    </div>
                                    <ul className="text-sm text-red-600 max-h-40 overflow-y-auto space-y-1">
                                        {results.errors.map((item: any, i: number) => (
                                            <li key={i}>Row {i + 1}: {item.error}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
