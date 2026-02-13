import React from 'react'

export default function AboutSection() {
  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              About Us
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Discover our story and passion for exceptional dining
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="aspect-[4/3] bg-card rounded-lg flex items-center justify-center">
                <span className="text-6xl">🍽️</span>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-3xl font-semibold text-foreground">
                Our Story
              </h3>
              <p className="text-text-muted leading-relaxed">
                Since our founding, we have been dedicated to providing our guests with
                an unforgettable dining experience. Our chefs combine traditional recipes
                with modern techniques to create dishes that delight the senses.
              </p>
              <p className="text-text-muted leading-relaxed">
                We source only the finest ingredients from local farms and suppliers,
                ensuring that every meal is fresh, flavorful, and memorable.
              </p>
              <div className="grid grid-cols-3 gap-4 pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">10+</div>
                  <div className="text-sm text-text-muted">Years</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">50+</div>
                  <div className="text-sm text-text-muted">Dishes</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">1000+</div>
                  <div className="text-sm text-text-muted">Happy Customers</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
