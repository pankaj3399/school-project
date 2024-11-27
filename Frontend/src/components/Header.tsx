import {Link }from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <svg
            className="h-8 w-8 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          <span className="text-xl font-bold text-blue-600">PointEdu</span>

            </Link>
          {location.pathname === '/' ? ( <div className='flex gap-x-96 items-center '>
            <nav className="hidden lg:flex space-x-4">
          <a href="/" className="text-gray-600 hover:text-blue-600 transition-colors">
            Home
          </a>
          <a href="#about" className="text-gray-600 hover:text-blue-600 transition-colors">
            About
          </a>
          <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">
            Features
          </a>
          <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">
            Pricing
          </a>
        </nav>
        <div className="flex items-center space-x-2">
          <Link to='/signin'><Button variant="outline">Login</Button></Link>
          <Link to='/signup'>
          <Button>Get Started</Button>
          </Link>
        </div>
        </div>
        ) : (null)}
        
      </div>
    </header>
  )
}

