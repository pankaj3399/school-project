import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Loading from "../Loading";
import { addSchool } from "@/api";

export default function AddSchool() {
  const [schoolName, setSchoolName] = useState("");
  const [address, setAddress] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!schoolName.trim()) {
      newErrors.schoolName = "School name is required";
    }

    if (!address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!logo) {
      newErrors.logo = "Logo is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (file: File) => {
    const CLOUD_NAME = import.meta.env.VITE_CLOUD_NAME as string; 
    const UPLOAD_PRESET = import.meta.env.VITE_UPLOAD_PRESET as string; 

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("cloud_name", CLOUD_NAME);

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        formData
      );
      return response.data.secure_url; 
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      throw new Error("Failed to upload image");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        console.log("xinidsni",token);
        const logoUrl = await handleImageUpload(logo as File);


        if (!token) {
          toast({
            title: "Error",
            description: "You are not authenticated.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const formData = {
          name: schoolName,
          address,
          logo: logoUrl,
        };
        console.log("dbibujdeb",formData);

        const response = await addSchool(formData, token);

        if (response.status === 200) {
          toast({
            title: "School added successfully",
            description: `${schoolName} has been added to the system.`,
          });
          navigate("/viewschool");
        } else {
          toast({
            title: "Error",
            description: "Failed to add the school. Please try again.",
            variant: "destructive",
          });
        }

        setLoading(false);
      } catch (error) {
        setError("An unexpected error occurred. Please try again.");
        setLoading(false);

        toast({
          title: "Error",
          description: "Failed to add the school. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Add School</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <Label htmlFor="schoolName">School Name</Label>
          <Input
            id="schoolName"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            required
          />
          {errors.schoolName && <p className="text-red-500 text-sm mt-1">{errors.schoolName}</p>}
        </div>
        <div>
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
          {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
        </div>
        <div>
          <Label htmlFor="logo">Logo</Label>
          <Input
            id="logo"
            type="file"
            onChange={(e) => setLogo(e.target.files?.[0] || null)}
            accept="image/*"
          />
          {errors.logo && <p className="text-red-500 text-sm mt-1">{errors.logo}</p>}
        </div>
        <Button type="submit">Add School</Button>
      </form>
    </div>
  );
}
