import type { Metadata } from "next";
import { AuthForm } from "@/modules/auth";

export const metadata: Metadata = { title: "Acceso" };

export default function AuthPage() {
  return <AuthForm />;
}
