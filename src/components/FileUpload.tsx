import { useCallback, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onFilesSelect: (files: File[]) => void;
  isLoading?: boolean;
  hasFiles?: boolean;
}

export function FileUpload({ onFilesSelect, isLoading, hasFiles }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(
      file => file.type === "application/pdf"
    );
    if (files.length > 0) {
      onFilesSelect(files);
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  }, [onFilesSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type === "application/pdf"
    );
    
    if (files.length > 0) {
      onFilesSelect(files);
    }
  }, [onFilesSelect]);

  return (
    <div 
      className={`flex flex-col items-center gap-4 p-8 border-2 border-dashed rounded-lg transition-all ${
        isDragging 
          ? 'border-primary bg-primary/10 scale-[1.02]' 
          : 'border-border bg-muted/30 hover:border-primary hover:bg-muted/50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Upload className="w-12 h-12 text-muted-foreground" />
      <div className="text-center space-y-2">
        <h3 className="font-semibold text-lg">
          {hasFiles ? "Weitere PDF-Dateien hinzufügen" : "PDF-Datei(en) hochladen"}
        </h3>
        <p className="text-sm text-muted-foreground">
          Wählen Sie ein oder mehrere Klassenbuch-PDFs aus
        </p>
      </div>
      <Button
        variant="default"
        disabled={isLoading}
        onClick={() => document.getElementById("pdf-upload")?.click()}
        className="relative"
      >
        {isLoading ? "Wird verarbeitet..." : hasFiles ? "Weitere hinzufügen" : "Datei(en) auswählen"}
      </Button>
      <input
        id="pdf-upload"
        type="file"
        accept=".pdf"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
