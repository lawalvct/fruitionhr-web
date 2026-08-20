import { Suspense } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageLoader } from "@/components/page-loader";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";

export const metadata = { title: "Reset password" };

export default function AdminResetPasswordPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Set a new password</CardTitle>
          <CardDescription>Platform administration</CardDescription>
        </CardHeader>
        <CardContent>
          {/* useSearchParams needs a Suspense boundary to stay statically rendered. */}
          <Suspense fallback={<PageLoader label="Checking your link…" />}>
            <ResetPasswordForm />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
