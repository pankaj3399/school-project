import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { deactivateAdmin, reactivateAdmin } from '@/api';
import { getErrorMessage } from '@/lib/errors';
import { canManageAdminActiveState, isAdminDeactivated } from '@/lib/adminActive';
import { useAuth } from '@/authContext';

interface AdminActiveToggleProps {
  admin: {
    _id: string;
    name?: string;
    role?: string;
    districtId?: unknown;
    isActive?: boolean;
  };
  onSuccess?: () => void;
}

export function AdminActiveToggle({ admin, onSuccess }: AdminActiveToggleProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  if (!canManageAdminActiveState(user, admin)) {
    return null;
  }

  const deactivated = isAdminDeactivated(admin);
  const displayName = admin.name || 'this administrator';

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const response = deactivated
        ? await reactivateAdmin(admin._id)
        : await deactivateAdmin(admin._id);
      if (response.error) {
        throw new Error(getErrorMessage(response));
      }
      toast({
        title: 'Success',
        description: deactivated
          ? `${displayName} has been reactivated.`
          : `${displayName} has been deactivated.`,
      });
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to update administrator status.'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="link"
          size="sm"
          disabled={loading}
          className={`h-8 px-2 text-xs font-bold ${
            deactivated
              ? 'text-[#00a58c] hover:text-[#008f7a]'
              : 'text-red-500 hover:text-red-600'
          }`}
        >
          {loading ? 'Updating...' : deactivated ? 'Reactivate' : 'Deactivate'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {deactivated ? 'Reactivate this account?' : 'Deactivate this account?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {deactivated
              ? `${displayName} will be able to sign in again. Their history is unchanged.`
              : `${displayName} will lose access immediately. Their record and history are kept.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={deactivated ? 'bg-[#00a58c] hover:bg-[#008f7a]' : 'bg-red-600 hover:bg-red-700'}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
          >
            {deactivated ? 'Reactivate' : 'Deactivate'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
