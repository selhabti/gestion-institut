import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { GroupType } from "@/types/member";

interface DateGroupSelectorProps {
  selectedDate: Date;
  selectedGroup: GroupType;
  onDateChange: (direction: 'prev' | 'next') => void;
  onGroupChange: (group: GroupType) => void;
}

export const DateGroupSelector = ({
  selectedDate,
  selectedGroup,
  onGroupChange
}: DateGroupSelectorProps) => {
  const formatDateDisplay = (date: Date) => ({
    day: date.getDate().toString(),
    month: date.toLocaleDateString('fr-FR', { month: 'long' }),
    weekday: date.toLocaleDateString('fr-FR', { weekday: 'long' }),
    full: date.toLocaleDateString('fr-FR', { 
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  });

  const dateDisplay = formatDateDisplay(selectedDate);

  return (
    <Card className="mb-6 sm:mb-8 border-slate-200 shadow-sm">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="text-center">
              <div className="text-xs sm:text-sm font-medium text-slate-600 uppercase tracking-wide">{dateDisplay.weekday}</div>
              <div className="text-3xl sm:text-4xl font-bold text-blue-600">{dateDisplay.day}</div>
              <div className="text-xs sm:text-sm font-medium text-slate-600 uppercase tracking-wide">
                {dateDisplay.month}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
            {(["Samedi", "Dimanche", "Lundi"] as GroupType[]).map((group) => (
              <Button
                key={group}
                variant={selectedGroup === group ? "default" : "outline"}
                onClick={() => onGroupChange(group)}
                className={`text-xs sm:text-sm ${
                  selectedGroup === group 
                    ? "bg-blue-600 hover:bg-blue-700" 
                    : "border-slate-300"
                }`}
                size="sm"
              >
                {group === "Lundi" ? "Nouraniya" : group}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
