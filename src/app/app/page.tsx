import { redirect } from "next/navigation";

// app.fruitionhr.com/ → the dashboard (RequireAuth bounces guests to /login).
export default function AppIndexPage() {
  redirect("/dashboard");
}
