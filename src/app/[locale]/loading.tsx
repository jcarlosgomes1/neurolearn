export default function Loading() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 bg-brand-500 rounded-full animate-bounce" />
        <div className="h-2 w-2 bg-brand-500 rounded-full animate-bounce [animation-delay:0.15s]" />
        <div className="h-2 w-2 bg-brand-500 rounded-full animate-bounce [animation-delay:0.3s]" />
      </div>
    </div>
  );
}
