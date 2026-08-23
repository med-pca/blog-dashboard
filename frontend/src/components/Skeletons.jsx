// Veri yüklenirken gerçek sayfa layoutunu taklit eden iskelet (skeleton)
// bileşenleri. Tam ekran spinner yerine kullanılır ki içerik geldiğinde
// sayfa "zıplamasın" — boyutlar gerçek kart/satır boyutlarıyla eşleşir.

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}

export function BlogSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
          <Skeleton className="h-48 w-full rounded-none" />
          <div className="p-5 flex flex-col gap-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ProjelerimizSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
          <Skeleton className="h-56 w-full rounded-none" />
          <div className="p-5 flex flex-col gap-3 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <div className="flex items-center justify-between pt-3 mt-auto border-t border-gray-100">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-14" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function SSSSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border border-gray-100 rounded-2xl bg-white px-6 py-5 flex items-center gap-4">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-4 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  )
}

export function BlogDetaySkeleton() {
  return (
    <article className="max-w-3xl mx-auto px-6 py-16">
      <Skeleton className="w-full h-80 rounded-2xl mb-10" />
      <Skeleton className="h-3 w-32 mb-6" />
      <Skeleton className="h-8 w-full mb-2" />
      <Skeleton className="h-8 w-2/3 mb-8" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </article>
  )
}

export function ProjeDetaySkeleton() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-start">
        <div>
          <Skeleton className="w-full aspect-4/3 rounded-2xl mb-3" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="flex-1 aspect-square rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-8">
          <div>
            <Skeleton className="h-5 w-40 mb-3" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
          <div>
            <Skeleton className="h-5 w-48 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-5/6" />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-12 w-56 rounded-xl" />
        </div>
      </div>
    </section>
  )
}
