import Header from "@/components/Header"
import HeroSection from "@/components/HeroSection"
import FeaturesSection from "@/components/FeatureSection"
import HowItWorksSection from "@/components/HowItWorksSection"
// import TestimonialsSection from "@/components/TestimonialSection"
import VideoSection from "@/components/VideoSection"
import Footer from "@/components/Footer"
import RootLayout from "@/layout"
import WaitlistPopup from "@/components/WaitlistPopup"

export default function LandingPage() {
  return (
    <div className=" bg-white text-gray-800">
      <RootLayout>
        <Header />
        <main className="min-h-screen overflow-y-auto">
          <HeroSection />
          <FeaturesSection />
          <HowItWorksSection />
          {/* <TestimonialsSection /> */}
          <VideoSection />
          <Footer />
        </main>
      </RootLayout>
      <WaitlistPopup />
    </div>
  )
}
