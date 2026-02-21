// @website/page.tsx

import React from 'react'
import HeroSection from '@/components/website/hero-section-simple'
import MarqueeStrip from '@/components/website/marquee-strip'
import FeaturesSection from '@/components/website/features-section'
import MenuSection from '@/components/website/menu-section'
import AboutSection from '@/components/website/about-section'
import TestimonialsSection from '@/components/website/testimonials-section'
import CTASection from '@/components/website/cta-section'
import Footer from '@/components/website/footer-simple'

export default function WebsiteHome() {
  return (
    <>
      <HeroSection />
      <MarqueeStrip />
      <FeaturesSection />
      <MenuSection />
      <AboutSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </>
  )
}

