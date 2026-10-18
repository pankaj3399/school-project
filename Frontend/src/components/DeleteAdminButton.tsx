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
import { deleteAdmin } from '@/api';
import { getErrorMessage } from '@/lib/errors';
import { canManageAdminActiveState } from '@/lib/adminActive';
import { useAuth } from '@/authContext';

interface DeleteAdminButtonProps {
  admin: {
    _id: string;
    name?: string;
    role?: string;
    districtId?: unknown;
    isActive?: boolean;
  };
  onSuccess?: () => void;
}

export function DeleteAdminButton({ admin, onSuccess }: DeleteAdminButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  if (!canManageAdminActiveState(user, admin)) {
    return null;
  }

  const displayName = admin.name || 'this administrator';

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const response = await deleteAdmin(admin._id);
      if (response.error) {
        throw new Error(getErrorMessage(response));
      }
      toast({
        title: 'Success',
        description: `${displayName} has been deleted.`,
      });
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to delete administrator.'),
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
          className="h-8 px-2 text-xs font-bold text-red-500 hover:text-red-600"
        >
          {loading ? 'Deleting...' : 'Delete'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this account?</AlertDialogTitle>
          <AlertDialogDescription>
            {displayName} will be removed. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700"
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
