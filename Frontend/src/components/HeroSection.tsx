import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <section id="about" className="relative bg-[#eef1f1] text-white mt-40 h-[80vh] ">
      
      <div className="absolute inset-0 z-0 opacity-85 h-full bg-sky-300/40">
        <img
          src='/FRAMEWORK.gif'
          className='relative h-full mx-auto object-contain z-10 '
        />
       
      </div>

    
      <div className="container bg-transparent mx-auto px-4 flex flex-col items-center text-center justify-end pb-52 md:justify-end md:pb-0 h-full relative md:bottom-48 z-20">
        <Link to='/signup'>
        <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white">
          Join Now
        </Button>
        </Link>
      </div>
    </section>
  );
}
