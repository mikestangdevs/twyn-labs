import Link from "next/link"
import { Button } from "@/components/ui/button"


export default function NotFound() {
  return (
    <div className="max-w-4xl mx-auto my-5 px-4 sm:px-6 lg:px-8">
      
      <div className="flex flex-col items-center flex-grow justify-center min-h-[70vh]">
        <h1 className="text-6xl font-bold mb-2 text-gray-900">404</h1>
        <p className="text-xl mb-8 text-gray-900">Page not found</p>
        
        <Button asChild>
          <Link href="/">Go back home</Link>
        </Button>
      </div>
      
    </div>
  )
}
