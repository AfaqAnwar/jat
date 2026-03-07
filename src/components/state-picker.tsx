import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { toast } from "sonner";

const US_STATES = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"],
  ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"],
  ["DC", "District of Columbia"], ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"],
  ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"],
  ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"],
  ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"],
  ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"],
  ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"],
  ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"],
  ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"],
  ["SC", "South Carolina"], ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"],
  ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"],
  ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
] as const;

export function StatePicker({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const prefs = useQuery(api.preferences.get);
  const setStateMutation = useMutation(api.preferences.setState);
  const [search, setSearch] = useState("");

  const currentState = prefs?.state ?? "";
  const currentName = US_STATES.find(([a]) => a === currentState)?.[1];
  const hasSearch = search.trim().length > 0;

  const handleSelect = async (abbr: string) => {
    const next = abbr === currentState ? "" : abbr;
    await setStateMutation({ state: next });
    toast.dismiss();
    toast.success(
      next
        ? `Location set to ${US_STATES.find(([a]) => a === next)?.[1] ?? next}`
        : "Location cleared",
    );
    setSearch("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setSearch(""); onOpenChange(v); }}>
      <DialogContent className="rounded-none sm:max-w-sm p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>Your Location</DialogTitle>
          <p className="text-xs text-muted-foreground">
            When a job lists multiple locations, we'll auto-select the one in your state.
          </p>
        </DialogHeader>

        {currentName && !hasSearch && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <span className="text-sm">{currentName}</span>
            <button
              onClick={() => void handleSelect(currentState)}
              className="cursor-pointer text-xs text-muted-foreground hover:text-destructive"
            >
              Clear
            </button>
          </div>
        )}

        <Command className="rounded-none border-t">
          <CommandInput
            placeholder={currentName ? "Change state..." : "Search states..."}
            value={search}
            onValueChange={setSearch}
          />
          {hasSearch && (
            <CommandList className="max-h-64">
              <CommandEmpty>No state found.</CommandEmpty>
              <CommandGroup>
                {US_STATES.map(([abbr, name]) => (
                  <CommandItem
                    key={abbr}
                    value={`${name} ${abbr}`}
                    onSelect={() => void handleSelect(abbr)}
                    data-checked={currentState === abbr || undefined}
                    className="cursor-pointer"
                  >
                    <span className="flex-1">{name}</span>
                    <span className="w-6 shrink-0 text-right font-mono text-xs text-muted-foreground">{abbr}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          )}
        </Command>
      </DialogContent>
    </Dialog>
  );
}
