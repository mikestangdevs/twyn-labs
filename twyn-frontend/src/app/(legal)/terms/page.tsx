import path from 'path'
import Legal from "@/components/site/legal"

export default function TermsOfService() {
  const termsOfServicePath = path.join(process.cwd(), 'src/app/(legal)/terms/terms-of-service.md')

  return (
    <Legal path={termsOfServicePath} />
  )
}
