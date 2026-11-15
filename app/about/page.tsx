import type { Metadata } from "next";
import { AboutView } from "../_components/about/about-view";

// El layout añade el sufijo: "Acerca de · Arcade Vault".
export const metadata: Metadata = { title: "Acerca de" };

export default function AboutPage() {
  return <AboutView />;
}
