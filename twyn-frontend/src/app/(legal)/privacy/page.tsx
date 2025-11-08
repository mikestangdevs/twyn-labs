import path from 'path'
import Legal from "@/components/site/legal"

export default function PrivacyPolicy() {
  const privacyPolicyPath = path.join(process.cwd(), 'src/app/(legal)/privacy/privacy-policy.md')

  return (
    <Legal path={privacyPolicyPath} />
  )
}
