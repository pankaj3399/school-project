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
    Building2, 
    Users, 
    School,
    Trash2,
    Eye,
    Edit,
    Loader2
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { getDistricts, deleteDistrict } from '@/api';
import { useAuth } from '@/authContext';
import { useToast } from '@/hooks/use-toast';
import { getAuthToken } from '@/lib/auth';

interface District {
    _id: string;
    name: string;
    code: string;
    state: string;
    schoolCount: number;
    teacherCount: number;
    studentCount: number;
    subscriptionStatus: 'active' | 'suspended' | 'expired';
}

export default function DistrictsList() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [districts, setDistricts] = useState<District[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();


    const fetchDistricts = useCallback(async (search = '') => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const token = getAuthToken(user);
            if (!token) return;
            const data = await getDistricts(token, { search });
            if (data.error) {
                toast({
                    title: "Error",
                    description: typeof data.error === 'string' ? data.error : (data.error.message || "Failed to fetch districts"),
                    variant: "destructive"
                });
                setError(typeof data.error === 'string' ? data.error : (data.error.message || "Failed to fetch districts"));
            } else {
                setDistricts(data.districts || []);
            }
        } catch (err) {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchDistricts(searchTerm);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, fetchDistricts]);

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
            return;
        }

        try {
            const token = getAuthToken(user);
            if (!token) {
                toast({
                    title: "Authentication Error",
                    description: "Authentication required. Please sign in again.",
                    variant: "destructive"
                });
                return;
            }
            const data = await deleteDistrict(id, token);
            if (data.error) {
                toast({
                    title: "Error",
                    description: typeof data.error === 'string' ? data.error : (data.error.message || "Failed to delete district"),
                    variant: "destructive"
                });
            } else {
                toast({
                    description: `${name} deleted successfully.`,
                });
                // Update state to reflect expired status instead of removal
                setDistricts(districts.map(d => 
                    d._id === id ? { ...d, subscriptionStatus: 'expired' as any } : d
                ));
            }
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message || "Error deleting district",
                variant: "destructive"
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">Active</Badge>;
            case 'suspended':
                return <Badge variant="destructive" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0">Suspended</Badge>;
            case 'expired':
                return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">Expired</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Districts</h1>
                    <p className="text-gray-500 mt-2">Manage all registered school districts and their settings.</p>
                </div>
                <Button 
                    onClick={() => navigate('/system-admin/districts/new')}
                    className="bg-[#00a58c] hover:bg-[#008f7a]"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    New District
                </Button>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm ring-1 ring-gray-100">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                        placeholder="Search by name or code..." 
                        className="pl-10 border-gray-200 focus:ring-[#00a58c]" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {error ? (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg text-center font-medium">
                    {error}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50">
                            <TableRow>
                                <TableHead className="font-semibold text-gray-700">District Details</TableHead>
                                <TableHead className="font-semibold text-gray-700">State</TableHead>
                                <TableHead className="font-semibold text-gray-700">Analytics</TableHead>
                                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                                <TableHead className="text-right"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                                        Loading districts...
                                    </TableCell>
                                </TableRow>
                            ) : districts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                                        No districts found matching your search.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                districts.map((district) => (
                                    <TableRow key={district._id} className="hover:bg-gray-50 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                    <Building2 className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{district.name}</p>
                                                    <p className="text-xs font-mono text-gray-500 tracking-wider font-semibold">{district.code}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-0">
                                                {district.state}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-1" title="Schools">
                                                    <School className="h-3.5 w-3.5" />
                                                    <span className="font-semibold">{district.schoolCount || 0}</span>
                                                </div>
                                                <div className="flex items-center gap-1" title="Teachers">
                                                    <Users className="h-3.5 w-3.5" />
                                                    <span className="font-semibold">{district.teacherCount || 0}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(district.subscriptionStatus)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => navigate(`/system-admin/districts/${district._id}`)}>
                                                        <Eye className="mr-2 h-4 w-4" /> View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => navigate(`/system-admin/districts/${district._id}?tab=settings`)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit Settings
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => navigate(`/system-admin/districts/${district._id}?tab=schools`)}>
                                                        <School className="mr-2 h-4 w-4" /> Manage Schools
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem 
                                                        className="text-amber-600"
                                                        onClick={() => toast({
                                                            description: "Suspend district functionality coming soon",
                                                        })}
                                                    >
                                                        <Loader2 className="mr-2 h-4 w-4" /> Suspend District
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        className="text-red-600"
                                                        onClick={() => handleDelete(district._id, district.name)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete District
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
        </div>
    );
}
