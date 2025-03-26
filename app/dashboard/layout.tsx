import { DashboardSidebar } from "@/components/dashboard-sidebar";
import HeaderAuth from "@/components/header-auth";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import multibienLogo from "@/lib/images/multibien-logo.webp";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <div className="flex flex-col w-full overflow-x-hidden">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-20 bg-background">
          <div className="w-full max-w-screen-2xl flex justify-between items-center p-3 px-8 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"} className="flex px-2 pt-2">
                <Image
                  src={multibienLogo}
                  alt="Multibien Logo"
                  width={90}
                  height={30}
                  priority
                />
              </Link>

              {/* <div className="flex items-center gap-2">
                      <DeployButton />
                      </div> */}
            </div>
            <HeaderAuth />
          </div>
        </nav>
        <div className="p-12 flex-1 overflow-x-auto">{children}</div>
      </div>
    </SidebarProvider>
  );
}
