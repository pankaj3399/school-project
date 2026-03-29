import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { inviteAdmin } from '@/api';
import { Role } from '@/enum';

interface InviteAdminDialogProps {
  districtId: string | undefined;
  schoolId?: string;
  role?: string;
  label?: string;
}

export function InviteAdminDialog({ districtId, schoolId, role, label }: InviteAdminDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const { toast } = useToast();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!districtId) return;
    if (role === Role.SchoolAdmin && !schoolId) {
      toast({ title: "Error", description: "School ID is required for School Admin invitation.", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    try {
      const response = await inviteAdmin({
        email,
        name,
        role: role || Role.Admin,
        schoolId: schoolId || '',
        districtId: districtId
      });

      if (response.error) {
        const errorMsg = typeof response.error === 'string' ? response.error : (response.error.message || "Failed to send invitation.");
        throw new Error(errorMsg);
      }
      
      toast({
        title: "Invitation Sent",
        description: response.message || `An invitation has been sent to ${email}.`,
      });
      setOpen(false);
      setEmail('');
      setName('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred while sending the invitation.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#00a58c] hover:bg-[#008f7a]">
          <UserPlus className="h-4 w-4 mr-2" />
          {label || 'Invite Admin'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleInvite}>
          <DialogHeader>
            <DialogTitle>Invite {role === Role.SchoolAdmin ? 'School' : 'District'} Administrator</DialogTitle>
            <DialogDescription>
              Send an invitation to a new {role === Role.SchoolAdmin ? 'school' : 'district'} administrator. They will receive an email to set up their account.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading} className="bg-[#00a58c] hover:bg-[#008f7a]">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Invitation"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
