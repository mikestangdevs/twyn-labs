import Image from "next/image"

export function NotYet() {
  return (
    <main className="flex-1 flex items-center justify-center px-6">
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center">
        {/* Logo */}
          <Image
            src="/logo.svg"
            alt="Twyn Logo"
            width={48}
            height={48}
            className="mb-4 dark:invert opacity-90"
          />

        {/* Message */}
          <h2 className="text-2xl font-semibold">
            You're on the waiting list
          </h2>
          <p className="text-muted-foreground">
            We'll send you an email as soon as you're off the waiting list and can access this feature.
          </p>

      </div>
    </main>
  );
} 