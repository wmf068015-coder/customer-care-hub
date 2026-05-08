import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Filter } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

const CHANNELS = [
  { id: "all", label: "全部" },
  { id: "desktop", label: "桌面网站" },
  { id: "mobile", label: "移动网站" },
  { id: "shopify", label: "Shopify" },
] as const;

export function FilterBar({ onChange }: { onChange?: (f: { range?: DateRange; channels: string[] }) => void }) {
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 7 * 86400000),
    to: new Date(),
  });
  const [channels, setChannels] = useState<string[]>(["all"]);

  const toggle = (id: string) => {
    let next: string[];
    if (id === "all") next = ["all"];
    else {
      const without = channels.filter((c) => c !== "all");
      next = without.includes(id) ? without.filter((c) => c !== id) : [...without, id];
      if (next.length === 0) next = ["all"];
    }
    setChannels(next);
    onChange?.({ range, channels: next });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-lg border shadow-[var(--shadow-card)] mb-6">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Filter className="w-4 h-4" /> 筛选
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <CalendarIcon className="w-4 h-4" />
            {range?.from && range?.to
              ? `${format(range.from, "yyyy-MM-dd")} ~ ${format(range.to, "yyyy-MM-dd")}`
              : "选择时间范围"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="range" selected={range} onSelect={(r) => { setRange(r); onChange?.({ range: r, channels }); }} numberOfMonths={2} />
        </PopoverContent>
      </Popover>
      <div className="h-6 w-px bg-border" />
      <span className="text-sm text-muted-foreground">渠道：</span>
      <div className="flex items-center gap-3">
        {CHANNELS.map((c) => (
          <label key={c.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
            <Checkbox checked={channels.includes(c.id)} onCheckedChange={() => toggle(c.id)} />
            {c.label}
          </label>
        ))}
      </div>
    </div>
  );
}