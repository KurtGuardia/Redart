import { useRouter } from 'next/router'

export default function useIsIndexPage() {
  const router = useRouter()
  return router.pathname === '/'
}
