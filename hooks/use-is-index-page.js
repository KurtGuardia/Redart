'use client'

import { usePathname } from 'next/navigation'

export default function useIsIndexPage() {
  const pathname = usePathname()
  return pathname === '/'
}
