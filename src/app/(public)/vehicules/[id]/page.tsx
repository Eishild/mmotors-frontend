export default async function VehiculePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-2xl font-bold">Fiche véhicule</h1>
      <p className="mt-2 text-foreground/70">Véhicule #{id}</p>
    </main>
  );
}
