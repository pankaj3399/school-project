import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <section id="about" className="relative bg-[#eef1f1] text-white py-20 md:py-32 h-screen">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 opacity-85">
        <img
          src="https://cdn.dribbble.com/users/1129235/screenshots/3324000/gif02.gif"
          alt="School environment"
          className="w-full h-full object-contain object-top"
        />
      </div>

      {/* Content */}
      <div className="container bg-transparent mx-auto px-4 flex flex-col items-center text-center justify-center h-full relative z-20">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-2xl text-blue-600">Empower Learning Through Points!</h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl drop-shadow-2xl ">
          Streamline school rewards and engagement with our point management system.
        </p>
        <Link to='/signup'>
        <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white">
          Join Now
        </Button>
        </Link>
      </div>
    </section>
  );
}
