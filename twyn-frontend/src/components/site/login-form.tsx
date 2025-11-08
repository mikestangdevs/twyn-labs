"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signInWithGoogle, signInWithMagicLink } from "@/app/login/actions"
import Image from "next/image"
import Link from "next/link"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [magicLinkStatus, setMagicLinkStatus] = useState<{
    success?: boolean;
    error?: string;
  }>({})

  const handleGoogleSignIn = () => {
    setLoading(true)
    // Let the server action handle the redirect
    signInWithGoogle()
  }

  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMagicLinkStatus({})

    const result = await signInWithMagicLink(email)
    
    if (result.error) {
      setMagicLinkStatus({ error: result.error })
    } else {
      setMagicLinkStatus({ success: true })
    }
    
    setLoading(false)
  }

  const handleRetry = () => {
    setMagicLinkStatus({})
  }
  
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2 min-h-[500px]">
          <form onSubmit={handleMagicLinkSignIn} className="p-6 md:p-8 flex flex-col justify-center">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <Link href="/">
                  <Image 
                    src="/logo.svg" 
                    alt="Twyn Logo" 
                    width={30} 
                    height={30} 
                    className="mb-4 w-12 h-12 dark:invert opacity-90"
                  />
                </Link>
                <h1 className="text-2xl font-bold">Welcome to Twyn</h1>
                <p className="text-muted-foreground text-balance">
                  Login or signup to get started
                </p>
              </div>

              {magicLinkStatus.success ? (
                <div className="border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50 rounded-lg p-4 space-y-4 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                        Email sent successfully!
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        We've sent a magic link to <span className="font-medium">{email}</span>. 
                        Check your inbox and click the link to sign in.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRetry}
                      className="text-green-700 border-green-300 hover:bg-green-100 dark:text-green-300 dark:border-green-700 dark:hover:bg-green-950"
                    >
                      Send another link
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid gap-3">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  {magicLinkStatus.error && (
                    <div className="border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-red-800 dark:text-red-200">{magicLinkStatus.error}</p>
                      </div>
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Sending..." : "Send Magic Link"}
                  </Button>
                </>
              )}

              {!magicLinkStatus.success && (
                <>
                  <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                    <span className="bg-card text-muted-foreground relative z-10 px-2">
                      Or continue with
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <Button 
                      variant="outline" 
                      type="button" 
                      className="w-full cursor-pointer" 
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path
                          d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                          fill="currentColor"
                        />
                      </svg>
                      <span className="text-sm">Login with Google</span>
                    </Button>
                  </div>
                </>
              )}
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img
              src="/login_image.png"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="/terms">Terms of Service</a>{" "}
        and <a href="/privacy">Privacy Policy</a>.
      </div>
    </div>
  )
}