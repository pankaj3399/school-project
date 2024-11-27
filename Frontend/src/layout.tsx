
import { Toaster } from "@/components/ui/toaster"



export const metadata = {
  title: 'PointEdu - School Point Management System',
  description: 'Empower learning through points with our innovative school point management system.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body >
        <Toaster />
        {children}
      </body>
    </html>
  )
}

