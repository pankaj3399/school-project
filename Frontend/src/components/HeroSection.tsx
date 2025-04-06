import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <section id="about" className="relative bg-[#eef1f1] text-white mt-40 h-[80vh]">
      <div className="absolute inset-0 z-0 opacity-85 h-full bg-sky-300/40">
        <video
          src='/FRAMEWORK.mp4'
          className='relative h-full mx-auto object-contain z-10'
          autoPlay
          muted
          loop
          playsInline
          controls={false}
        />
      </div>

      <div className={`
        container bg-transparent mx-auto px-4 
        flex flex-col items-center text-center 
        justify-end pb-52 md:justify-end md:pb-0 h-full 
        relative md:bottom-1/3
        z-20
      `} >
        <Link to='/signup'>
        
          {/*Hidden this button as it does not match with new video it will look bad.*/}

          {/* <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white">
            Join Now
          </Button> */}
        </Link>
      </div>


    
    </section>
  );
}

