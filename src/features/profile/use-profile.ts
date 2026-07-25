"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { ME_QUERY_KEY } from "@/features/auth/use-auth";
import { api, ensureCsrf } from "@/lib/api";
import type { Me } from "@/types/auth";

export interface UpdateProfileInput {
  name: string;
  email: string;
  phone?: string | null;
  timezone?: string | null;
  bio?: string | null;
}

export interface UpdatePasswordInput {
  current_password: string;
  password: string;
  password_confirmation: string;
}

const AVATAR_KEY = ["profile", "avatar"] as const;

/** Update the signed-in user's details. Returns the refreshed `Me`. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      await ensureCsrf();
      const { data } = await api.put<{ data: Me }>("/api/v1/profile", input);
      return data.data;
    },
    onSuccess: (me) => queryClient.setQueryData(ME_QUERY_KEY, me),
  });
}

/** Change the signed-in user's password (requires the current password). */
export function useUpdatePassword() {
  return useMutation({
    mutationFn: async (input: UpdatePasswordInput) => {
      await ensureCsrf();
      await api.put("/api/v1/profile/password", input);
    },
  });
}

/** Upload a new avatar image (JPG/PNG/WebP, ≤5 MB). */
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      await ensureCsrf();
      const form = new FormData();
      form.append("avatar", file);
      const { data } = await api.post<{ data: Me }>("/api/v1/profile/avatar", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data;
    },
    onSuccess: (me) => {
      queryClient.setQueryData(ME_QUERY_KEY, me);
      // avatar_url is a stable path, so force the cached image to refetch.
      queryClient.invalidateQueries({ queryKey: AVATAR_KEY });
    },
  });
}

/** Remove the current avatar. */
export function useDeleteAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await ensureCsrf();
      const { data } = await api.delete<{ data: Me }>("/api/v1/profile/avatar");
      return data.data;
    },
    onSuccess: (me) => {
      queryClient.setQueryData(ME_QUERY_KEY, me);
      queryClient.invalidateQueries({ queryKey: AVATAR_KEY });
    },
  });
}

/**
 * Fetch the avatar image (authenticated endpoint) as an object URL suitable
 * for <img src>. Returns null while loading or when there is no avatar.
 */
export function useAvatarImage(avatarUrl: string | null | undefined): string | null {
  const { data: blob } = useQuery({
    queryKey: [...AVATAR_KEY, avatarUrl],
    enabled: Boolean(avatarUrl),
    queryFn: async () => (await api.get<Blob>(avatarUrl!, { responseType: "blob" })).data,
    staleTime: 5 * 60 * 1000,
  });

  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(blob);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  return objectUrl;
}
