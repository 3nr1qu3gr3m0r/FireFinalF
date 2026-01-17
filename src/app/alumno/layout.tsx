import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi Panel", // Se verá como: "Mi Panel | Fire Inside"
};

export default function AlumnoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}