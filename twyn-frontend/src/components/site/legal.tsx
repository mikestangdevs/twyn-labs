import fs from 'fs'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import styles from '@/styles/markdown.module.css'
import { Footer } from "@/components/site/footer"
import { Header } from "@/components/site/header"

export default function Legal({ path }: { path: string }) {
  const fileContent = fs.readFileSync(path, 'utf8')

  return (
    <div className="overflow-y-auto h-screen">
      <div className="flex flex-col px-8 max-w-5xl mx-auto h-screen">

        <Header showAuth={false} className="max-w-5xl mx-auto px-8"/>
        
        <div className={`${styles.markdownContent} mt-18 mb-10 px-10`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {fileContent}
          </ReactMarkdown>
        </div>

        <Footer />

      </div>
    </div>
  )
}
