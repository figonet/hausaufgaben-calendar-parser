export interface Homework {
  id: string;
  subject: string;
  teacher?: string;
  description: string;
  lessonContent?: string;
  dueDate: Date;
  completed?: boolean;
  sourceFileIds: string[];
}

export interface HomeworkByDate {
  date: Date;
  dayName: string;
  assignments: Homework[];
}
