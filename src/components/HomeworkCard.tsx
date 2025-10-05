import { Homework } from "@/types/homework";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { getSubjectColor } from "@/utils/pdfParser";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface HomeworkCardProps {
  homework: Homework;
  onToggleComplete: (id: string) => void;
}

export function HomeworkCard({ homework, onToggleComplete }: HomeworkCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const color = getSubjectColor(homework.subject);
  const isCompleted = homework.completed || false;
  
  return (
    <Card 
      className={`group relative overflow-hidden backdrop-blur-sm bg-card/50 border border-border/50 
                 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 
                 hover:-translate-y-1 hover:bg-card/80 ${isCompleted ? 'opacity-60' : ''} cursor-pointer 
                 ${isExpanded ? '' : 'min-h-[180px]'}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Accent bar with gradient */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-500 group-hover:w-1.5"
        style={{ 
          background: `linear-gradient(to bottom, hsl(${color}), hsl(${color} / 0.5))` 
        }}
      />
      
      {/* Subtle glow effect on hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top left, hsl(${color} / 0.1), transparent 70%)`
        }}
      />
      
      <div className="relative p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isCompleted}
              onCheckedChange={() => onToggleComplete(homework.id)}
              className="flex-shrink-0"
            />
          </div>
          <div 
            className="w-2 h-2 rounded-full shadow-lg transition-all duration-500 group-hover:scale-125"
            style={{ 
              backgroundColor: `hsl(${color})`,
              boxShadow: `0 0 12px hsl(${color} / 0.5)`
            }}
          />
          <h3 className={`font-semibold text-base text-card-foreground tracking-tight flex-1 ${isCompleted ? 'line-through' : ''}`}>
            {homework.subject}
          </h3>
          <ChevronDown 
            className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
        
        {homework.teacher && (
          <p className={`text-xs text-muted-foreground/80 font-medium pl-10 ${isCompleted ? 'line-through' : ''}`}>
            {homework.teacher}
          </p>
        )}
        
        <p className={`text-sm text-muted-foreground leading-relaxed pl-10 ${isExpanded ? '' : 'line-clamp-3'} ${isCompleted ? 'line-through' : ''}`}>
          {homework.description}
        </p>

        {isExpanded && homework.lessonContent && (
          <div className="pl-10 pt-3 mt-3 border-t border-border/50">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">
              Unterrichtsinhalt:
            </h4>
            <p className="text-sm text-muted-foreground/80 leading-relaxed">
              {homework.lessonContent}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
