"use client";

import { ImageUp, Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { apiErrorMessage } from "@/lib/api";
import { useUploadBlogImage } from "./use-blog";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Cover image picker. Uploads straight to the API and hands back the stored
 * path plus a preview URL — the parent form only persists them on save.
 */
export function CoverImageField({
  previewUrl,
  onUploaded,
  onCleared,
}: {
  previewUrl: string | null;
  onUploaded: (uploaded: { path: string; url: string }) => void;
  onCleared: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadBlogImage();
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    if (!ACCEPT.split(",").includes(file.type)) {
      toast.error("Choose a JPG, PNG, WebP or GIF image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("That image is larger than 5MB.");
      return;
    }

    try {
      onUploaded(await upload.mutateAsync(file));
      toast.success("Cover image uploaded.");
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      // Allow re-picking the same file after a failure.
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  if (previewUrl) {
    return (
      <div className="space-y-2">
        <div className="overflow-hidden rounded-xl border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Cover preview" className="aspect-[16/9] w-full object-cover" />
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={upload.isPending}
            onClick={() => inputRef.current?.click()}
          >
            <ImageUp className="size-3.5" /> Replace
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            disabled={upload.isPending}
            onClick={onCleared}
          >
            <Trash2 className="size-3.5" /> Remove
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void handleFile(event.dataTransfer.files?.[0]);
        }}
        className={[
          "grid w-full place-items-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition",
          dragging
            ? "border-fruition-400 bg-fruition-50/60"
            : "border-slate-200 bg-slate-50/60 hover:border-fruition-300 hover:bg-fruition-50/40",
        ].join(" ")}
      >
        {upload.isPending ? (
          <span className="flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="size-4 animate-spin" /> Uploading…
          </span>
        ) : (
          <span>
            <ImageUp className="mx-auto size-6 text-slate-400" />
            <span className="mt-2 block text-sm font-medium text-slate-700">
              Upload a cover image
            </span>
            <span className="mt-0.5 block text-xs text-slate-500">
              Drag and drop, or click to browse — JPG, PNG, WebP or GIF up to 5MB
            </span>
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
    </div>
  );
}
