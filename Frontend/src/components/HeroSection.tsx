import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <section id="about" className="relative bg-[#eef1f1] text-white mt-40 h-[80vh]">
      <div className="absolute inset-0 z-0 opacity-85 h-full bg-sky-300/40">
        <video
          src='/ETOKEN.mp4'
          className='relative h-full mx-auto object-contain z-10'
          autoPlay
          muted
          loop
          playsInline
          controls={false}
        />
      </div>
    </section>
  );
}

