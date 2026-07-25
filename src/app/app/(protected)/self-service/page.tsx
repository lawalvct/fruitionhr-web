import { redirect } from "next/navigation";

// /self-service now lives as separate sidebar pages; send bare visits to Profile.
export default function SelfServiceIndexRoute() {
  redirect("/self-service/profile");
}
