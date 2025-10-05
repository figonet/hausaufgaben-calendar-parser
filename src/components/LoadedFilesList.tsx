import { X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface LoadedFile {
  id: string;
  name: string;
  size: number;
  homeworkCount: number;
}

interface LoadedFilesListProps {
  files: LoadedFile[];
  onRemoveFile: (fileId: string) => void;
}

export function LoadedFilesList({ files, onRemoveFile }: LoadedFilesListProps) {
  if (files.length === 0) return null;

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        Geladene PDFs ({files.length})
      </h3>
      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB • {file.homeworkCount} Hausaufgaben
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveFile(file.id)}
              className="ml-2 h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
