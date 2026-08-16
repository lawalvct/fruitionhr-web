"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { api, ensureCsrf } from "@/lib/api";
import type { BlogPost, BlogPostInput, BlogPostListQuery } from "./blog-types";
import type { PaginatedResponse } from "./types";

const ADMIN_API = "/api/admin/v1";

interface ResourceResponse<TData> {
  data: TData;
}

export const blogKeys = {
  all: ["admin", "blog-posts"] as const,
  list: (query: BlogPostListQuery) => ["admin", "blog-posts", "list", query] as const,
  detail: (id: number | string) => ["admin", "blog-posts", String(id)] as const,
};

export function useBlogPosts(query: BlogPostListQuery) {
  return useQuery({
    queryKey: blogKeys.list(query),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<BlogPost>>(`${ADMIN_API}/blog-posts`, {
        params: {
          page: query.page,
          search: query.search || undefined,
          status: query.status || undefined,
          sort: query.sort || undefined,
        },
      });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useBlogPost(id: number | string | null) {
  return useQuery({
    queryKey: blogKeys.detail(id ?? "new"),
    enabled: id !== null,
    queryFn: async () => {
      const { data } = await api.get<ResourceResponse<BlogPost>>(`${ADMIN_API}/blog-posts/${id}`);
      return data.data;
    },
  });
}

export function useCreateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BlogPostInput) => {
      await ensureCsrf();
      const { data } = await api.post<ResourceResponse<BlogPost>>(`${ADMIN_API}/blog-posts`, input);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin", "activity"] });
    },
  });
}

export function useUpdateBlogPost(id: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Partial<BlogPostInput>) => {
      await ensureCsrf();
      const { data } = await api.put<ResourceResponse<BlogPost>>(
        `${ADMIN_API}/blog-posts/${id}`,
        input,
      );
      return data.data;
    },
    onSuccess: (post) => {
      queryClient.setQueryData(blogKeys.detail(id), post);
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin", "activity"] });
    },
  });
}

export function useDeleteBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number | string) => {
      await ensureCsrf();
      await api.delete(`${ADMIN_API}/blog-posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin", "activity"] });
    },
  });
}

export interface UploadedImage {
  path: string;
  url: string;
}

/** Uploads a cover image and returns its stored path plus a public URL. */
export function useUploadBlogImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      await ensureCsrf();
      const body = new FormData();
      body.append("file", file);

      const { data } = await api.post<ResourceResponse<UploadedImage>>(
        `${ADMIN_API}/blog-posts/media`,
        body,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return data.data;
    },
  });
}

/** Discards an upload that was never attached to a saved post. */
export function useDeleteBlogImage() {
  return useMutation({
    mutationFn: async (path: string) => {
      await ensureCsrf();
      await api.delete(`${ADMIN_API}/blog-posts/media`, { data: { path } });
    },
  });
}
