export default function Loading() {
  return (
    <div className="space-y-6 pb-32 animate-pulse">
      <div className="h-8 bg-zinc-900 rounded-lg w-48" />
      <div className="h-16 bg-zinc-900 rounded-2xl" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-zinc-900 rounded-xl" />
        ))}
      </div>
    </div>
  )
}