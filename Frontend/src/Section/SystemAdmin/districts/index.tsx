import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Plus,
    Search,
    MoreHorizontal,
    School,
    MapPin,
    CheckCircle,
    XCircle,
    Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDistricts } from '@/api';
import { useAuth } from '@/authContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export default function DistrictsList() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [districts, setDistricts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchDistricts = async () => {
        // @ts-ignore
        const token = user?.token || localStorage.getItem('token');
        if (token) {
            const data = await getDistricts(token, { search });
            if (data.districts) {
                setDistricts(data.districts);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchDistricts();
    }, [user, search]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0"><CheckCircle className="w-3 h-3 mr-1" /> Active</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-0"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
            case 'suspended':
            case 'expired':
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0"><XCircle className="w-3 h-3 mr-1" /> {status}</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Districts</h1>
                    <p className="text-gray-500 mt-1">Manage educational districts and their subscriptions.</p>
                </div>
                <Button
                    onClick={() => navigate('/system-admin/districts/new')}
                    className="bg-[#00a58c] hover:bg-[#008f7a]"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add District
                </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Search districts..."
                        className="pl-9 bg-gray-50 border-gray-200"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                            <TableHead>District Name</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Schools</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                    Loading districts...
                                </TableCell>
                            </TableRow>
                        ) : districts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                    No districts found. Click "Add District" to create one.
                                </TableCell>
                            </TableRow>
                        ) : (
                            districts.map((district) => (
                                <TableRow key={district._id} className="hover:bg-gray-50/50">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                                                {district.code}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">{district.name}</div>
                                                <div className="text-xs text-gray-500">Created {new Date(district.createdAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center text-gray-600">
                                            <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                                            {district.city ? `${district.city}, ${district.state}` : district.state}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center text-gray-600">
                                            <School className="h-4 w-4 mr-1 text-gray-400" />
                                            {district.schoolCount || 0} Schools
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(district.subscriptionStatus)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => navigate(`/system-admin/districts/${district._id}`)}>
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>Manage Schools</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-600">
                                                    Suspend District
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
        </div>
    );
}
