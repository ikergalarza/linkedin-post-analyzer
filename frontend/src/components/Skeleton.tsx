export function SkeletonCard() {
  return (
    <div className="bg-bg-card rounded-xl p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-bg-hover" />
        <div className="flex-1">
          <div className="h-4 bg-bg-hover rounded w-1/3 mb-2" />
          <div className="h-3 bg-bg-hover rounded w-2/3" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="h-8 bg-bg-hover rounded" />
        <div className="h-8 bg-bg-hover rounded" />
        <div className="h-8 bg-bg-hover rounded" />
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-bg-card rounded-xl p-6 animate-pulse">
      <div className="h-5 bg-bg-hover rounded w-1/4 mb-4" />
      <div className="h-64 bg-bg-hover rounded" />
    </div>
  );
}
