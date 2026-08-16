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
import { UserPlus, Loader2, MapPin, Phone as PhoneIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { inviteAdmin } from '@/api';
import { Role, type RoleType } from '@/enum';
import { getErrorMessage } from "@/lib/errors"
import { CONTACT_ROLE_LEADERSHIP, CONTACT_ROLE_SCHOOL_TECH, formatRoleName } from "@/lib/roleLabels"

interface InviteAdminDialogProps {
  districtId?: string;
  schoolId?: string;
  role?: RoleType;
  label?: string;
  // When provided and the role is district-level (DistrictAdmin/Admin), the
  // inviter can pick which school's logo should appear in the invitation
  // email's branding header. Useful when a District Admin should be branded
  // with a specific school's logo even though they aren't assigned to one.
  schools?: Array<{ _id: string; name: string }>;
  districts?: Array<{ _id: string; name: string; code?: string }>;
  onSuccess?: () => void;
}

export function InviteAdminDialog({ districtId, schoolId, role, label, schools, districts, onSuccess }: InviteAdminDialogProps) {
  const { toast } = useToast();
  const effectiveRole: RoleType = role ?? Role.Admin;
  const isDistrictLevelInvite = effectiveRole === Role.DistrictAdmin || effectiveRole === Role.Admin;
  const showDistrictPicker = isDistrictLevelInvite && !districtId && Array.isArray(districts);
  const showLogoSchoolPicker = isDistrictLevelInvite && Array.isArray(schools) && schools.length > 0;
  const defaultContactRole = effectiveRole === Role.SchoolAdmin ? CONTACT_ROLE_SCHOOL_TECH : CONTACT_ROLE_LEADERSHIP;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('Other');
  const [contactRole, setContactRole] = useState(defaultContactRole);
  const [logoSchoolId, setLogoSchoolId] = useState<string>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');

  const resetForm = () => {
    setEmail('');
    setName('');
    setAddress('');
    setPhone('');
    setPosition('Other');
    setContactRole(defaultContactRole);
    setLogoSchoolId('');
    setSelectedDistrictId('');
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedDistrictId = districtId || selectedDistrictId;
    if (effectiveRole === Role.SchoolAdmin) {
      if (!schoolId) {
        toast({ title: "Error", description: "School ID is required for School Tech invitation.", variant: "destructive" });
        return;
      }
    } else if (!resolvedDistrictId) {
      toast({ title: "Error", description: "A district must be selected to send this invitation.", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    try {
      const response = await inviteAdmin({
        email,
        name,
        address,
        phone,
        position,
        contactRole,
        role: effectiveRole,
        ...(schoolId ? { schoolId } : {}),
        ...(resolvedDistrictId ? { districtId: resolvedDistrictId } : {}),
        ...(showLogoSchoolPicker && logoSchoolId ? { logoSchoolId } : {}),
      });

      if (response.error) {
        const errorMsg = getErrorMessage(response, "Failed to send invitation.");
        throw new Error(errorMsg);
      }
      
      toast({
        title: "Invitation Sent",
        description: response.message || `An invitation has been sent to ${email}.`,
      });
      setOpen(false);
      resetForm();
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "An error occurred while sending the invitation."),
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
            <DialogTitle>
              Invite {formatRoleName(effectiveRole) || 'administrator'}
            </DialogTitle>
            <DialogDescription>
              Send an invitation to a new {formatRoleName(effectiveRole) || 'administrator'}. They will receive an email to set up their account.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
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

            {showDistrictPicker && (
              <div className="grid gap-2">
                <Label htmlFor="district">District</Label>
                <Select value={selectedDistrictId} onValueChange={setSelectedDistrictId}>
                  <SelectTrigger id="district">
                    <SelectValue placeholder="Select a district" />
                  </SelectTrigger>
                  <SelectContent>
                    {(districts ?? []).map((d) => (
                      <SelectItem key={d._id} value={d._id}>
                        {d.name}{d.code ? ` (${d.code})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(districts ?? []).length === 0 && (
                  <p className="text-xs text-amber-600">Create a district first, then invite a District Manager to it.</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="position">Position</Label>
                <Select value={position} onValueChange={setPosition}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Principal">Principal</SelectItem>
                    <SelectItem value="AP">Assistant Principal</SelectItem>
                    <SelectItem value="Dean">Dean</SelectItem>
                    <SelectItem value="AN Teacher">AN Teacher</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contactRole">Platform Role</Label>
                <Select value={contactRole} onValueChange={setContactRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CONTACT_ROLE_LEADERSHIP}>Leadership</SelectItem>
                    <SelectItem value={CONTACT_ROLE_SCHOOL_TECH}>School Tech</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {showLogoSchoolPicker && (
              <div className="grid gap-2">
                <Label htmlFor="logoSchool">Email Logo (Optional)</Label>
                <Select value={logoSchoolId || 'none'} onValueChange={(v) => setLogoSchoolId(v === 'none' ? '' : v)}>
                  <SelectTrigger id="logoSchool">
                    <SelectValue placeholder="Use district logo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Use district logo</SelectItem>
                    {(schools ?? []).map((s) => (
                      <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Pick a school whose logo should appear in the invitation email instead of the district's.</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 School St"
                    className="pl-10"
                  />
                </div>
              </div>
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
