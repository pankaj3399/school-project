import {Link }from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function Header() {
  return (
<header className="fixed top-0 left-0 right-0 z-50 bg-[#fafafa] shadow-md h-20">
<div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <img src="/logo3.png" alt="" className='w-14  h-14' />
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
