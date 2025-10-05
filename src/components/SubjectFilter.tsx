import { Badge } from "@/components/ui/badge";
import { getSubjectColor } from "@/utils/pdfParser";
import { X } from "lucide-react";

interface SubjectFilterProps {
  subjects: string[];
  selectedSubjects: string[];
  onToggleSubject: (subject: string) => void;
  homeworkCounts: Record<string, number>;
}

export function SubjectFilter({ 
  subjects, 
  selectedSubjects, 
  onToggleSubject,
  homeworkCounts 
}: SubjectFilterProps) {
  if (subjects.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">
        Nach Fach filtern
      </h3>
      <div className="flex flex-wrap gap-2">
        {subjects.map((subject) => {
          const isSelected = selectedSubjects.includes(subject);
          const color = getSubjectColor(subject);
          const count = homeworkCounts[subject] || 0;
          
          return (
            <Badge
              key={subject}
              variant={isSelected ? "default" : "outline"}
              className="cursor-pointer transition-all hover:scale-105 px-3 py-1.5"
              style={
                isSelected
                  ? {
                      backgroundColor: `hsl(${color})`,
                      borderColor: `hsl(${color})`,
                      color: "white",
                    }
                  : {
                      borderColor: `hsl(${color})`,
                      color: `hsl(${color})`,
                    }
              }
              onClick={() => onToggleSubject(subject)}
            >
              {subject} ({count})
              {isSelected && <X className="w-3 h-3 ml-1" />}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
