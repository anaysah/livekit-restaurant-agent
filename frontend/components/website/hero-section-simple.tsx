import React from 'react'
import Link from 'next/link'

export default function HeroSection() {
  return (
    <section id="home" className="min-h-screen flex items-center justify-center bg-background-light">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6">
            Welcome to Our Restaurant
          </h1>
          <p className="text-xl md:text-2xl text-text-muted mb-8">
            Experience the finest culinary delights in a warm and inviting atmosphere
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/booking"
              className="bg-primary text-white px-8 py-3 rounded-sm hover:bg-secondary transition-colors text-lg font-medium"
            >
              Book A Table
            </Link>
            <Link
              href="/order"
              className="border border-primary text-primary px-8 py-3 rounded-sm hover:bg-primary hover:text-white transition-colors text-lg font-medium"
            >
              Order Online
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
