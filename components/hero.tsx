import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Hero() {
  return (
    <div className="w-full flex flex-col justify-center py-24 px-4 md:px-8 lg:px-16 bg-background text-foreground border-b border-border">
      <div className="max-w-7xl mx-auto w-full">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6 text-left max-w-2xl">
          Sistema de Postulaciones Multibien
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-10 text-left max-w-2xl">
          Plataforma centralizada para gestionar de manera eficiente los
          procesos de inscripción y evaluación de postulantes para programas de
          bienestar.
        </p>

        <Button
          asChild
          className="px-8 py-3 bg-accent text-accent-foreground rounded-md font-medium hover:bg-accent/90 transition-colors"
        >
          <Link href="/postulaciones/empresa">Ingresar al Sistema</Link>
        </Button>
      </div>
    </div>
  );
}
