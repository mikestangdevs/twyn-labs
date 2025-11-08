export default function Loading() {
  return (
    <div className="fixed top-0 left-0 right-0 h-0.5 bg-muted-foreground/50 z-50">
      <div className="h-full bg-muted-foreground animate-[loading_1s_ease-in-out_infinite]" />
    </div>
  );
} 