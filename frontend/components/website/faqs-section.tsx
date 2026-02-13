"use client"

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function FAQsSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    {
      question: "What are your opening hours?",
      answer: "We are open Monday to Sunday from 11:00 AM to 11:00 PM. Last orders are taken at 10:30 PM."
    },
    {
      question: "Do you accept reservations?",
      answer: "Yes! We highly recommend making a reservation, especially for weekends and holidays. You can book through our website or call us directly."
    },
    {
      question: "Do you offer vegetarian and vegan options?",
      answer: "Absolutely! We have a dedicated section in our menu for vegetarian and vegan dishes. Our chefs can also accommodate special dietary requirements."
    },
    {
      question: "Is parking available?",
      answer: "Yes, we have a complimentary parking lot for our guests with over 50 spaces available."
    },
    {
      question: "Do you cater to large groups?",
      answer: "Yes, we can accommodate groups of up to 50 people. Please contact us in advance for group bookings."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, debit cards, and cash. We also support digital payment options."
    }
  ]

  return (
    <section id="faqs" className="py-20 bg-background-light">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-text-muted">
              Find answers to common questions about our restaurant
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-background-light transition-colors"
                >
                  <span className="text-lg font-semibold text-foreground">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`text-primary transition-transform ${
                      openIndex === index ? 'transform rotate-180' : ''
                    }`}
                    size={24}
                  />
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-4">
                    <p className="text-text-muted leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
