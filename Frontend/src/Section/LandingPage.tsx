import Header from "@/components/Header"
import HeroSection from "@/components/HeroSection"
import FeaturesSection from "@/components/FeatureSection"
import HowItWorksSection from "@/components/HowItWorksSection"
import TestimonialsSection from "@/components/TestimonialSection"
import PricingSection from "@/components/PricingSection"
import Footer from "@/components/Footer"
import RootLayout from "@/layout"
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <RootLayout>
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <PricingSection />
      </main>
      <Footer />
      </RootLayout>
    </div>
  )
}
