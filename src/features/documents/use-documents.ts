"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

export interface DocumentItem {
  id: number;
  title: string;
  document_type: string | null;
  file_name: string;
  file_size: number;
  mime_type: string;
  expires_at: string | null;
  uploaded_by?: string;
  created_at: string;
}

export interface DocumentOwner {
  ownerType: "employee";
  ownerId: number | string;
}

const keyFor = ({ ownerType, ownerId }: DocumentOwner) =>
  ["documents", ownerType, String(ownerId)] as const;

export function useDocuments(owner: DocumentOwner) {
  return useQuery({
    queryKey: keyFor(owner),
    queryFn: async () => {
      const { data } = await api.get<{ data: DocumentItem[] }>(
        "/api/v1/documents",
        { params: { owner_type: owner.ownerType, owner_id: owner.ownerId } },
      );
      return data.data;
    },
  });
}

export interface UploadDocumentInput {
  title: string;
  document_type?: string;
  expires_at?: string;
  file: File;
}

export function useUploadDocument(owner: DocumentOwner) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UploadDocumentInput) => {
      const form = new FormData();
      form.append("owner_type", owner.ownerType);
      form.append("owner_id", String(owner.ownerId));
      form.append("title", input.title);
      if (input.document_type) form.append("document_type", input.document_type);
      if (input.expires_at) form.append("expires_at", input.expires_at);
      form.append("file", input.file);

      const { data } = await api.post<{ data: DocumentItem }>(
        "/api/v1/documents",
        form,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keyFor(owner) }),
  });
}

export function useDeleteDocument(owner: DocumentOwner) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: number) => {
      await api.delete(`/api/v1/documents/${documentId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keyFor(owner) }),
  });
}

/** Same-origin download URL — session cookie rides along automatically. */
export function documentDownloadUrl(documentId: number): string {
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  return `${base}/api/v1/documents/${documentId}/download`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
