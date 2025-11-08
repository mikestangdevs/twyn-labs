export const getURL = () => {
  // Get the site URL from environment variable or fall back to localhost
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  // Ensure the URL starts with http:// or https://
  const withProtocol = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`
  
  // Ensure URL ends with trailing slash
  return withProtocol.endsWith('/') ? withProtocol : `${withProtocol}/`
} 