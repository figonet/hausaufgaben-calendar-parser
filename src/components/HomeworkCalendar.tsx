import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { format, isSameDay } from "date-fns";
import { de } from "date-fns/locale";

interface HomeworkCalendarProps {
  datesWithHomework: Date[];
  onDateSelect: (date: Date | undefined) => void;
  selectedDate: Date | undefined;
}

export function HomeworkCalendar({ 
  datesWithHomework, 
  onDateSelect,
  selectedDate 
}: HomeworkCalendarProps) {
  const [month, setMonth] = useState<Date>(selectedDate || new Date());

  const modifiers = {
    homework: datesWithHomework,
  };

  const modifiersClassNames = {
    homework: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-primary",
  };

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        Kalender
      </h3>
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onDateSelect}
        month={month}
        onMonthChange={setMonth}
        locale={de}
        modifiers={modifiers}
        modifiersClassNames={modifiersClassNames}
        className="rounded-md border pointer-events-auto scale-90 -m-4"
        classNames={{
          day_selected:
            "bg-primary/20 !text-foreground hover:bg-primary/30 hover:!text-foreground focus:bg-primary/20 aria-selected:!text-foreground rounded-full",
          day_today: "bg-accent/30 text-foreground rounded-full",
          cell: "h-8 w-8 text-center text-sm p-0 relative",
          day: "h-8 w-8 p-0 text-xs rounded-full",
          head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.7rem]",
        }}
      />
      {selectedDate && (
        <p className="text-sm text-muted-foreground mt-3 text-center">
          Ausgewählt: {format(selectedDate, 'dd.MM.yyyy', { locale: de })}
        </p>
      )}
    </Card>
  );
}
