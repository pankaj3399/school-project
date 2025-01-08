import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <section id="about" className="relative bg-[#eef1f1] text-white py-20  md:py-96 mt-20 h-screen">
      
      <div className="absolute inset-0 z-0 opacity-85">
        <img
          // src="https://cdn.dribbble.com/users/1129235/screenshots/3324000/gif02.gif"
          src="/intro_logo.gif"
          width={2000}
          height={2000}
          alt="School environment"
          className="w-full h-full object-cover object-bottom"
        />
      </div>

    
      <div className="container bg-transparent mx-auto px-4 flex flex-col items-center text-center justify-end pb-52 md:justify-end md:pb-0 h-full relative md:-bottom-16 z-20">
        <Link to='/signup'>
        <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white">
          Join Now
        </Button>
        </Link>
      </div>
    </section>
  );
}