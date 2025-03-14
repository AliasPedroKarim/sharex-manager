"use client";

import { useState, useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import {
  X,
  Trash2,
  Upload,
  Image,
  AlertCircle,
  FileText,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUploadConfig } from "@/hooks/use-upload-config";
import { useTranslation } from "@/lib/i18n";

interface FileWithPreview extends File {
  preview?: string;
  id: string;
  error?: string | null;
}

interface UploadZoneProps {
  children: React.ReactNode;
  onFinishUpload?: () => void;
}

const fileRejectionMessages = {
  "file-invalid-type":
    "gallery.upload_zone.rejection_messages.file_invalid_type",
  "file-too-large": "gallery.upload_zone.rejection_messages.file_too_large",
  "file-too-small": "gallery.upload_zone.rejection_messages.file_too_small",
  "file-too-many": "gallery.upload_zone.rejection_messages.file_too_many",
  "file-too-many-images":
    "gallery.upload_zone.rejection_messages.file_too_many_images",
  "file-too-many-documents":
    "gallery.upload_zone.rejection_messages.file_too_many_documents",
  "file-too-many-archives":
    "gallery.upload_zone.rejection_messages.file_too_many_archives",
};

export const UploadZone = ({ children, onFinishUpload }: UploadZoneProps) => {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { config, isLoading, isFileAllowed } = useUploadConfig();

  // Définir les types de fichiers acceptés en fonction de la configuration
  const acceptedFileTypes = useMemo(() => {
    const accept: Record<string, string[]> = {};

    if (config.allowedTypes.images) {
      accept["image/*"] = [".png", ".jpg", ".jpeg", ".gif", ".webp"];
    }
    if (config.allowedTypes.documents) {
      accept["application/pdf"] = [".pdf"];
      accept["application/msword"] = [".doc"];
      accept[
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ] = [".docx"];
      accept["text/plain"] = [".txt"];
    }
    if (config.allowedTypes.archives) {
      accept["application/zip"] = [".zip"];
      accept["application/x-rar-compressed"] = [".rar"];
    }

    return accept;
  }, [config.allowedTypes]);

  // Créer le message des formats supportés
  const supportedFormatsMessage = useMemo(() => {
    const formats = [];
    if (config.allowedTypes.images) formats.push("PNG, JPG, GIF, WEBP");
    if (config.allowedTypes.documents) formats.push("PDF, DOC, TXT");
    if (config.allowedTypes.archives) formats.push("ZIP, RAR");
    return formats.join(", ");
  }, [config.allowedTypes]);

  const validateFile = (file: File): string | null => {
    const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const documentTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    const archiveTypes = ["application/zip", "application/x-rar-compressed"];

    // Vérifier le type de fichier
    if (imageTypes.includes(file.type) && !config.allowedTypes.images) {
      return t("gallery.upload_zone.validation_errors.images_not_allowed");
    }
    if (documentTypes.includes(file.type) && !config.allowedTypes.documents) {
      return t("gallery.upload_zone.validation_errors.documents_not_allowed");
    }
    if (archiveTypes.includes(file.type) && !config.allowedTypes.archives) {
      return t("gallery.upload_zone.validation_errors.archives_not_allowed");
    }

    if (
      !imageTypes.includes(file.type) &&
      !documentTypes.includes(file.type) &&
      !archiveTypes.includes(file.type)
    ) {
      return t("gallery.upload_zone.validation_errors.unsupported_file_type");
    }

    // Vérifier la taille minimale
    if (file.size < config.limits.minFileSize * 1024) {
      return t("gallery.upload_zone.validation_errors.file_too_small", {
        size: config.limits.minFileSize,
      });
    }

    // Vérifier la taille maximale
    if (file.size > config.limits.maxFileSize * 1024 * 1024) {
      return t("gallery.upload_zone.validation_errors.file_too_large", {
        size: config.limits.maxFileSize,
      });
    }

    // Vérifier le nombre de fichiers par type
    const currentFiles = filesToUpload.filter((f) => !f.error);
    const totalFiles = currentFiles.length;

    if (totalFiles >= config.limits.maxFilesPerUpload) {
      return t("gallery.upload_zone.validation_errors.too_many_files", {
        count: config.limits.maxFilesPerUpload,
      });
    }

    // Vérifier les limites par type
    const currentImagesCount = currentFiles.filter((f) =>
      imageTypes.includes(f.type)
    ).length;
    const currentDocumentsCount = currentFiles.filter((f) =>
      documentTypes.includes(f.type)
    ).length;
    const currentArchivesCount = currentFiles.filter((f) =>
      archiveTypes.includes(f.type)
    ).length;

    if (
      imageTypes.includes(file.type) &&
      currentImagesCount >= config.limits.maxFilesPerType.images
    ) {
      return t("gallery.upload_zone.validation_errors.too_many_images", {
        count: config.limits.maxFilesPerType.images,
      });
    }
    if (
      documentTypes.includes(file.type) &&
      currentDocumentsCount >= config.limits.maxFilesPerType.documents
    ) {
      return t("gallery.upload_zone.validation_errors.too_many_documents", {
        count: config.limits.maxFilesPerType.documents,
      });
    }
    if (
      archiveTypes.includes(file.type) &&
      currentArchivesCount >= config.limits.maxFilesPerType.archives
    ) {
      return t("gallery.upload_zone.validation_errors.too_many_archives", {
        count: config.limits.maxFilesPerType.archives,
      });
    }

    return null;
  };

  const getFileIcon = (file: FileWithPreview) => {
    if (file.type.startsWith("image/")) return <Image className="w-4 h-4" />;
    if (
      file.type.includes("pdf") ||
      file.type.includes("word") ||
      file.type.includes("text")
    )
      return <FileText className="w-4 h-4" />;
    if (file.type.includes("zip") || file.type.includes("rar"))
      return <Archive className="w-4 h-4" />;
    return <Image className="w-4 h-4" />;
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const filesWithPreview = acceptedFiles.map((file) => {
        const error = validateFile(file);
        return Object.assign(file, {
          preview: error ? undefined : URL.createObjectURL(file),
          id: Math.random().toString(36).substring(7),
          error,
        });
      });

      // Afficher les messages d'erreur pour les fichiers non valides
      filesWithPreview.forEach((file) => {
        if (file.error) {
          toast.error(`${file.name}: ${file.error}`);
        }
      });

      setFilesToUpload((prev) => [...prev, ...filesWithPreview]);
      setIsDragging(false);
    },
    [config]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected(fileRejections, event) {
      for (const file of fileRejections) {
        toast.error(
          `${file.file.name}: ${t(
            fileRejectionMessages?.[
              file.errors[0]?.code as keyof typeof fileRejectionMessages
            ] || "gallery.upload_zone.rejection_messages.unknown_error"
          )}`
        );
      }
    },
    accept:
      Object.keys(acceptedFileTypes).length > 0 ? acceptedFileTypes : undefined,
    noClick: true,
    disabled: isLoading || Object.keys(acceptedFileTypes).length === 0,
  });

  const removeFile = (fileId: string) => {
    setFilesToUpload((files) => {
      const remainingFiles = files.filter((f) => f.id !== fileId);
      files
        .filter((f) => f.id === fileId)
        .forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
      return remainingFiles;
    });
  };

  const clearFiles = () => {
    filesToUpload.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
    setFilesToUpload([]);
  };

  const uploadFiles = async () => {
    const validFiles = filesToUpload.filter((file) => !file.error);
    if (validFiles.length === 0) {
      toast.error(t("gallery.upload_zone.no_valid_files"));
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const totalFiles = validFiles.length;
    let uploadedFiles = 0;
    const uploadedFileData: any[] = [];

    for (const file of validFiles) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("/api/gallery/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(
            data.error || `Erreur lors de l'upload de ${file.name}`
          );
        }

        const data = await response.json();
        uploadedFiles++;
        setUploadProgress((uploadedFiles / totalFiles) * 100);
        uploadedFileData.push(data);
        toast.success(`${file.name} uploadé avec succès`, {
          description: "Le fichier a été ajouté à votre galerie",
          action: {
            label: "Voir",
            onClick: () =>
              document
                .getElementById(data.id)
                ?.scrollIntoView({ behavior: "smooth" }),
          },
        });
      } catch (error: any) {
        console.error("Erreur d'upload:", error);
        toast.error(error.message || `Erreur lors de l'upload de ${file.name}`);
      }
    }

    // Émettre un événement personnalisé avec les données des fichiers uploadés
    const event = new CustomEvent("filesUploaded", {
      detail: { files: uploadedFileData },
    });
    window.dispatchEvent(event);

    setIsUploading(false);
    clearFiles();

    if (onFinishUpload) {
      onFinishUpload();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div {...getRootProps()} className="relative w-full h-full">
      <input {...getInputProps()} />

      {/* Le contenu de la galerie */}
      {children}

      {/* Bouton flottant pour sélectionner les fichiers */}
      <Button
        size="lg"
        className="fixed bottom-6 right-6 shadow-lg z-40"
        onClick={(e) => {
          e.stopPropagation();
          const input = document.createElement("input");
          input.type = "file";
          input.multiple = true;
          input.accept = Object.entries(acceptedFileTypes)
            .map(([type, exts]) => [
              ...(type === "image/*" ? [type] : []),
              ...exts,
            ])
            .join(",");
          input.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files) {
              onDrop(Array.from(files));
            }
          };
          input.click();
        }}
        disabled={Object.keys(acceptedFileTypes).length === 0}
      >
        <Upload className="w-4 h-4 mr-2" />
        {t("gallery.upload_zone.add_files")}
      </Button>

      {/* Overlay de drop */}
      {isDragActive && (
        <div className="fixed left-[--sidebar-width] top-[--header-height] right-0 bottom-0 bg-primary/10 backdrop-blur-sm flex items-center justify-center z-[999]">
          <div className="bg-background/95 p-8 rounded-lg shadow-lg text-center border-2 border-dashed border-primary -translate-x-[120px] -translate-y-[32px]">
            <Upload className="w-16 h-16 mx-auto mb-4 text-primary animate-bounce" />
            <h3 className="text-2xl font-semibold">
              {t("gallery.upload_zone.drop_files")}
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              {t("gallery.upload_zone.supported_formats", {
                formats: supportedFormatsMessage,
              })}
              <br />
              {t("gallery.upload_zone.max_size", {
                size: config.limits.maxFileSize,
              })}
            </p>
          </div>
        </div>
      )}

      {/* Liste des fichiers à uploader */}
      {filesToUpload.length > 0 && (
        <div className="fixed top-0 right-0 bottom-0 w-96 bg-background border-l shadow-lg z-50 flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {t("gallery.upload_zone.files_to_upload", {
                  valid: filesToUpload.filter((f) => !f.error).length,
                  total: filesToUpload.length,
                })}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearFiles}
                disabled={isUploading}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFiles}
                disabled={isUploading}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t("gallery.upload_zone.clear_all")}
              </Button>
              <Button
                size="sm"
                onClick={uploadFiles}
                disabled={
                  isUploading ||
                  filesToUpload.filter((f) => !f.error).length === 0
                }
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading
                  ? t("gallery.upload_zone.uploading")
                  : t("gallery.upload_zone.upload")}
              </Button>
            </div>
            {isUploading && (
              <Progress value={uploadProgress} className="w-full mt-4" />
            )}
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {filesToUpload.map((file) => (
                <div
                  key={file.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg border bg-muted/50 group relative",
                    file.error && "border-destructive/50 bg-destructive/10"
                  )}
                >
                  <div className="w-8 h-8 rounded-md border bg-background overflow-hidden flex-shrink-0">
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {file.error ? (
                          <AlertCircle className="w-4 h-4 text-destructive" />
                        ) : (
                          getFileIcon(file)
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-medium truncate max-w-[160px]">
                        {file.name}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        ({(file.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    </div>
                    {file.error && (
                      <p className="text-xs text-destructive truncate">
                        {file.error}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.id);
                    }}
                    className="flex-shrink-0 h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Bouton pour ajouter plus d'images */}
          <div className="p-4 border-t mt-auto">
            <Button
              variant="outline"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                const input = document.createElement("input");
                input.type = "file";
                input.multiple = true;
                input.accept = Object.entries(acceptedFileTypes)
                  .map(([type, exts]) => [
                    ...(type === "image/*" ? [type] : []),
                    ...exts,
                  ])
                  .join(",");
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files;
                  if (files) {
                    onDrop(Array.from(files));
                  }
                };
                input.click();
              }}
              disabled={
                isUploading || Object.keys(acceptedFileTypes).length === 0
              }
            >
              <Upload className="w-4 h-4 mr-2" />
              Ajouter plus de fichiers
            </Button>
          </div>
        </div>
      )}

      {/* Message si aucun type de fichier n'est autorisé */}
      {Object.keys(acceptedFileTypes).length === 0 && (
        <div className="fixed bottom-6 right-6 z-40">
          <Alert variant="destructive" className="w-96">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              L'upload de fichiers est actuellement désactivé. Veuillez activer
              au moins un type de fichier dans la configuration.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
};
