"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function StoreBottomNav() {
  const pathname = usePathname();

  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `flex flex-col items-center justify-center w-full h-full space-y-1 ${
      isActive ? "text-[#FF3888]" : "text-gray-400 hover:text-gray-200"
    }`;
  };

  return (
    <div className="fixed bottom-0 left-0 md:left-64 right-0 h-16 bg-[#111827] border-t border-gray-800 flex items-center justify-around z-40 pb-safe">
      <Link href="/admin/tienda" className={getLinkClass("/admin/tienda")}>
        <i className="fas fa-tshirt text-xl"></i>
        <span className="text-[10px] font-bold uppercase tracking-wide">Productos</span>
      </Link>
      
      <div className="w-px h-8 bg-gray-800"></div>

      <Link href="/admin/tienda/ventas" className={getLinkClass("/admin/tienda/ventas")}>
        <i className="fas fa-cash-register text-xl"></i>
        <span className="text-[10px] font-bold uppercase tracking-wide">Registrar Venta</span>
      </Link>
    </div>
  );
}