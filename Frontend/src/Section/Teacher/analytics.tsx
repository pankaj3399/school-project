import { useEffect, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getStudents } from "@/api";
import CurrentWeekCharts from "../School/component/current-week-charts";
import Ranks from "../School/component/ranks";

const AllCharts = () => {
  const [studentName, setStudentName] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setfilteredStudents] = useState<any[]>([]);
  const [isPopOverOpen, setIsPopOverOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      console.log("=== TEACHER ANALYTICS DEBUG ===");
      const token = localStorage.getItem("token");
      console.log("Token:", token ? "exists" : "missing");
      const resTeacher = await getStudents(token ?? "");
      console.log("Students response:", resTeacher);
      console.log("Students array:", resTeacher.students);
      setStudents(resTeacher.students);
      setfilteredStudents(resTeacher.students);
    };
    fetchData();
  }, []);

  console.log("=== ANALYTICS COMPONENT RENDERING ===");
  console.log("StudentId for charts:", studentId);

  return (
    <div>
      <div>
      {Array.isArray(students) && students.length > 0 ? (
        <Popover open={isPopOverOpen} onOpenChange={setIsPopOverOpen}>
          <div className="flex items-center space-x-2 mt-10">
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
              >
                {studentName
                  ? `${students.find((s: any) => s._id === studentId)?.name} (Grade ${students.find((s: any) => s._id === studentId)?.grade})`
                  : "Select student..."}
              </Button>
            </PopoverTrigger>
            <X
              onClick={() => {
                setStudentId("");
                setStudentName("");
              }}
              className="ml-2 h-4 w-4 shrink-0 opacity-50 cursor-pointer"
            />
          </div>
          <PopoverContent className="w-[600px] p-0 flex flex-col space-y-0">
            <Input
              onChange={(e) => {
                const value = e.target.value;
                setfilteredStudents(
                  students.filter((s: any) =>
                    s.name.toLowerCase().includes(value.toLowerCase())
                  )
                );
              }}
              className="w-full"
            />
            {filteredStudents.map((s: any) => (
              <Button
                onClick={() => {
                  console.log("=== STUDENT SELECTED ===");
                  console.log("Selected student:", { id: s._id, name: s.name, grade: s.grade });
                  setStudentId(s._id);
                  setStudentName(s.name);
                  setIsPopOverOpen(false);
                }}
                key={s._id}
                className="justify-start"
                variant={"ghost"}
              >
                {`${s.name} (Grade ${s.grade})`}
              </Button>
            ))}
          </PopoverContent>
        </Popover>
      ) : (
        <div>No students available</div>
      )}
      </div>
      <div className="mt-12 space-y-4 grid grid-cols-4">
        <div className="col-span-3">
          <CurrentWeekCharts studentId={studentId} isTeacher />
        </div>
        <Ranks />
      </div>
    </div>
  );
};

export default AllCharts;
