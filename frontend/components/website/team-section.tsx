import React from 'react'

export default function TeamSection() {
  const team = [
    {
      name: "Chef Alessandro",
      role: "Head Chef",
      emoji: "👨‍🍳"
    },
    {
      name: "Maria Garcia",
      role: "Sous Chef",
      emoji: "👩‍🍳"
    },
    {
      name: "John Smith",
      role: "Restaurant Manager",
      emoji: "👔"
    },
    {
      name: "Sarah Johnson",
      role: "Sommelier",
      emoji: "🍷"
    }
  ]

  return (
    <section id="team" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Meet Our Team
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Our passionate team of culinary experts and hospitality professionals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div
                key={index}
                className="text-center"
              >
                <div className="bg-card rounded-lg p-8 mb-4 border border-border hover:border-primary transition-all">
                  <div className="text-7xl mb-4">{member.emoji}</div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {member.name}
                </h3>
                <p className="text-text-muted">
                  {member.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
