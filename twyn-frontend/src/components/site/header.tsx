import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"

interface HeaderProps {
  showAuth?: boolean;
  className?: string;
}

export function Header({ showAuth = true, className }: HeaderProps) {
  return (
    <header className={`fixed top-0 left-0 right-0 z-50 mt-4 mx-auto ${className || ''}`}>
      <div className="w-full flex justify-between items-center backdrop-blur-2xl rounded-full p-2">
        <div className="flex items-center">
          <Link href="/" className="flex items-center cursor-pointer">
            <Image
              src="/logo.svg"
              alt="Twyn Logo"
              width={30}
              height={30}
              className="mr-2 dark:invert opacity-90"
            />
            <Image
              src="/logo_text.svg"
              alt="Twyn Logo"
              width={48}
              height={48}
              className="mt-1 dark:invert opacity-90"
            />
          </Link>
        </div>
          
        <div className="flex items-center gap-3 h-8">
          {showAuth && (
            <Link href="/sim">
              <Button 
                variant="outline" 
                className="rounded-full font-bold cursor-pointer"
              >
                Login/Signup
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
