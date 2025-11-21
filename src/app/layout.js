import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'Petrol Pump Management System',
  description: 'Petrol Pump Management System with role-based access',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}







