import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, School } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSchool } from "../context/SchoolContext";
import { getAllSchools } from "../api";

export function SchoolSelector() {
  const [open, setOpen] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const { selectedSchoolId, setSelectedSchoolId } = useSchool();

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const data = await getAllSchools(token);
        if (data.schools) {
          setSchools(data.schools);
        }
      } catch (error) {
        console.error("Error fetching schools:", error);
      }
    };

    fetchSchools();
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[250px] justify-between bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
        >
          <div className="flex items-center gap-2 truncate">
            <School className="h-4 w-4 shrink-0 opacity-70" />
            <span className="truncate">
              {selectedSchoolId
                ? schools.find((school) => school._id === selectedSchoolId)?.name
                : "Select School..."}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search schools..." className="h-9" />
          <CommandList>
            <CommandEmpty>No school found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setSelectedSchoolId(null);
                  setOpen(false);
                }}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    !selectedSchoolId ? "opacity-100" : "opacity-0"
                  )}
                />
                All Schools (Default)
              </CommandItem>
              {schools.map((school) => (
                <CommandItem
                  key={school._id}
                  onSelect={() => {
                    setSelectedSchoolId(school._id);
                    setOpen(false);
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
  );
}
