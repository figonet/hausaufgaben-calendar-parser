import { HomeworkByDate } from "@/types/homework";
import { HomeworkCard } from "./HomeworkCard";
import { HomeworkCardSkeleton } from "./HomeworkCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useEffect, useRef } from "react";

interface CalendarViewProps {
  homeworkByDate: HomeworkByDate[];
  scrollToDate?: Date;
  onToggleComplete: (id: string) => void;
  isLoading?: boolean;
}

export function CalendarView({ homeworkByDate, scrollToDate, onToggleComplete, isLoading }: CalendarViewProps) {
  const dayRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (scrollToDate) {
      const dateKey = scrollToDate.toISOString().split('T')[0];
      const element = dayRefs.current[dateKey];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [scrollToDate]);
  
  if (isLoading) {
    return (
      <div className="space-y-8">
        {[1, 2].map((dayIndex) => (
          <div key={dayIndex} className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-[140px] rounded-2xl" />
              <div className="h-px flex-1 bg-border/30" />
            </div>
            <div className="grid gap-4 items-start" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 320px))' }}>
              {[1, 2, 3].map((cardIndex) => (
                <HomeworkCardSkeleton key={cardIndex} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (homeworkByDate.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Keine Hausaufgaben gefunden</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {homeworkByDate.map((day, index) => {
        const dateKey = day.date.toISOString().split('T')[0];
        return (
          <div 
            key={index}
            ref={(el) => { dayRefs.current[dateKey] = el; }}
            className="space-y-4 scroll-mt-8"
          >
          <div className="flex items-center gap-4">
            <div className="relative backdrop-blur-md bg-gradient-to-br from-primary/90 to-accent/90 
                          text-primary-foreground rounded-2xl p-5 min-w-[140px] text-center 
                          shadow-xl shadow-primary/20 border border-primary/20">
              <div className="text-3xl font-bold tracking-tight">
                {format(day.date, 'dd.MM', { locale: de })}
              </div>
              <div className="text-sm font-medium opacity-90 mt-1">
                {day.dayName}
              </div>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-border/50 via-border/30 to-transparent" />
          </div>
          
          <div className="grid gap-4 items-start" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 320px))' }}>
            {day.assignments.map((homework) => (
              <HomeworkCard 
                key={homework.id} 
                homework={homework}
                onToggleComplete={onToggleComplete}
              />
            ))}
          </div>
        </div>
      )})}
    </div>
  );
}
