"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, MailWarning, Trash2 } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useMe } from "@/features/auth/use-auth";
import {
  useAvatarImage,
  useDeleteAvatar,
  useUpdatePassword,
  useUpdateProfile,
  useUploadAvatar,
} from "@/features/profile/use-profile";
import { mapLaravelErrorsToForm } from "@/lib/forms";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fieldClass =
  "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30";

// IANA timezone list from the platform, with a graceful fallback.
const TIMEZONES: string[] =
  typeof Intl !== "undefined" && "supportedValuesOf" in Intl
    ? (Intl as unknown as { supportedValuesOf: (key: string) => string[] }).supportedValuesOf(
        "timeZone",
      )
    : [];

function initialsOf(name: string | undefined) {
  return (name ?? "?")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/* ── Avatar ──────────────────────────────────────────────────────────────── */

function AvatarCard() {
  const { data: me } = useMe();
  const avatarSrc = useAvatarImage(me?.avatar_url);
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();

  function onFile(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5 MB or smaller.");
      return;
    }
    uploadAvatar.mutate(file, {
      onSuccess: () => toast.success("Photo updated"),
      onError: () => toast.error("Could not upload the photo. Please try again."),
    });
  }

  const busy = uploadAvatar.isPending || deleteAvatar.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile photo</CardTitle>
        <CardDescription>Shown across FruitionHR. JPG, PNG, or WebP up to 5 MB.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-5">
          <Avatar className="size-20 ring-1 ring-border">
            {avatarSrc && <AvatarImage src={avatarSrc} alt={me?.name ?? "Avatar"} />}
            <AvatarFallback className="bg-fruition-100 text-lg font-semibold text-fruition-800">
              {initialsOf(me?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-wrap gap-2">
            <label
              className={cn(
                buttonVariants({ variant: "outline" }),
                "cursor-pointer",
                busy && "pointer-events-none opacity-50",
              )}
            >
              <ImagePlus className="size-4" />
              {me?.avatar_url ? "Change photo" : "Upload photo"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={busy}
                onChange={(event) => {
                  onFile(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </label>
            {me?.avatar_url && (
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() =>
                  deleteAvatar.mutate(undefined, {
                    onSuccess: () => toast.success("Photo removed"),
                  })
                }
              >
                <Trash2 className="size-4" /> Remove
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Profile details (name, email, phone, timezone, bio) ─────────────────── */

const profileSchema = z.object({
  name: z.string().min(2, "Your full name is required"),
  email: z.email("Enter a valid email address"),
  phone: z.string().max(40, "Too long").optional(),
  timezone: z.string().optional(),
  bio: z.string().max(500, "Keep your bio under 500 characters").optional(),
});
type ProfileValues = z.infer<typeof profileSchema>;
const profileFields = ["name", "email", "phone", "timezone", "bio"] as const;

function ProfileDetailsCard() {
  const { data: me } = useMe();
  const updateProfile = useUpdateProfile();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    // Re-syncs once `me` resolves and after a successful save.
    values: {
      name: me?.name ?? "",
      email: me?.email ?? "",
      phone: me?.phone ?? "",
      timezone: me?.timezone ?? "Africa/Lagos",
      bio: me?.bio ?? "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const updated = await updateProfile.mutateAsync(values);
      toast.success("Profile updated", {
        description: updated.is_email_verified
          ? undefined
          : "We sent a verification code to your new email address.",
      });
    } catch (error) {
      mapLaravelErrorsToForm(error, setError, profileFields);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile details</CardTitle>
        <CardDescription>Your name, contact details, and how you appear.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid max-w-lg gap-4">
          {errors.root && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errors.root.message}
            </p>
          )}
          <div className="grid gap-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" autoComplete="name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            <p className="text-xs text-muted-foreground">
              Changing your email requires re-verifying the new address.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+234 801 234 5678"
              {...register("phone")}
            />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="timezone">Timezone</Label>
            <select id="timezone" className={cn(fieldClass, "h-8")} {...register("timezone")}>
              <option value="">Not set</option>
              {TIMEZONES.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
            {errors.timezone && (
              <p className="text-sm text-destructive">{errors.timezone.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              rows={3}
              className={fieldClass}
              placeholder="A short line about you (optional)."
              {...register("bio")}
            />
            {errors.bio && <p className="text-sm text-destructive">{errors.bio.message}</p>}
          </div>
          <div>
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/* ── Password ────────────────────────────────────────────────────────────── */

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Enter your current password"),
    password: z.string().min(8, "At least 8 characters"),
    password_confirmation: z.string(),
  })
  .refine((v) => v.password === v.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });
type PasswordValues = z.infer<typeof passwordSchema>;
const passwordFields = ["current_password", "password", "password_confirmation"] as const;

function PasswordCard() {
  const updatePassword = useUpdatePassword();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updatePassword.mutateAsync(values);
      toast.success("Password updated");
      reset({ current_password: "", password: "", password_confirmation: "" });
    } catch (error) {
      mapLaravelErrorsToForm(error, setError, passwordFields);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>
          Choose a strong password you don&apos;t use anywhere else.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid max-w-lg gap-4">
          {errors.root && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errors.root.message}
            </p>
          )}
          <div className="grid gap-2">
            <Label htmlFor="current_password">Current password</Label>
            <Input
              id="current_password"
              type="password"
              autoComplete="current-password"
              {...register("current_password")}
            />
            {errors.current_password && (
              <p className="text-sm text-destructive">{errors.current_password.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password_confirmation">Confirm new password</Label>
            <Input
              id="password_confirmation"
              type="password"
              autoComplete="new-password"
              {...register("password_confirmation")}
            />
            {errors.password_confirmation && (
              <p className="text-sm text-destructive">{errors.password_confirmation.message}</p>
            )}
          </div>
          <div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating…" : "Update password"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export function ProfilePage() {
  const { data: me } = useMe();

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Your profile"
        description="Manage your personal account details and password."
      />

      {me && !me.is_email_verified && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <MailWarning className="size-4 shrink-0" />
          <span>Your email address isn&apos;t verified yet.</span>
          <Link href="/verify-email" className="font-medium underline underline-offset-2">
            Verify now
          </Link>
        </div>
      )}

      <AvatarCard />
      <ProfileDetailsCard />
      <PasswordCard />
    </div>
  );
}
