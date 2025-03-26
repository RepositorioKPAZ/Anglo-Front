import Hero from "@/components/hero";
import Link from "next/link";
import Image from "next/image";
import multibienLogo from "@/lib/images/multibien-logo.webp";
import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default async function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-20">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>
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
        <div className="flex flex-col gap-20 max-w-5xl p-5">
          <Hero />
          <main className="flex-1 flex flex-col max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-24 space-y-32">
            {/* Features Section */}
            <section>
              <h2 className="text-3xl font-bold text-primary mb-16 relative after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-16 after:h-[2px] after:bg-primary after:-mb-4">
                Funcionalidades Principales
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="group">
                  <div className="h-12 w-12 border-2 border-muted-foreground rounded-full flex items-center justify-center mb-8 group-hover:border-primary transition-colors duration-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors duration-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-primary mb-3">
                    Gestión de Postulaciones
                  </h3>
                  <p className="text-muted-foreground">
                    Consulta, revisión y seguimiento de postulaciones para
                    trabajadores y empresas.
                  </p>
                </div>

                <div className="group">
                  <div className="h-12 w-12 border-2 border-muted-foreground rounded-full flex items-center justify-center mb-8 group-hover:border-primary transition-colors duration-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors duration-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-primary mb-3">
                    Carga de Información
                  </h3>
                  <p className="text-muted-foreground">
                    Soporte para carga masiva de postulaciones y adjuntar
                    documentos necesarios.
                  </p>
                </div>

                <div className="group">
                  <div className="h-12 w-12 border-2 border-muted-foreground rounded-full flex items-center justify-center mb-8 group-hover:border-primary transition-colors duration-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors duration-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-primary mb-3">
                    Seguimiento y Control
                  </h3>
                  <p className="text-muted-foreground">
                    Monitoreo en tiempo real del estado de las postulaciones en
                    una interfaz intuitiva.
                  </p>
                </div>
              </div>
            </section>

            {/* Benefits Section */}
            <section className="border border-border rounded-none p-12">
              <h2 className="text-3xl font-bold text-primary mb-12">
                Beneficios
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-6 w-6 border border-primary flex items-center justify-center">
                      <div className="h-3 w-3 bg-primary"></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-primary mb-2">
                      Proceso Optimizado
                    </h3>
                    <p className="text-muted-foreground">
                      Reducción de tiempos y esfuerzos en la gestión de
                      postulaciones.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-6 w-6 border border-primary flex items-center justify-center">
                      <div className="h-3 w-3 bg-primary"></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-primary mb-2">
                      Centralización de Datos
                    </h3>
                    <p className="text-muted-foreground">
                      Toda la información en un solo lugar para facilitar la
                      toma de decisiones.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-6 w-6 border border-primary flex items-center justify-center">
                      <div className="h-3 w-3 bg-primary"></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-primary mb-2">
                      Transparencia
                    </h3>
                    <p className="text-muted-foreground">
                      Mayor claridad en los procesos de selección y evaluación.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-6 w-6 border border-primary flex items-center justify-center">
                      <div className="h-3 w-3 bg-primary"></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-primary mb-2">
                      Experiencia Mejorada
                    </h3>
                    <p className="text-muted-foreground">
                      Interfaz intuitiva tanto para postulantes como para
                      evaluadores.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>Powered by KPaz</p>
          <ThemeSwitcher />
        </footer>{" "}
      </div>
    </main>
  );
}
