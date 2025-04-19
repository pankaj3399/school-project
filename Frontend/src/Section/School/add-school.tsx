import {  useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Loading from "../Loading";
import { addSchool, getCurrrentSchool, getStats, resetStudentRoster, updateSchool } from "@/api";
import SchoolStats from "./component/school-stats";
import AllCharts from "./component/all-charts";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import Modal from "./Modal";

const STATE_OPTIONS = [
  'AL', 'AK', 'AS', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC',
  'FL', 'GA', 'GU', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY',
  'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE',
  'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'MP', 'OH', 'OK',
  'OR', 'PA', 'PR', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
  'VA', 'VI', 'WA', 'WV', 'WI', 'WY'
];

const TIMEZONE_OPTIONS = [
  { value: 'UTC-12', label: 'UTC-12' },
  { value: 'UTC-11', label: 'UTC-11' },
  { value: 'UTC-10', label: 'UTC-10 (Hawaii)' },
  { value: 'UTC-9', label: 'UTC-9 (Alaska)' },
  { value: 'UTC-8', label: 'UTC-8 (Pacific Time)' },
  { value: 'UTC-7', label: 'UTC-7 (Mountain Time)' },
  { value: 'UTC-6', label: 'UTC-6 (Central Time)' },
  { value: 'UTC-5', label: 'UTC-5 (Eastern Time)' },
  { value: 'UTC-4', label: 'UTC-4' },
  { value: 'UTC-3', label: 'UTC-3' },
  { value: 'UTC-2', label: 'UTC-2' },
  { value: 'UTC-1', label: 'UTC-1' },
  { value: 'UTC+0', label: 'UTC+0' },
  { value: 'UTC+1', label: 'UTC+1' },
  { value: 'UTC+2', label: 'UTC+2' },
  { value: 'UTC+3', label: 'UTC+3' },
  { value: 'UTC+4', label: 'UTC+4' },
  { value: 'UTC+5', label: 'UTC+5' },
  { value: 'UTC+6', label: 'UTC+6' },
  { value: 'UTC+7', label: 'UTC+7' },
  { value: 'UTC+8', label: 'UTC+8' },
  { value: 'UTC+9', label: 'UTC+9' },
  { value: 'UTC+10', label: 'UTC+10' },
  { value: 'UTC+11', label: 'UTC+11' },
  { value: 'UTC+12', label: 'UTC+12' }
];

export default function SchoolPage() {
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
  const [timezone, setTimezone] = useState("UTC-5"); // Default to Eastern Time
  const [domain, setDomain] = useState("");

  const [showResetModal, setShowResetModal] = useState(false);

  const [stats, setStats] = useState({
      teachers:0,
      students:0,
      points:0,
      oopsie: 0,
      feedbacks: 0,
      withdrawals: 0
    })
  
    useEffect(()=>{
      const fetchStats = async () => {
          const res = await getStats()
          console.log(res);
          setStats({
              teachers: res.totalTeachers,
              students: res.totalStudents,
              points: res.totalPoints,
              oopsie: res.totalDeductPoints,
              withdrawals: res.totalWithdrawPoints,
              feedbacks: res.totalFeedbackCount
          })
      }
      fetchStats()
    },[])

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
          setTimezone(data.school.timezone || "UTC-5");
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
        const response = isEditing
    ? await updateSchool(formData, school._id, token)
    : await addSchool(formData, token);


if (!response.error) {
    toast({
        title: isEditing
            ? "School updated successfully"
            : "School added successfully",
        description: `${schoolName} has been ${
            isEditing ? "updated" : "added"
        } to the system.`,
    });
    setLoading(false);
    setSchool(response.data.school);
    setIsEditing(false);
    navigate("/analytics");
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

  const resetStudent = async ()=>{ 
    try{
      await resetStudentRoster()
      setShowResetModal(false)
      toast({
        title: "Success",
        description: `Student Roster Reset Successfully`,
      })
    }catch(e){
      console.log("Error",e);
    }
}

  const formFields = (
    <>
      <div>
        <Label htmlFor="state">State</Label>
        <Select
          value={state}
          onValueChange={setState}
        >
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
        <Select
          value={timezone}
          onValueChange={setTimezone}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONE_OPTIONS.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
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

  if (school) {
    return (
      <div className="grid  place-items-center">
        <div className="space-y-4">
          <div className="flex flex-col gap-4 items-center space-x-4">
            <img
              src={school.logo || "/default-logo.png"}
              alt={school.name}
              className="w-36 h-36 object-cover rounded-full"
            />
            
            <div className="text-center">
              <p className="text-xl">{school.district}</p>
              <h2 className="text-4xl font-bold">{school.name}</h2>
              <p className="text-xl">{school.createdBy.name?.toUpperCase()} - SYSTEM MANAGER</p>
              <p className="text-xl">{school.address}</p>
              <p className="text-xl">{school.state}, {school.country}</p>
            </div>
            <div className="flex items-center gap-4">
              {/* <Button variant={"outline"} className="bg-[#00a58c] hover:bg-[#00a58c] text-white" onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? "Cancel":"Edit School"}
              </Button>

              <Button variant={"outline"} className="bg-red-500 hover:bg-red-700 text-white hover:text-white" onClick={()=>
                setShowResetModal(true)
              }>
               Reset Students
              </Button> */}
            </div>
          </div>
        </div>
        { 
          !isEditing && <SchoolStats stats={stats} />
        }
        {
          !isEditing && <AllCharts />
        }
       
        
        {isEditing && (
          <div className="grid place-items-center w-full h-full mt-20">
            <div className="bg-white shadow-xl p-4 rounded-lg">
              <h1 className="text-3xl font-bold mb-6">
                {isEditing ? "Edit School" : "Add School"}
              </h1>
              <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
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
                {isEditing && (
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
                )}
                <Button type="submit" className="bg-[#00a58c] hover:bg-[#00a58c]">
                  {isEditing ? "Update School" : "Add School"}
                </Button>
              </form>
            </div>
          </div>
        )}
        <Modal
        isOpen={showResetModal}
        description="Are you sure you want to reset the student roster?"
        title="Add School"
        onClose={()=>{
          setShowResetModal(false)
        }}
        onConfirm={()=>{
          resetStudent()
        }}
        callToAction="Reset"
      />
      </div>
    );
  }
  return (
    <div className="grid  place-items-center w-full h-full mt-20">
      <div className=" shadow-xl p-4 rounded-lg">
        <h1 className="text-3xl font-bold mb-6">
          {isEditing ? "Edit School" : "Add School"}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
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
          {!isEditing && (
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
          )}
          <Button type="submit">
            {isEditing ? "Update School" : "Add School"}
          </Button>
        </form>
      </div>
      
    </div>
  );
}