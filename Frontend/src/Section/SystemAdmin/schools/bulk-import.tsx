import { useState} from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { bulkImportSchools } from '@/api';
import { useAuth } from '@/authContext';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileUp, CheckCircle, AlertCircle, Download, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface SuccessItem {
    schoolName: string;
    districtName: string;
}

interface ErrorItem {
    row: number | any;
    error: string;
}

interface ImportResults {
    success: SuccessItem[];
    errors: ErrorItem[];
}

export default function BulkImportSchools() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<any[]>([]);
    const [results, setResults] = useState<ImportResults | null>(null);

    const getAuthToken = () => {
        // @ts-ignore
        return user?.token || localStorage.getItem('token');
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setResults(null);

            const reader = new FileReader();
            reader.onload = (evt) => {
                const data = evt.target?.result;
                const wb = XLSX.read(data, { type: 'array' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });
                setPreview(jsonData.slice(0, 6));
            };
            reader.readAsArrayBuffer(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        const token = getAuthToken();

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
            <Card className="border-0 shadow-sm ring-1 ring-gray-100">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="h-6 w-6 text-[#00a58c]" />
                        Bulk Import Schools
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="space-y-2">
                            <h4 className="font-bold text-blue-900">Import Instructions</h4>
                            <p className="text-sm text-blue-700 leading-relaxed">
                                Upload an Excel file (.xlsx) containing school details. 
                                The system will automatically create districts if they don't exist based on the <strong>District ID</strong>.
                                Existing districts will be updated with the provided name.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
                                onClick={downloadTemplate}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download Template
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid w-full max-w-sm items-center gap-2">
                            <Label htmlFor="file" className="text-sm font-semibold">Select Excel File</Label>
                            <Input id="file" type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="border-gray-200 focus:ring-[#00a58c]" />
                        </div>

                        {preview.length > 0 && preview[0] && (
                            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-gray-50 px-4 py-2 border-b text-sm font-bold text-gray-700">
                                    File Preview (First 5 Rows)
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-50/50">
                                                {preview[0].map((header: any, i: number) => (
                                                    <th key={i} className="px-4 py-2 text-left font-semibold text-gray-600 border-b">{header}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.slice(1).map((row: any, i: number) => (
                                                <tr key={i} className="border-t hover:bg-gray-50/50 transition-colors">
                                                    {Array.isArray(row) ? row.map((cell: any, j: number) => (
                                                        <td key={j} className="px-4 py-2 text-gray-600">{cell}</td>
                                                    )) : <td colSpan={preview[0].length} className="px-4 py-2 text-gray-400 italic">Empty row</td>}
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
                            className="bg-[#00a58c] hover:bg-[#008f7a] w-full md:w-auto px-8"
                        >
                            {loading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</>
                            ) : (
                                <>
                                    <FileUp className="mr-2 h-4 w-4" />
                                    Start Import
                                </>
                            )}
                        </Button>
                    </div>

                    {results && (
                        <div className="space-y-4 pt-6 border-t font-sans">
                            <h3 className="font-bold text-lg text-gray-900">Import Summary</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100 shadow-sm">
                                    <div className="flex items-center gap-2 text-emerald-800 font-bold mb-3">
                                        <CheckCircle className="h-5 w-5" />
                                        Processed Successfully ({results.success.length})
                                    </div>
                                    {results.success.length > 0 ? (
                                        <ul className="text-sm text-emerald-700 max-h-48 overflow-y-auto space-y-2 pr-2">
                                            {results.success.map((item, i) => (
                                                <li key={i} className="flex justify-between items-center py-1 border-b border-emerald-200/50 last:border-0">
                                                    <span className="font-medium">{item.schoolName}</span>
                                                    <span className="text-xs bg-emerald-100 px-2 py-0.5 rounded-full">{item.districtName}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-emerald-600 italic">No schools were imported successfully.</p>
                                    )}
                                </div>

                                <div className="bg-red-50 p-5 rounded-xl border border-red-100 shadow-sm">
                                    <div className="flex items-center gap-2 text-red-800 font-bold mb-3">
                                        <AlertCircle className="h-5 w-5" />
                                        Encountered Errors ({results.errors.length})
                                    </div>
                                    {results.errors.length > 0 ? (
                                        <ul className="text-sm text-red-700 max-h-48 overflow-y-auto space-y-2 pr-2">
                                            {results.errors.map((item, i) => (
                                                <li key={i} className="p-2 bg-white/50 rounded-lg border border-red-100">
                                                    <span className="font-bold mr-2 text-red-900">
                                                        Row {typeof item.row === 'object' ? (item.row['School Name'] || item.row['schoolName'] || i + 1) : (item.row || i + 1)}:
                                                    </span>
                                                    {item.error}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-red-600 italic">No errors were encountered during import.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
