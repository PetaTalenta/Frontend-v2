import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Animation Test - PetaTalenta',
  description: 'Testing Framer Motion animations for performance and user experience',
}

export default function AnimationTestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
