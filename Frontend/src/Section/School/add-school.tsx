import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMatch, useNavigate, useSearchParams } from "react-router-dom";
import Loading from "../Loading";
import { addSchool, getCurrrentSchool, getStats, updateSchool } from "@/api";
import SchoolStats from "./component/school-stats";
import { useSchool } from "@/context/SchoolContext";
import { useAuth } from "@/authContext";
import { Role } from "@/enum";
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
  const [districtId, setDistrictId] = useState<string>("");
  const [logo, setLogo] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const districtIdFromQuery = searchParams.get("districtId");
  const { selectedSchoolId } = useSchool();
  const { user } = useAuth();
  const isCreateMode = Boolean(useMatch("/system-admin/schools/new"));

  const [city, setCity] = useState("");
  const [state, setState] = useState("AL");
  const [zipCode, setZipCode] = useState("");
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
    if (districtIdFromQuery) {
      setDistrictId(districtIdFromQuery);
    }
  }, [districtIdFromQuery])

  useEffect(() => {
    const fetchStats = async () => {
      const res = await getStats(selectedSchoolId || undefined)
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
  }, [selectedSchoolId])

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

        const isAdmin = user?.role === Role.SystemAdmin || user?.role === Role.Admin;
        if (isCreateMode || (isAdmin && !selectedSchoolId)) {
          setSchool(null);
          setSchoolName("");
          setAddress("");
          setCity("");
          setZipCode("");
          setDistrict("");
          setDistrictId(districtIdFromQuery || "");
          setState("AL");
          setCountry("United States");
          setTimezone("UTC-5");
          setLoading(false);
          return;
        }

        const data = await getCurrrentSchool(token, selectedSchoolId || undefined);
        setSchool(data.school || null);
        if (data.school) {
          setSchoolName(data.school.name);
          setAddress(data.school.address);
          setCity(data.school.city || "");
          setZipCode(data.school.zipCode || "");
          if (!districtIdFromQuery) {
            setDistrict(data.school.district || "");
            setDistrictId(
              data.school.districtId?._id || data.school.districtId || ""
            );
          }
          setState(data.school.state || "AL");
          setCountry(data.school.country || "United States");
          setTimezone(data.school.timeZone || "UTC-5");
        }
      } catch (error) {
        const isNotFoundError = (error as any)?.response?.status === 404;
        const resetSchoolForm = () => {
          setSchool(null);
          setSchoolName("");
          setAddress("");
          setCity("");
          setZipCode("");
          setDistrict("");
          setDistrictId("");
          setState("AL");
          setCountry("United States");
          setTimezone("UTC-5");
        };

        if (!isNotFoundError) {
          toast({
            title: "Error",
            description: "Failed to fetch school data.",
            variant: "destructive",
          });
          resetSchoolForm();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSchool();
  }, [toast, selectedSchoolId, user, districtIdFromQuery, isCreateMode]);

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
      formData.append("city", city);
      // Always send legacy district string when we have one so school.district remains populated
      // for display; districtId is the authoritative relation when a real district was picked.
      if (district) formData.append("district", district);
      if (districtId) formData.append("districtId", districtId);
      formData.append("state", state);
      formData.append("zipCode", zipCode);
      formData.append("country", country);
      formData.append("timeZone", timezone);
      if (logo) {
        formData.append("logo", logo);
      }
      const response = isEditing
        ? await updateSchool(school._id, formData, token)
        : await addSchool(formData, token);


      if (!response.error) {
        toast({
          title: isEditing
            ? "School updated successfully"
            : "School added successfully",
          description: response.message || `${schoolName} has been ${isEditing ? "updated" : "added"} to the system.`,
        });
        setLoading(false);
        setSchool(response.school || response.data?.school);
        setIsEditing(false);
        navigate("/analytics");
      } else {
        const errorMsg = typeof response.error === 'string' ? response.error : (response.error.message || "Failed to process the request. Please try again.");
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
      }
      setLoading(false);
    }
  };



  const formFields = (
    <>
      <div>
        <Label htmlFor="city">City</Label>
        <Input
          id="city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
      </div>
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
        <Label htmlFor="zipCode">Zip Code</Label>
        <Input
          id="zipCode"
          value={zipCode}
          onChange={(e) => setZipCode(e.target.value)}
        />
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

            <div className="flex flex-col items-center text-center text-sm w-60">
              <p className="">{school.district}</p>
              <h2 className="text-lg font-semibold">{school.name}</h2>
              {school.address && <p className="text-xs">{school.address}</p>}
              {(school.city || school.state || school.zipCode) && (
                <p className="text-xs">
                  {[school.city, school.state, school.zipCode].filter(Boolean).join(", ")}
                </p>
              )}
              {school.country && <p className="text-xs">{school.country}</p>}
            </div>
          </div>


          <div className="flex flex-col gap-5 w-full">
            {
              !isEditing && <SchoolStats stats={stats} />
            }
          </div>
        </div>

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