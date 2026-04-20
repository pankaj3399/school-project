import { useEffect, useState } from "react";
import { getStudents, getStats } from "@/api";
import { useSchool } from "@/context/SchoolContext";
import { useAuth } from "@/authContext";
import { Role } from "@/enum";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ChevronsUpDown, School as SchoolIcon, X } from "lucide-react";
import {
    IconUserStar,
    IconUsers,
    IconCoins,
    IconMessage2,
    IconAlertCircle,
    IconArrowBackUp,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import EducationYearChart from "../School/component/new-chart";
import StudentRanks from "../School/component/StudentRanks";
import TeacherRanks from "../School/component/TeacherRanks";

type StatCardColor = "blue" | "green" | "yellow" | "red" | "orange" | "purple";

const StatCard = ({
    title,
    value,
    icon,
    color,
}: {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: StatCardColor;
}) => {
    const colorMap: Record<StatCardColor, string> = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-green-50 text-green-600",
        yellow: "bg-yellow-50 text-yellow-600",
        red: "bg-red-50 text-red-600",
        orange: "bg-orange-50 text-orange-600",
        purple: "bg-purple-50 text-purple-600",
    };

    return (
        <Card className="border-none shadow-sm bg-white overflow-hidden rounded-2xl">
            <CardContent className="p-4 flex flex-col items-center text-center">
                <div className={`p-2.5 rounded-xl mb-3 ${colorMap[color]}`}>{icon}</div>
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
                    {title}
                </div>
                <div className="text-2xl font-black text-neutral-900 leading-none">
                    {(value || 0).toLocaleString()}
                </div>
            </CardContent>
        </Card>
    );
};

const Analytics = () => {
    const { user } = useAuth();
    const { selectedSchoolId, setSelectedSchoolId, schools } = useSchool();

    const isMultiSchoolUser = user?.role === Role.SystemAdmin || user?.role === Role.Admin;
    const effectiveSchoolId = isMultiSchoolUser ? selectedSchoolId || undefined : undefined;

    const [studentName, setStudentName] = useState<string>("");
    const [studentId, setStudentId] = useState<string>("");
    const [students, setStudents] = useState<any[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
    const [isPopOverOpen, setIsPopOverOpen] = useState(false);
    const [schoolPickerOpen, setSchoolPickerOpen] = useState(false);
    const [period, setPeriod] = useState<string>("1Y");
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Reset student filter and refetch students when school changes
    useEffect(() => {
        setStudentId("");
        setStudentName("");

        if (isMultiSchoolUser && !selectedSchoolId) {
            setStudents([]);
            setFilteredStudents([]);
            return;
        }

        let active = true;
        const fetchStudents = async () => {
            const token = localStorage.getItem("token");
            const res = await getStudents(token ?? "", effectiveSchoolId);
            if (!active) return;
            setStudents(res.students || []);
            setFilteredStudents(res.students || []);
        };

        fetchStudents();
        return () => { active = false; };
    }, [effectiveSchoolId, isMultiSchoolUser, selectedSchoolId]);

    // Fetch stats whenever the school scope changes. Multi-school users with no
    // selected school see the aggregate "All Schools" view, so we intentionally
    // let getStats run with an undefined scope.
    useEffect(() => {
        let active = true;
        const fetchStats = async () => {
            setLoading(true);
            try {
                const res = await getStats(effectiveSchoolId);
                if (!active) return;
                if (!res?.error) {
                    setStats(res);
                } else {
                    setStats(null);
                }
            } catch (err) {
                if (!active) return;
                console.error("Error fetching stats:", err);
                setStats(null);
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchStats();
        return () => { active = false; };
    }, [effectiveSchoolId]);

    const resetSchoolScopedState = () => {
        setStudentId("");
        setStudentName("");
        setStudents([]);
        setFilteredStudents([]);
        setStats(null);
        setIsPopOverOpen(false);
    };

    return (
        <div className="p-6 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
                <p className="text-neutral-500 text-sm">
                    Performance overview across tokens, feedback, oopsies, and withdrawals.
                </p>
            </div>

            {/* Filter bar */}
            <div className="flex flex-wrap gap-4 items-center">
                {isMultiSchoolUser && (
                    <Popover open={schoolPickerOpen} onOpenChange={setSchoolPickerOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={schoolPickerOpen}
                                className="w-[280px] justify-between"
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <SchoolIcon className="h-4 w-4 shrink-0 opacity-70" />
                                    <span className="truncate">
                                        {selectedSchoolId
                                            ? schools.find((s) => s._id === selectedSchoolId)?.name || "Select school..."
                                            : "All Schools"}
                                    </span>
                                </div>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[280px] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Search schools..." className="h-9" />
                                <CommandList>
                                    <CommandEmpty>No school found.</CommandEmpty>
                                    <CommandGroup>
                                        <CommandItem
                                            value="all-schools"
                                            onSelect={() => {
                                                resetSchoolScopedState();
                                                setSelectedSchoolId(null);
                                                setSchoolPickerOpen(false);
                                            }}
                                            className="cursor-pointer"
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    !selectedSchoolId ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            All Schools
                                        </CommandItem>
                                        {schools.map((school) => (
                                            <CommandItem
                                                key={school._id}
                                                value={`${school.name} ${school._id}`}
                                                onSelect={() => {
                                                    resetSchoolScopedState();
                                                    setSelectedSchoolId(school._id);
                                                    setSchoolPickerOpen(false);
                                                }}
                                                className="cursor-pointer"
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedSchoolId === school._id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {school.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                )}

                <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1W">Last Week</SelectItem>
                        <SelectItem value="1M">Last Month</SelectItem>
                        <SelectItem value="3M">Last 3 Months</SelectItem>
                        <SelectItem value="6M">Last 6 Months</SelectItem>
                        <SelectItem value="1Y">Academic Year</SelectItem>
                    </SelectContent>
                </Select>

                {Array.isArray(students) && students.length > 0 && (
                    <Popover open={isPopOverOpen} onOpenChange={setIsPopOverOpen}>
                        <div className="flex items-center gap-2">
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-[300px] justify-between">
                                    {studentName
                                        ? `${students.find((s: any) => s._id === studentId)?.name} (${students.find((s: any) => s._id === studentId)?.grade})`
                                        : "All Students"}
                                </Button>
                            </PopoverTrigger>
                            {studentName && (
                                <button
                                    type="button"
                                    aria-label="Clear student selection"
                                    onClick={() => {
                                        setStudentId("");
                                        setStudentName("");
                                    }}
                                    className="inline-flex items-center justify-center rounded hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-1"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <PopoverContent className="w-[300px] p-0 flex flex-col">
                            <Input
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFilteredStudents(
                                        students.filter((s: any) =>
                                            s.name.toLowerCase().includes(value.toLowerCase())
                                        )
                                    );
                                }}
                                placeholder="Search students..."
                                className="w-full"
                            />
                            <div className="max-h-[300px] overflow-y-auto">
                                {filteredStudents.map((s: any) => (
                                    <Button
                                        onClick={() => {
                                            setStudentId(s._id);
                                            setStudentName(s.name);
                                            setIsPopOverOpen(false);
                                        }}
                                        key={s._id}
                                        className="justify-start w-full"
                                        variant="ghost"
                                    >
                                        {`${s.name} (${s.grade})`}
                                    </Button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                )}
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard
                    title="Total Teachers"
                    value={stats?.totalTeachers || 0}
                    icon={<IconUserStar className="w-6 h-6" />}
                    color="green"
                />
                <StatCard
                    title="Total Students"
                    value={stats?.totalStudents || 0}
                    icon={<IconUsers className="w-6 h-6" />}
                    color="blue"
                />
                <StatCard
                    title="Total Tokens"
                    value={stats?.totalPoints || 0}
                    icon={<IconCoins className="w-6 h-6" />}
                    color="yellow"
                />
                <StatCard
                    title="Total Feedbacks"
                    value={stats?.totalFeedbackCount || 0}
                    icon={<IconMessage2 className="w-6 h-6" />}
                    color="purple"
                />
                <StatCard
                    title="Total Oopsies"
                    value={stats?.totalDeductPoints || 0}
                    icon={<IconAlertCircle className="w-6 h-6" />}
                    color="orange"
                />
                <StatCard
                    title="Total Withdrawals"
                    value={stats?.totalWithdrawPoints || 0}
                    icon={<IconArrowBackUp className="w-6 h-6" />}
                    color="red"
                />
            </div>

            {loading && <div className="text-center py-4 text-neutral-400">Loading analytics data...</div>}

            {/* Academic year chart — full width */}
            <Card className="border-neutral-200 shadow-sm overflow-hidden rounded-2xl">
                <CardHeader className="border-b bg-neutral-50/50 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold text-neutral-500 uppercase tracking-widest">
                        Academic Year Performance
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <EducationYearChart studentId={studentId} schoolId={effectiveSchoolId} />
                </CardContent>
            </Card>

            {/* Rankings — side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <StudentRanks studentId={studentId} schoolId={effectiveSchoolId} period={period} />
                <TeacherRanks studentId={studentId} schoolId={effectiveSchoolId} period={period} />
            </div>
        </div>
    );
};

export default Analytics;
