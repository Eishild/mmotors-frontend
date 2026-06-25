/** État de chargement : grille de cartes fantômes pendant le fetch. */
export default function CatalogueSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-foreground/10"
        >
          <div className="aspect-[4/3] animate-pulse bg-foreground/10" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-foreground/10" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-foreground/10" />
            <div className="h-5 w-1/3 animate-pulse rounded bg-foreground/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
