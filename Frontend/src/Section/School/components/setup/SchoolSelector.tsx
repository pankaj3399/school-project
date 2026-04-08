import { useState } from "react";
import { Check, ChevronsUpDown, School, Search } from "lucide-react";
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
import { useSchool } from "@/context/SchoolContext";

interface SchoolSelectorProps {
  className?: string;
}

export function SchoolSelector({ className }: SchoolSelectorProps) {
  const [open, setOpen] = useState(false);
  const { schools, selectedSchoolId, setSelectedSchoolId } = useSchool();

  const selectedSchool = schools.find((school) => school._id === selectedSchoolId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full md:w-[300px] justify-between h-12 px-4 rounded-2xl border-neutral-200 bg-white/50 backdrop-blur-sm hover:bg-white hover:border-teal-300 hover:shadow-md transition-all group",
            className
          )}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={cn(
              "p-1.5 rounded-lg transition-colors",
              selectedSchool ? "bg-teal-50 text-teal-600" : "bg-neutral-100 text-neutral-400 group-hover:bg-teal-50 group-hover:text-teal-600"
            )}>
              <School className="w-4 h-4" />
            </div>
            <span className="truncate font-bold text-neutral-700">
              {selectedSchool ? selectedSchool.name : "Select school context..."}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-neutral-400 transition-transform group-hover:scale-110" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full md:w-[300px] p-0 rounded-2xl border-neutral-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <Command className="bg-white">
          <div className="flex items-center border-b px-3 border-neutral-100">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-neutral-400" />
            <CommandInput 
              placeholder="Search schools..." 
              className="h-12 border-none focus:ring-0 text-sm font-medium"
            />
          </div>
          <CommandList className="max-h-[300px] py-1">
            <CommandEmpty className="py-6 text-center text-sm text-neutral-500 font-medium">
              No matching schools found.
            </CommandEmpty>
            <CommandGroup heading="Available Institutions" className="px-2 pb-2">
              {schools.map((school) => (
                <CommandItem
                  key={school._id}
                  value={school.name}
                  onSelect={() => {
                    setSelectedSchoolId(school._id);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-default hover:bg-teal-50 hover:text-teal-700 data-[selected=true]:bg-teal-50 data-[selected=true]:text-teal-700 transition-colors"
                >
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <span className="font-bold text-sm truncate">{school.name}</span>
                    <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider truncate">
                      {school.district || school.districtId?.name || "No District Assigned"}
                    </span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4 text-teal-600 transition-opacity",
                      selectedSchoolId === school._id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
