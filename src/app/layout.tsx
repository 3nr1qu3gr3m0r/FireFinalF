import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/context/SidebarContext";

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins"
});

// 1. Configuración del Viewport (Para móviles)
// Define cómo se comporta la pantalla en celulares (sin zoom, colores de tema, etc.)
export const viewport: Viewport = {
  themeColor: "#000000", // Color de la barra de estado en Android
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Sensación de App nativa (bloquea zoom pellizcando)
};

// 2. Metadatos Globales + PWA
export const metadata: Metadata = {
  title: "Fire Inside",
  description: "Sistema de Gestión",
  manifest: "/manifest.json", // Vincula el archivo de identidad PWA
  icons: {
    icon: "/icon-192.png", // Icono estándar
    apple: "/icon-512.png", // Icono para iPhone/iPad
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        {/* Font Awesome se mantiene aquí como lo tenías */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" />
      </head>
      
      <body className={`${poppins.variable} font-poppins bg-[#0A1D37] text-white h-screen overflow-hidden`}>
        
        {/* Provider envuelve toda la app */}
        <SidebarProvider>
           {children}
        </SidebarProvider>

      </body>
    </html>
  );
}