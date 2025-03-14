'use client'

import { usePathname } from 'next/navigation'

export function useIsIndexPage() {
  const pathname = usePathname()
  return pathname === '/'
}
