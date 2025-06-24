import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { CloudUpload, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFilesSelect: (files: File[]) => void;
}

export function FileUpload({ onFilesSelect }: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const extractReactFiles = useCallback(async (items: DataTransferItemList | FileList): Promise<File[]> => {
    const reactFiles: File[] = [];
    
    const processEntry = async (entry: any, path = ""): Promise<void> => {
      if (entry.isFile) {
        return new Promise((resolve) => {
          entry.file((file: File) => {
            if (file.name.endsWith('.jsx') || file.name.endsWith('.tsx') || file.name.endsWith('.js') || file.name.endsWith('.ts')) {
              // Create a new file with the full path
              const newFile = new File([file], path + file.name, { type: file.type });
              reactFiles.push(newFile);
            }
            resolve();
          });
        });
      } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        return new Promise((resolve) => {
          const readEntries = () => {
            dirReader.readEntries(async (entries: any[]) => {
              if (entries.length === 0) {
                resolve();
                return;
              }
              for (const childEntry of entries) {
                await processEntry(childEntry, path + entry.name + "/");
              }
              readEntries(); // Continue reading if there are more entries
            });
          };
          readEntries();
        });
      }
    };

    // Handle drag and drop items
    if ('length' in items && items[0] && 'webkitGetAsEntry' in items[0]) {
      const itemList = items as DataTransferItemList;
      for (let i = 0; i < itemList.length; i++) {
        const item = itemList[i];
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            await processEntry(entry);
          }
        }
      }
    } else {
      // Handle file input
      const fileList = items as FileList;
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (file.name.endsWith('.jsx') || file.name.endsWith('.tsx') || file.name.endsWith('.js') || file.name.endsWith('.ts')) {
          reactFiles.push(file);
        }
      }
    }

    return reactFiles;
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragActive(false);

      const files = await extractReactFiles(e.dataTransfer.items);
      
      if (files.length > 0) {
        onFilesSelect(files);
      }
    },
    [onFilesSelect, extractReactFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = await extractReactFiles(e.target.files || new FileList());

      if (files.length > 0) {
        onFilesSelect(files);
      }
    },
    [onFilesSelect, extractReactFiles]
  );

  const handleFolderInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = await extractReactFiles(e.target.files || new FileList());

      if (files.length > 0) {
        onFilesSelect(files);
      }
    },
    [onFilesSelect, extractReactFiles]
  );

  return (
    <div
      className={cn(
        "border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-cyan-500 transition-colors cursor-pointer",
        isDragActive && "border-cyan-500 bg-cyan-50"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <CloudUpload className="mx-auto text-4xl text-gray-400 mb-4" size={48} />
      <p className="text-gray-600 mb-2">Drop entire project folder or React files here</p>
      <p className="text-sm text-gray-500 mb-4">Supports .jsx, .tsx, .js, .ts files and folders</p>
      
      <div className="space-y-2">
        <input
          type="file"
          multiple
          accept=".jsx,.tsx,.js,.ts"
          onChange={handleFileInput}
          className="hidden"
          id="file-input"
        />
        <input
          type="file"
          {...({ webkitdirectory: "" } as any)}
          multiple
          onChange={handleFolderInput}
          className="hidden"
          id="folder-input"
        />
        
        <div className="flex gap-2 justify-center">
          <Button asChild variant="outline" size="sm" className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white">
            <label htmlFor="file-input" className="cursor-pointer">
              <CloudUpload className="mr-2" size={16} />
              Browse Files
            </label>
          </Button>
          <Button asChild variant="outline" size="sm" className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white">
            <label htmlFor="folder-input" className="cursor-pointer">
              <FolderOpen className="mr-2" size={16} />
              Select Folder
            </label>
          </Button>
        </div>
      </div>
    </div>
  );
}
