import React from 'react'

export default function ServicesSection() {
  const services = [
    {
      icon: "🍕",
      title: "Dine In",
      description: "Enjoy our cozy atmosphere and impeccable service"
    },
    {
      icon: "🚚",
      title: "Delivery",
      description: "Fast and reliable delivery to your doorstep"
    },
    {
      icon: "🥡",
      title: "Takeaway",
      description: "Quick pickup for on-the-go dining"
    },
    {
      icon: "🎉",
      title: "Catering",
      description: "Perfect for events and special occasions"
    },
    {
      icon: "👨‍🍳",
      title: "Private Chef",
      description: "Personal chef service for your home"
    },
    {
      icon: "🍷",
      title: "Wine Selection",
      description: "Curated wine collection from around the world"
    }
  ]

  return (
    <section id="services" className="py-20 bg-background-light">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Our Services
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              We offer a wide range of services to meet all your dining needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-card p-8 rounded-lg border border-border hover:border-primary transition-all hover:shadow-lg"
              >
                <div className="text-5xl mb-4">{service.icon}</div>
                <h3 className="text-2xl font-semibold text-foreground mb-3">
                  {service.title}
                </h3>
                <p className="text-text-muted">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
