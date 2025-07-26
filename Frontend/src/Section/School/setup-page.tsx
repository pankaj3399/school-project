import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Loading from "../Loading";
import { addSchool, getCurrrentSchool, updateSchool } from "@/api";
import OtpVerificationModal from "./OtpVerificationModal";
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Users, GraduationCap, School } from "lucide-react";
import { TIMEZONE_OPTIONS } from "@/lib/luxon";

const STATE_OPTIONS = [
  'AL', 'AK', 'AS', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC',
  'FL', 'GA', 'GU', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY',
  'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE',
  'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'MP', 'OH', 'OK',
  'OR', 'PA', 'PR', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
  'VA', 'VI', 'WA', 'WV', 'WI', 'WY'
];



const SetupPage = () => {
  const [schoolName, setSchoolName] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [state, setState] = useState("AL");
  const [country, setCountry] = useState("United States");
  const [timezone, setTimezone] = useState(TIMEZONE_OPTIONS[0].value);
  const [domain, setDomain] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast({
            title: "Error",
            description: "No token found.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const data = await getCurrrentSchool(token);
        setSchool(data.school || null);
        if (data.school) {
          setSchoolName(data.school.name);
          setAddress(data.school.address);
          setDistrict(data.school.district);
          setState(data.school.state || "AL");
          setCountry(data.school.country || "United States");
          setTimezone(data.school.timeZone || "UTC-5");
          setDomain(data.school.domain || "");
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch school data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSchool();
  }, [toast]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!schoolName.trim()) {
      newErrors.schoolName = "School name is required";
    }

    if (!address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!logo && !isEditing) {
      newErrors.logo = "Logo is required";
    }

    if (!domain.trim()) {
      newErrors.domain = "School domain is required";
    } else if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain.trim())) {
      newErrors.domain = "Please enter a valid domain (e.g., school.edu)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Error",
          description: "You are not authenticated.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      const formData = new FormData();
      formData.append("name", schoolName);
      formData.append("address", address);
      formData.append("district", district);
      formData.append("state", state);
      formData.append("country", country);
      formData.append("timeZone", timezone);
      formData.append("domain", domain);
      if (logo) {
        formData.append("logo", logo);
      }

      const response:any = school ? await updateSchool(formData, school._id, token):await addSchool(formData, token);

      if (!response.error) {
        toast({
          title: "School updated successfully",
          description: `${schoolName} has been updated in the system.`,
        });
        setLoading(false);
        setSchool(response.data.school);
        setIsEditing(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to process the request. Please try again.",
          variant: "destructive",
        });
      }
      setLoading(false);
    }
  };

  const handleResetSuccess = () => {
    toast({
      title: "Success",
      description: `Student Roster Reset Successfully`,
    });
  };

  const formFields = (
    <>
      <div>
        <Label htmlFor="state">State</Label>
        <Select value={state} onValueChange={setState}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent>
            {STATE_OPTIONS.map((stateOption) => (
              <SelectItem key={stateOption} value={stateOption}>
                {stateOption}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="timezone">Time Zone</Label>
        <Select value={timezone} onValueChange={setTimezone}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONE_OPTIONS.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.value + " : " + tz.label + "."}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="country">Country</Label>
        <Input
          id="country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          required
        />
      </div>
    </>
  );

  if (loading) return <Loading />;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">School Setup</h1>

      <div className="grid grid-cols-1 gap-8">
        {/* School Information Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl">School Information</CardTitle>
              <CardDescription>View and update your school details</CardDescription>
            </div>
            {school && !isEditing && (
              <Button
                variant="outline"
                className="bg-[#00a58c] hover:bg-[#00a58c] text-white"
                onClick={() => setIsEditing(!isEditing)}
              >
                Edit School
              </Button>
            )}
          </CardHeader>

          <CardContent>
            {school && !isEditing ? (
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <img
                  src={school.logo || "/default-logo.png"}
                  alt={school.name}
                  className="w-36 h-36 object-cover rounded-full"
                />
                <div>
                  <p className="text-xl mb-1">{school.district}</p>
                  <h2 className="text-3xl font-bold mb-1">{school.name}</h2>
                  <p className="text-xl mb-1">{school.createdBy.name?.toUpperCase()} - SYSTEM MANAGER</p>
                  <p className="text-xl mb-1">{school.address}</p>
                  <p className="text-xl mb-1">{school.state}, {school.country}</p>
                  <p className="text-xl mb-1">Domain: {school.domain}</p>
                  <p className="text-xl mb-1">Timezone: {school.timeZone}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="schoolName">School Name</Label>
                    <Input
                      id="schoolName"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      required
                    />
                    {errors.schoolName && (
                      <p className="text-red-500 text-sm mt-1">{errors.schoolName}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                    {errors.address && (
                      <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="district">District</Label>
                    <Input
                      id="district"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      required
                    />
                    {errors.district && (
                      <p className="text-red-500 text-sm mt-1">{errors.district}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="domain">School Domain</Label>
                    <Input
                      id="domain"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      placeholder="school.edu"
                      required
                    />
                    {errors.domain && (
                      <p className="text-red-500 text-sm mt-1">{errors.domain}</p>
                    )}
                  </div>
                  {formFields}
                  <div>
                    <Label htmlFor="logo">Logo</Label>
                    <Input
                      id="logo"
                      type="file"
                      onChange={(e) => setLogo(e.target.files?.[0] || null)}
                      accept="image/*"
                    />
                    {errors.logo && (
                      <p className="text-red-500 text-sm mt-1">{errors.logo}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  {isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button type="submit" className="bg-[#00a58c] hover:bg-[#00a58c]">
                    Update School
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Setup Actions Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Setup Teachers Card */}
          <Card className="flex flex-col h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#00a58c]" />
                <CardTitle>Setup Teachers</CardTitle>
              </div>
              <CardDescription>
                Add teachers to your school through individual entry or bulk import
              </CardDescription>
            </CardHeader>
           
            <CardFooter className="mt-auto">
              <Button 
                className="w-full bg-[#00a58c] hover:bg-[#00a58c]/90" 
                onClick={() => navigate('/setup-teachers')}
              >
                Setup Teachers
              </Button>
            </CardFooter>
          </Card>

          {/* Setup Students Card */}
          <Card className="flex flex-col h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-[#00a58c]" />
                <CardTitle>Setup Students</CardTitle>
              </div>
              <CardDescription>
                Add students to your school through individual entry or bulk import
              </CardDescription>
            </CardHeader>
            
            <CardFooter className="mt-auto">
              <Button 
                className="w-full bg-[#00a58c] hover:bg-[#00a58c]/90" 
                onClick={() => navigate('/setup-students')}
              >
                Setup Students
              </Button>
            </CardFooter>
          </Card>

          {/* Reset Students Card */}
          <Card className="flex flex-col h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <School className="h-5 w-5 text-red-500" />
                <CardTitle>Reset Student Data</CardTitle>
              </div>
              <CardDescription>
                Reset all student data and point history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-red-600 font-medium">
                Warning: This action will permanently delete all students and their point history data from your school.
              </p>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button 
                className="w-full bg-red-500 hover:bg-red-700 text-white hover:text-white" 
                onClick={() => setShowOtpModal(true)}
              >
                Reset Students
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <OtpVerificationModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        onSuccess={handleResetSuccess}
      />
    </div>
  );
};

export default SetupPage;