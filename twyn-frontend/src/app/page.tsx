'use client'

import { Button } from '@/components/ui/button'
import { Footer } from '@/components/site/footer'
import Link from 'next/link'
import { Header } from '@/components/site/header'
import { useState, useEffect } from 'react'
import { Target } from 'lucide-react'

const OneTimeTypingEffect = () => {
  const fullText = 'Real people.|Simulated at Scale.'
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
        const char = fullText[currentIndex]
        setDisplayText(prev => prev + (char === '|' ? '\n' : char))
        setCurrentIndex(currentIndex + 1)
      }, 100)
      return () => clearTimeout(timeout)
    } else {
      setIsComplete(true)
    }
  }, [currentIndex, fullText])

  const lines = displayText.split('\n')
  const isOnSecondLine = displayText.includes('\n')

  return (
    <>
      <span className="font-bold text-primary font-['Lora']">
        {lines[0]}
        {!isComplete && !isOnSecondLine && <span className="animate-pulse text-primary">|</span>}
      </span>
      <br />
      <span className="font-bold text-primary font-['Lora']">
        {lines[1] || ''}
        {!isComplete && isOnSecondLine && <span className="animate-pulse text-primary">|</span>}
      </span>
      <br />
    </>
  )
}

const TypingEffect = () => {
  const words = ['Everyone', 'Policy Makers', 'Consultants', 'Researchers', 'Educators', 'Students']
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentText, setCurrentText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const currentWord = words[currentWordIndex]
    
    const timeout = setTimeout(() => {
      if (isPaused) {
        setIsPaused(false)
        setIsDeleting(true)
        return
      }

      if (isDeleting) {
        setCurrentText(currentWord.substring(0, currentText.length - 1))
        
        if (currentText === '') {
          setIsDeleting(false)
          setCurrentWordIndex((prev) => (prev + 1) % words.length)
        }
      } else {
        setCurrentText(currentWord.substring(0, currentText.length + 1))
        
        if (currentText === currentWord) {
          setIsPaused(true)
        }
      }
    }, isPaused ? 2000 : isDeleting ? 50 : 100)

    return () => clearTimeout(timeout)
  }, [currentText, isDeleting, isPaused, currentWordIndex, words])

  return (
    <span className="font-bold">
      for <span className="font-black text-primary font-['Lora']">{currentText}</span>
      <span className="animate-pulse text-primary">|</span>
    </span>
  )
}

export default function Home() {
  return (
    <div className="h-screen overflow-y-auto">
      <div className="flex flex-col px-4 sm:px-6 md:px-8 max-w-5xl mx-auto h-screen">

        <Header className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8"/>

        <main className="flex-1 flex justify-center py-8">
          <section className="flex flex-col text-center justify-center items-center h-full">
            {/* Eyebrow */}
            <div className="mb-4 sm:mb-6">
              <Button variant="outline" size="sm" className="rounded-full text-muted-foreground border-border bg-muted/50 hover:bg-muted/50 text-xs sm:text-sm px-3 py-2 sm:px-4">
                <Target size={14} className="mr-1.5 sm:mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">Built for strategists, researchers, product leaders, and curious minds</span>
                <span className="sm:hidden">Built for curious minds</span>
              </Button>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-4 sm:mb-6 md:mb-8 leading-[1.2] sm:leading-[1.3] px-4">
              <OneTimeTypingEffect />
              {/* <TypingEffect />{' '} */}
            </h1>

            <p className="text-lg sm:text-xl font-medium mb-8 sm:mb-10 max-w-xs sm:max-w-md md:max-w-2xl px-4">
            The world doesn't run on data. It runs on decisions.
            </p>

            <Link href="/sim">
              <Button 
                variant="default" 
                className="font-bold cursor-pointer rounded-full text-sm sm:text-md px-6 py-3 sm:px-8 sm:py-4"
                style={{
                  boxShadow: `
                    0 0 4px white,
                    0 0 8px white,
                    0 0 3px var(--primary),
                    0 0 4px var(--primary),
                    0 0 15px var(--primary),
                    0 0 20px var(--primary),
                    0 0 25px var(--primary)
                  `
                }}
              >
                Get early access
              </Button>
            </Link>
            
          </section>


        </main>

        <Footer />
      </div>
    </div>
  )
}
