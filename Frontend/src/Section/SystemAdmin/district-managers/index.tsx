import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Building2, Loader2 } from 'lucide-react';
import { getAdmins, getDistricts, reInviteAdmin } from '@/api';
import { useAuth } from '@/authContext';
import { useToast } from '@/hooks/use-toast';
import { getAuthToken } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import { InviteAdminDialog } from '@/components/InviteAdminDialog';
import { EditAdminDialog } from '@/components/EditAdminDialog';
import { Role } from '@/enum';
import { formatRoleName } from '@/lib/roleLabels';
import { cn } from '@/lib/utils';

interface DistrictOption {
  _id: string;
  name: string;
  code?: string;
}

interface DistrictManager {
  _id: string;
  name: string;
  email: string;
  role: string;
  approved: boolean;
  address?: string;
  phone?: string;
  position?: string;
  contactRole?: string;
  hasCompletedRegistration?: boolean;
  districtId?: { _id: string; name: string; code?: string } | string | null;
}

function districtLabel(districtId: DistrictManager['districtId']): string {
  if (!districtId) return '';
  if (typeof districtId === 'string') return districtId;
  return districtId.name || '';
}

export default function DistrictManagersList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [managers, setManagers] = useState<DistrictManager[]>([]);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reinvitingIds, setReinvitingIds] = useState<Record<string, boolean>>({});

  const fetchManagers = useCallback(async () => {
    if (!user) return;
    const token = getAuthToken(user);
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const [adminsRes, districtsRes] = await Promise.all([
        getAdmins(token, { role: Role.Admin, limit: 100 }),
        getDistricts(token, { limit: 100 }),
      ]);

      if (adminsRes.error) {
        const message = getErrorMessage(adminsRes, 'Failed to load District Managers.');
        setError(message);
        toast({ title: 'Error', description: message, variant: 'destructive' });
        setManagers([]);
      } else {
        setManagers(adminsRes.admins || []);
      }

      if (!districtsRes.error) {
        setDistricts(districtsRes.districts || []);
      }
    } catch {
      setError('Network error');
      toast({
        title: 'Error',
        description: 'Could not load District Managers.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchManagers();
  }, [fetchManagers]);

  const handleReInvite = async (adminId: string, adminName: string) => {
    setReinvitingIds((prev) => ({ ...prev, [adminId]: true }));
    try {
      const response = await reInviteAdmin(adminId);
      if (response.error) {
        throw new Error(getErrorMessage(response, 'Failed to resend invitation.'));
      }
      toast({
        title: 'Invitation Sent',
        description: `A new invitation was sent to ${adminName}.`,
      });
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(err, 'Failed to resend invitation.'),
        variant: 'destructive',
      });
    } finally {
      setReinvitingIds((prev) => ({ ...prev, [adminId]: false }));
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">District Managers</h1>
          <p className="text-gray-500 mt-2">
            Invite a District Manager and assign them to one district. They will manage the schools in that district.
          </p>
        </div>
        <InviteAdminDialog
          role={Role.Admin}
          label="Invite District Manager"
          districts={districts}
          onSuccess={fetchManagers}
        />
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
                <TableHead className="font-semibold text-gray-700">Name</TableHead>
                <TableHead className="font-semibold text-gray-700">Email</TableHead>
                <TableHead className="font-semibold text-gray-700">District</TableHead>
                <TableHead className="font-semibold text-gray-700">Role</TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" />
                    Loading District Managers...
                  </TableCell>
                </TableRow>
              ) : managers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                    No District Managers yet. Invite one and assign them to a district.
                  </TableCell>
                </TableRow>
              ) : (
                managers.map((manager) => {
                  const districtName = districtLabel(manager.districtId);
                  return (
                    <TableRow key={manager._id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-medium text-gray-900">{manager.name}</TableCell>
                      <TableCell className="text-gray-600">{manager.email}</TableCell>
                      <TableCell>
                        {districtName ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-gray-400" />
                            <span className="font-medium text-gray-900">{districtName}</span>
                          </div>
                        ) : (
                          <span className="text-amber-600 italic">No district assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded text-[10px] font-bold uppercase tracking-wider">
                          {formatRoleName(manager.role)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
                            manager.hasCompletedRegistration
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          )}
                        >
                          {manager.hasCompletedRegistration ? 'Active' : 'Pending'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <EditAdminDialog admin={manager} onSuccess={fetchManagers} />
                          {!manager.hasCompletedRegistration && (
                            <Button
                              variant="link"
                              onClick={() => handleReInvite(manager._id, manager.name)}
                              disabled={reinvitingIds[manager._id]}
                              className="h-8 px-2 text-[#00a58c] hover:text-[#008f7a] text-xs font-bold disabled:opacity-50"
                            >
                              {reinvitingIds[manager._id] ? 'Inviting...' : 'Resend Invite'}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
