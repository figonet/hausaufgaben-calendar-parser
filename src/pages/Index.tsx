import { useState, useEffect } from "react";
import { Homework, HomeworkByDate } from "@/types/homework";
import { parsePDF } from "@/utils/pdfParser";
import { mergeHomeworks } from "@/utils/homeworkMerger";
import { FileUpload } from "@/components/FileUpload";
import { LoadedFilesList } from "@/components/LoadedFilesList";
import { CalendarView } from "@/components/CalendarView";
import { SubjectFilter } from "@/components/SubjectFilter";
import { HomeworkCalendar } from "@/components/HomeworkCalendar";
import { BookOpen, Menu, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";

interface LoadedFile {
  id: string;
  name: string;
  size: number;
  homeworkCount: number;
  homeworks: Homework[];
}

const Index = () => {
  const isMobile = useIsMobile();
  const [loadedFiles, setLoadedFiles] = useState<LoadedFile[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [homeworkByDate, setHomeworkByDate] = useState<HomeworkByDate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [scrollToDate, setScrollToDate] = useState<Date | undefined>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auto-open sidebar when files are loaded (desktop only)
  useEffect(() => {
    if (!isMobile && loadedFiles.length > 0 && !isSidebarOpen) {
      setIsSidebarOpen(true);
    }
  }, [loadedFiles.length, isMobile]);

  // Load completed status from localStorage
  useEffect(() => {
    const savedCompleted = localStorage.getItem('homework-completed');
    if (savedCompleted) {
      const completedIds = JSON.parse(savedCompleted) as string[];
      setHomeworks(prev => prev.map(hw => ({
        ...hw,
        completed: completedIds.includes(hw.id)
      })));
    }
  }, []);

  // Auto-select nearest homework date on first load
  useEffect(() => {
    if (homeworkByDate.length > 0 && !selectedDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTime = today.getTime();

      // Find the nearest future date with homework
      const futureDates = homeworkByDate
        .filter(day => day.date.getTime() >= todayTime)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      if (futureDates.length > 0) {
        setSelectedDate(futureDates[0].date);
        setScrollToDate(futureDates[0].date);
      } else {
        // If no future dates, use the last date with homework
        const sortedDates = [...homeworkByDate].sort((a, b) => b.date.getTime() - a.date.getTime());
        if (sortedDates.length > 0) {
          setSelectedDate(sortedDates[0].date);
          setScrollToDate(sortedDates[0].date);
        }
      }
    }
  }, [homeworkByDate.length]);

  const updateHomeworkDisplay = (allHomeworks: Homework[]) => {
    // Group by date
    const grouped = allHomeworks.reduce((acc, hw) => {
      const dateKey = hw.dueDate.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(hw);
      return acc;
    }, {} as Record<string, Homework[]>);

    // Convert to array and sort by date
    const homeworkByDateArray: HomeworkByDate[] = Object.entries(grouped)
      .map(([_, assignments]) => ({
        date: assignments[0].dueDate,
        dayName: format(assignments[0].dueDate, 'EEEE', { locale: de }),
        assignments: assignments
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    setHomeworks(allHomeworks);
    setHomeworkByDate(homeworkByDateArray);
  };

  const handleFilesSelect = async (files: File[]) => {
    setIsLoading(true);
    
    const newLoadedFiles: LoadedFile[] = [];
    const newHomeworks: Homework[] = [];

    try {
      toast.info(`${files.length} PDF(s) werden geladen...`);

      for (const file of files) {
        const fileId = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const parsedHomeworks = await parsePDF(file, fileId);
        
        // Add file to list even if no homework found
        newLoadedFiles.push({
          id: fileId,
          name: file.name,
          size: file.size,
          homeworkCount: parsedHomeworks.length,
          homeworks: parsedHomeworks
        });
        
        if (parsedHomeworks.length > 0) {
          newHomeworks.push(...parsedHomeworks);
        } else {
          toast.warning(`${file.name}: Keine Hausaufgaben mit Datum gefunden`);
        }
      }

      // Always add files to the list
      const updatedFiles = [...loadedFiles, ...newLoadedFiles];
      setLoadedFiles(updatedFiles);

      if (newHomeworks.length === 0) {
        toast.info("Datei(en) hinzugefügt, aber keine neuen Hausaufgaben mit Datum gefunden.");
        setIsLoading(false);
        return;
      }

      // Add to existing homeworks, merging duplicates
      const allHomeworks = mergeHomeworks(homeworks, newHomeworks);
      
      const addedCount = allHomeworks.length - homeworks.length;

      updateHomeworkDisplay(allHomeworks);
      
      if (addedCount < newHomeworks.length) {
        const duplicates = newHomeworks.length - addedCount;
        toast.success(
          `${addedCount} neue Hausaufgaben hinzugefügt, ${duplicates} Duplikate übersprungen (Gesamt: ${allHomeworks.length})`
        );
      } else {
        toast.success(`${addedCount} neue Hausaufgaben hinzugefügt (Gesamt: ${allHomeworks.length})`);
      }
    } catch (error) {
      toast.error(`Fehler: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFile = (fileId: string) => {
    const fileToRemove = loadedFiles.find(f => f.id === fileId);
    if (!fileToRemove) return;

    // Remove file from the list
    const updatedFiles = loadedFiles.filter(f => f.id !== fileId);
    setLoadedFiles(updatedFiles);
    
    // Remove fileId from all homeworks and filter out homeworks with no remaining sources
    const updatedHomeworks = homeworks
      .map(hw => ({
        ...hw,
        sourceFileIds: hw.sourceFileIds.filter(id => id !== fileId)
      }))
      .filter(hw => hw.sourceFileIds.length > 0); // Keep only homeworks that still have sources

    if (updatedHomeworks.length === 0) {
      setHomeworks([]);
      setHomeworkByDate([]);
      setSelectedSubjects([]);
      setSelectedDate(undefined);
    } else {
      updateHomeworkDisplay(updatedHomeworks);
    }

    toast.success(`${fileToRemove.name} entfernt`);
  };

  const handleToggleSubject = (subject: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    
    if (!date) {
      setScrollToDate(undefined);
      return;
    }

    // Check if there's homework on this date
    const dateKey = date.toISOString().split('T')[0];
    const hasHomeworkOnDate = homeworkByDate.some(
      day => day.date.toISOString().split('T')[0] === dateKey
    );

    if (hasHomeworkOnDate) {
      setScrollToDate(date);
      return;
    }

    // Find the nearest next date with homework for scrolling
    const selectedTime = date.getTime();
    const futureDates = homeworkByDate
      .filter(day => day.date.getTime() >= selectedTime)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (futureDates.length > 0) {
      setScrollToDate(futureDates[0].date);
    } else {
      // If no future dates, use the last date with homework
      const sortedDates = [...homeworkByDate].sort((a, b) => b.date.getTime() - a.date.getTime());
      if (sortedDates.length > 0) {
        setScrollToDate(sortedDates[0].date);
      }
    }
  };

  const handleToggleComplete = (homeworkId: string) => {
    const updatedHomeworks = homeworks.map(hw => 
      hw.id === homeworkId ? { ...hw, completed: !hw.completed } : hw
    );
    setHomeworks(updatedHomeworks);
    updateHomeworkDisplay(updatedHomeworks);
    
    // Save to localStorage
    const completedIds = updatedHomeworks.filter(hw => hw.completed).map(hw => hw.id);
    localStorage.setItem('homework-completed', JSON.stringify(completedIds));
  };

  // Get unique subjects and their counts from current homeworks
  const subjects = Array.from(new Set(homeworks.map(hw => hw.subject))).sort();
  
  // Count homeworks per subject based on currently loaded homeworks
  const homeworkCounts = subjects.reduce((acc, subject) => {
    acc[subject] = homeworks.filter(hw => hw.subject === subject).length;
    return acc;
  }, {} as Record<string, number>);

  // Get dates with homework
  const datesWithHomework = homeworks.map(hw => hw.dueDate);

  // Filter homeworks by subject only
  const filteredHomeworkByDate = homeworkByDate
    .map(day => ({
      ...day,
      assignments: day.assignments.filter(hw => 
        selectedSubjects.length === 0 || selectedSubjects.includes(hw.subject)
      )
    }))
    .filter(day => day.assignments.length > 0);

  const filteredCount = filteredHomeworkByDate.reduce(
    (sum, day) => sum + day.assignments.length,
    0
  );

  // Sidebar content component
  const SidebarContent = () => (
    <>
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-lg shadow-md">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Hausaufgaben
          </h1>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <HomeworkCalendar
          datesWithHomework={datesWithHomework}
          onDateSelect={handleDateSelect}
          selectedDate={selectedDate}
        />
        
        {subjects.length > 0 && (
          <SubjectFilter
            subjects={subjects}
            selectedSubjects={selectedSubjects}
            onToggleSubject={handleToggleSubject}
            homeworkCounts={homeworkCounts}
          />
        )}

        {loadedFiles.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Geladene Dateien</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => document.getElementById("sidebar-pdf-upload")?.click()}
                disabled={isLoading}
              >
                <Upload className="h-3 w-3" />
                {isLoading ? "Lädt..." : "Hinzufügen"}
              </Button>
            </div>
            <input
              id="sidebar-pdf-upload"
              type="file"
              accept=".pdf"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []).filter(
                  file => file.type === "application/pdf"
                );
                if (files.length > 0) {
                  handleFilesSelect(files);
                }
                e.target.value = '';
              }}
              className="hidden"
            />
            <LoadedFilesList 
              files={loadedFiles.map(f => ({ 
                id: f.id,
                name: f.name, 
                size: f.size, 
                homeworkCount: f.homeworkCount 
              }))} 
              onRemoveFile={handleRemoveFile}
            />
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col h-screen overflow-hidden">
      {/* Mobile Menu Overlay */}
      {isMobile && isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Menu Panel */}
          <aside className="fixed top-0 left-0 bottom-0 w-[85vw] sm:w-[350px] bg-card border-r shadow-lg z-50 flex flex-col animate-slide-in-right">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Global Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            {isMobile ? (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-10 w-10 p-0 hover:bg-transparent hover:text-current"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-10 w-10 p-0 hover:bg-transparent hover:text-current"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-lg shadow-md">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Hausaufgaben
            </h1>
          </div>
        </div>
      </div>

      {/* Content Area with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside className={`border-r bg-card/50 backdrop-blur-sm flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-72' : 'w-0 border-r-0 overflow-hidden'}`}>
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              <HomeworkCalendar
                datesWithHomework={datesWithHomework}
                onDateSelect={handleDateSelect}
                selectedDate={selectedDate}
              />
              
              {subjects.length > 0 && (
                <SubjectFilter
                  subjects={subjects}
                  selectedSubjects={selectedSubjects}
                  onToggleSubject={handleToggleSubject}
                  homeworkCounts={homeworkCounts}
                />
              )}

              {loadedFiles.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">Geladene Dateien</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      onClick={() => document.getElementById("sidebar-pdf-upload")?.click()}
                      disabled={isLoading}
                    >
                      <Upload className="h-3 w-3" />
                      {isLoading ? "Lädt..." : "Hinzufügen"}
                    </Button>
                  </div>
                  <input
                    id="sidebar-pdf-upload"
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []).filter(
                        file => file.type === "application/pdf"
                      );
                      if (files.length > 0) {
                        handleFilesSelect(files);
                      }
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                  <LoadedFilesList 
                    files={loadedFiles.map(f => ({ 
                      id: f.id,
                      name: f.name, 
                      size: f.size, 
                      homeworkCount: f.homeworkCount 
                    }))} 
                    onRemoveFile={handleRemoveFile}
                  />
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4">
            {homeworkByDate.length === 0 ? (
              <div className="text-center py-8 sm:py-16 px-4">
                <div className="p-3 sm:p-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl inline-block mb-4">
                  <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-muted-foreground mb-2">
                  Keine Hausaufgaben geladen
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
                  Laden Sie ein Klassenbuch-PDF hoch, um zu beginnen
                </p>
                <div className="max-w-2xl mx-auto">
                  <FileUpload 
                    onFilesSelect={handleFilesSelect} 
                    isLoading={isLoading}
                    hasFiles={loadedFiles.length > 0}
                  />
                </div>
              </div>
            ) : (
              <CalendarView
                homeworkByDate={filteredHomeworkByDate}
                scrollToDate={scrollToDate}
                onToggleComplete={handleToggleComplete}
                isLoading={isLoading}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
