import { useEffect, useState, useCallback } from 'react';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Search, 
    Plus, 
    MoreHorizontal, 
    School,
    Trash2,
    Eye,
    Edit,
    Building2,
    AlertCircle
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { getAllSchools, deleteSchool } from '@/api';
import { useAuth } from '@/authContext';
import { useToast } from '@/hooks/use-toast';
import { getAuthToken } from '@/lib/auth';
import { PasswordConfirmModal } from './PasswordConfirmModal';

interface SchoolData {
    _id: string;
    name: string;
    district?: string;
    districtId?: {
        _id: string;
        name: string;
    };
    state: string;
    teacherCount?: number;
    studentCount?: number;
}

export default function SchoolsList() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [schools, setSchools] = useState<SchoolData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [schoolToDelete, setSchoolToDelete] = useState<{ id: string; name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { toast } = useToast();

    const fetchSchools = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const token = getAuthToken(user);
            if (!token) return;
            // Note: getAllSchools API currently doesn't support search on backend, 
            // but we'll implement frontend filtering for now or update backend later if needed.
            const data = await getAllSchools(token);
            if (data.error) {
                toast({
                    title: "Error",
                    description: "Failed to fetch schools",
                    variant: "destructive"
                });
                setError("Failed to fetch schools");
            } else {
                setSchools(data.schools || []);
            }
        } catch (err) {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        fetchSchools();
    }, [fetchSchools]);

    const handleDelete = async (id: string, name: string, password?: string) => {
        try {
            setIsDeleting(true);
            const token = getAuthToken(user);
            if (!token) return;
            
            const data = await deleteSchool(id, token, password);
            if (data.error) {
                toast({
                    title: "Error",
                    description: typeof data.error === 'string' ? data.error : (data.error.message || "Failed to delete school"),
                    variant: "destructive"
                });
            } else {
                toast({
                    description: `${name} deleted successfully.`,
                });
                setSchools(prev => prev.filter(s => s._id !== id));
                setShowDeleteModal(false);
                setSchoolToDelete(null);
            }
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message || "Error deleting school",
                variant: "destructive"
            });
            setShowDeleteModal(false);
            setSchoolToDelete(null);
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredSchools = schools.filter(school => {
        const searchText = searchTerm.toLowerCase();
        const districtName = school.districtId?.name || school.district || "";
        return (
            school.name.toLowerCase().includes(searchText) ||
            districtName.toLowerCase().includes(searchText) ||
            (school.state || "").toLowerCase().includes(searchText)
        );
    });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Schools</h1>
                    <p className="text-gray-500 mt-2">Manage all registered schools across all districts.</p>
                </div>
                <Button 
                    onClick={() => navigate('/system-admin/schools/new')}
                    className="bg-[#00a58c] hover:bg-[#008f7a]"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    New School
                </Button>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm ring-1 ring-gray-100">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                        placeholder="Search by name, district, or state..." 
                        className="pl-10 border-gray-200 focus:ring-[#00a58c]" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {error ? (
                <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl flex items-center gap-3">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50">
                            <TableRow>
                                <TableHead className="font-semibold text-gray-700">School Details</TableHead>
                                <TableHead className="font-semibold text-gray-700">District</TableHead>
                                <TableHead className="font-semibold text-gray-700">State</TableHead>
                                <TableHead className="text-right"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-12 text-gray-500">
                                        Loading schools...
                                    </TableCell>
                                </TableRow>
                            ) : filteredSchools.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-12 text-gray-500">
                                        No schools found matching your search.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredSchools.map((school) => (
                                    <TableRow key={school._id} className="hover:bg-gray-50 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                                    <School className="h-5 w-5" />
                                                </div>
                                                <p className="font-bold text-gray-900">{school.name}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {school.districtId?.name ? (
                                                <div className="flex items-center gap-2 text-gray-700 font-medium">
                                                    <Building2 className="h-4 w-4 text-gray-400" />
                                                    <span>{school.districtId.name}</span>
                                                </div>
                                            ) : school.district ? (
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <span>{school.district} (Legacy)</span>
                                                </div>
                                            ) : (
                                                <Badge variant="outline" className="text-gray-400 border-gray-200 font-normal">
                                                    No District
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-0">
                                                {school.state || "N/A"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem onClick={() => navigate(`/system-admin/schools/${school._id}`)}>
                                                        <Eye className="mr-2 h-4 w-4 text-gray-400" /> Analytics
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => navigate(`/system-admin/schools/${school._id}?tab=settings`)}>
                                                        <Edit className="mr-2 h-4 w-4 text-gray-400" /> Settings
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem 
                                                        className="text-red-600"
                                                        onClick={() => {
                                                            setSchoolToDelete({ id: school._id, name: school.name });
                                                            setShowDeleteModal(true);
                                                        }}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete School
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
            
            <PasswordConfirmModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setSchoolToDelete(null);
                }}
                onConfirm={(password) => {
                    if (schoolToDelete) {
                        return handleDelete(schoolToDelete.id, schoolToDelete.name, password);
                    }
                    return Promise.resolve();
                }}
                title="Delete School"
                description={`Are you sure you want to delete ${schoolToDelete?.name}? This action will permanently remove the school and all its associated data (teachers, students, etc). This cannot be undone.`}
                confirmText="Permanently Delete School"
                isLoading={isDeleting}
            />
        </div>
    );
}
