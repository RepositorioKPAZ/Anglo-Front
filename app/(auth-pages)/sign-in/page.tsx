import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
import multibienLogo from "@/lib/images/multibien-logo.webp";

import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  return (
    <form className="flex-1 flex flex-col min-w-64">
      <div className="flex justify-start mb-8">
        <Link href={"/"}>
          <Image
            src={multibienLogo}
            alt="Multibien Logo"
            width={90}
            height={30}
            priority
          />
        </Link>
      </div>
      <h1 className="text-2xl font-medium">Ingresar</h1>
      <p className="text-sm text-foreground">
        No tienes una cuenta?{" "}
        <Link className="text-foreground font-medium underline" href="/sign-up">
          Registrarse
        </Link>
      </p>
      <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
        <Label htmlFor="email">Email</Label>
        <Input name="email" placeholder="tu@email.com" required />
        {/* <div className="flex justify-between items-center">
          <Label htmlFor="password">Contraseña</Label>
          <Link
            className="text-xs text-foreground underline"
            href="/forgot-password"
          >
            Olvidaste tu contraseña?
          </Link>
        </div> */}
        <Input
          type="password"
          name="password"
          placeholder="Tu contraseña"
          required
        />
        <SubmitButton
          pendingText="Ingresando..."
          formAction={signInAction}
          className="bg-accent text-accent-foreground"
        >
          Ingresar
        </SubmitButton>
        <FormMessage message={searchParams} />
      </div>
    </form>
  );
}
