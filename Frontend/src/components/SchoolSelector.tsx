import { useState } from 'react';
import { Check, ChevronsUpDown, School as SchoolIcon, Building2 } from "lucide-react";
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

export function SchoolSelector() {
  const [districtOpen, setDistrictOpen] = useState(false);
  const [schoolOpen, setSchoolOpen] = useState(false);
  const {
    selectedSchoolId,
    setSelectedSchoolId,
    selectedDistrictId,
    setSelectedDistrictId,
    districts,
    schoolsInSelectedDistrict,
  } = useSchool();

  const selectedDistrictName = selectedDistrictId
    ? districts.find((d) => d._id === selectedDistrictId)?.name
    : null;
  const selectedSchoolName = selectedSchoolId
    ? schoolsInSelectedDistrict.find((s) => s._id === selectedSchoolId)?.name
    : null;

  return (
    <div className="flex items-center gap-2">
      <Popover open={districtOpen} onOpenChange={setDistrictOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={districtOpen}
            className="w-[220px] justify-between bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
          >
            <div className="flex items-center gap-2 truncate">
              <Building2 className="h-4 w-4 shrink-0 opacity-70" />
              <span className="truncate">
                {selectedDistrictName || "Select District..."}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[260px] p-0" align="start">
          <Command
            filter={(value, search) =>
              value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
            }
          >
            <CommandInput placeholder="Search districts..." className="h-9" />
            <CommandList>
              <CommandEmpty>No district found.</CommandEmpty>
              <CommandGroup>
                {districts.map((district) => (
                  <CommandItem
                    key={district._id}
                    value={`${district.name} ${district._id}`}
                    onSelect={() => {
                      if (selectedDistrictId !== district._id) {
                        setSelectedDistrictId(district._id);
                        setSelectedSchoolId(null);
                      }
                      setDistrictOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedDistrictId === district._id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {district.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Popover open={schoolOpen} onOpenChange={setSchoolOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={schoolOpen}
            disabled={!selectedDistrictId}
            className="w-[240px] justify-between bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white disabled:opacity-60"
          >
            <div className="flex items-center gap-2 truncate">
              <SchoolIcon className="h-4 w-4 shrink-0 opacity-70" />
              <span className="truncate">
                {selectedSchoolName || (selectedDistrictId ? "Select School..." : "Pick district first")}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command
            filter={(value, search) =>
              value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
            }
          >
            <CommandInput placeholder="Search schools..." className="h-9" />
            <CommandList>
              <CommandEmpty>No school found.</CommandEmpty>
              <CommandGroup>
                {schoolsInSelectedDistrict.map((school) => (
                  <CommandItem
                    key={school._id}
                    value={`${school.name} ${school._id}`}
                    onSelect={() => {
                      setSelectedSchoolId(school._id);
                      setSchoolOpen(false);
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
    </div>
  );
}
