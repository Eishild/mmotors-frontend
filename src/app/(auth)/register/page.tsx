import { Suspense } from "react";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex max-w-sm flex-col gap-6 p-8">
      <h1 className="text-2xl font-bold">Inscription</h1>
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </main>
  );
}
