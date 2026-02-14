// order/page.tsx

import React from 'react'
import Header from '@/components/website/header-simple'
import HeroSection from '@/components/website/hero-section-simple'
import AboutSection from '@/components/website/about-section'
import ServicesSection from '@/components/website/services-section'
import TeamSection from '@/components/website/team-section'
import FAQsSection from '@/components/website/faqs-section'
import Footer from '@/components/website/footer-simple'

export default function WebsiteHome() {
  return (
    <div className="flex-1 h-screen overflow-y-auto scroll-smooth">
      <Header />
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <TeamSection />
      <FAQsSection />
      <Footer />
    </div>
  )
}
