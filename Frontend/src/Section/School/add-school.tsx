import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Loading from "../Loading";
import { addSchool, getCurrrentSchool, getStats, updateSchool } from "@/api";
import SchoolStats from "./component/school-stats";
import AllCharts from "./component/all-charts";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { TIMEZONE_OPTIONS } from "@/lib/luxon";

const STATE_OPTIONS = [
  'AL', 'AK', 'AS', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC',
  'FL', 'GA', 'GU', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY',
  'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE',
  'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'MP', 'OH', 'OK',
  'OR', 'PA', 'PR', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
  'VA', 'VI', 'WA', 'WV', 'WI', 'WY'
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

  const [stats, setStats] = useState({
    teachers: 0,
    students: 0,
    points: 0,
    oopsie: 0,
    feedbacks: 0,
    withdrawals: 0
  })

  useEffect(() => {
    const fetchStats = async () => {
      const res = await getStats()
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
  }, [])

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
          description: `${schoolName} has been ${isEditing ? "updated" : "added"
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
      <div className="grid grid-cols-1 place-items-center">
        <div className="flex w-full">
          <div className="flex flex-col gap-4 items-center">
            <img
              src={school.logo || "/default-logo.png"}
              alt={school.name}
              className="w-24 h-24 object-cover rounded-full"
            />

            <div className="flex flex-col gap-1 items-center text-center text-sm">
              <p className="">{school.district}</p>
              <h2 className="text-xl font-semibold">{school.name}</h2>
              <p className="">{school.createdBy.name?.toUpperCase()} - SYSTEM MANAGER</p>
              <div className="flex gap-1">
                <p className="">{school.address},</p>
                <p className="">{school.state}, {school.country}</p>
              </div>
            </div>
          </div>


          <div className="flex flex-col gap-5 w-full">
            {
              !isEditing && <SchoolStats stats={stats} />
            }
            {
              !isEditing && <AllCharts />
            }
          </div>
        </div>


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