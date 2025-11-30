import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, X } from "lucide-react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx"
        data-testid="input-file"
      />
      <Button
        size="icon"
        variant="ghost"
        onClick={() => fileInputRef.current?.click()}
        data-testid="button-attach-file"
      >
        <Paperclip className="h-5 w-5" />
      </Button>
      {selectedFile && (
        <div className="flex items-center gap-2 text-xs bg-muted p-2 rounded-lg">
          <span className="truncate">{selectedFile.name}</span>
          <button
            onClick={() => setSelectedFile(null)}
            data-testid="button-remove-file"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
