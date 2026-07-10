"use client";

import { Download, FileText, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Can } from "@/components/can";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { apiErrorMessage } from "@/lib/api";
import {
  documentDownloadUrl,
  formatFileSize,
  useDeleteDocument,
  useDocuments,
  useUploadDocument,
  type DocumentOwner,
} from "@/features/documents/use-documents";

/**
 * Generic document list + upload for any owner record (employees now,
 * payroll runs etc. later). Write actions are permission-gated by the
 * caller via managePermission.
 */
export function DocumentsPanel({
  owner,
  managePermission,
}: {
  owner: DocumentOwner;
  managePermission: string;
}) {
  const { data: documents, isLoading } = useDocuments(owner);
  const upload = useUploadDocument(owner);
  const remove = useDeleteDocument(owner);

  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const onUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Choose a file to upload.");
      return;
    }

    try {
      await upload.mutateAsync({ title: title || file.name, file });
      toast.success("Document uploaded.");
      setTitle("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <div className="space-y-5">
      <Can permission={managePermission}>
        <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/40 p-4">
          <div className="grid min-w-48 flex-1 gap-2">
            <Label htmlFor="doc-title">Title</Label>
            <Input
              id="doc-title"
              placeholder="e.g. Employment contract"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid min-w-56 flex-1 gap-2">
            <Label htmlFor="doc-file">File (PDF, image, Office — max 10 MB)</Label>
            <Input id="doc-file" type="file" ref={fileRef} accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx" />
          </div>
          <Button type="button" onClick={onUpload} disabled={upload.isPending}>
            <Upload className="size-4" />
            {upload.isPending ? "Uploading…" : "Upload"}
          </Button>
        </div>
      </Can>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : !documents?.length ? (
        <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-fruition-50 text-fruition-700">
                  <FileText className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{doc.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {doc.file_name} · {formatFileSize(doc.file_size)}
                    {doc.uploaded_by ? ` · by ${doc.uploaded_by}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Download ${doc.title}`}
                  render={<a href={documentDownloadUrl(doc.id)} download />}
                >
                  <Download className="size-4" />
                </Button>
                <Can permission={managePermission}>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${doc.title}`}
                    onClick={() => setDeleteTarget(doc.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </Can>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete document?"
        description="The document will be removed from the record."
        confirmLabel="Delete"
        isPending={remove.isPending}
        onConfirm={async () => {
          if (deleteTarget === null) return;
          try {
            await remove.mutateAsync(deleteTarget);
            toast.success("Document deleted.");
          } catch (error) {
            toast.error(apiErrorMessage(error));
          } finally {
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
