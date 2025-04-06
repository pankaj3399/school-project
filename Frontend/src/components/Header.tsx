import {Link }from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function Header() {
  return (
<header className="fixed top-0 left-0 right-0 z-50 bg-[#fafafa] shadow-md h-fit">
<div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <img src="/radu-logo.png" alt="" className='w-32  h-32 scale-125' />
        </Link>
         
          {location.pathname === '/' ? ( <div className='flex gap-x-96 items-center '>
            <nav className="hidden lg:flex space-x-4">
          <a href="/" className="text-gray-600 hover:text-blue-600 transition-colors font-semibold text-lg">
            HOME
          </a>
          <a href="#about" className="text-gray-600 hover:text-blue-600 transition-colors font-semibold text-lg">
            ABOUT
          </a>
          <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors font-semibold text-lg">
            FEATURES
          </a>
          <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors font-semibold text-lg">
            PRICING
          </a>
        </nav>
        <div className="flex items-center space-x-2">
          <Link to='/signin'><Button  className='text-lg py-2' variant="outline">LOGIN</Button></Link>
          <Link to='/signup'>
          <Button className='text-lg py-2' >GET STARTED</Button>
          </Link>
        </div>
        </div>
        ) : (null)}
        
      </div>
    </header>
  )
}
