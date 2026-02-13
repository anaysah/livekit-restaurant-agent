"use client"

import React, { useState } from 'react'
import Header from '@/components/website/header-simple'
import { Plus, Minus, ShoppingCart } from 'lucide-react'

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  category: string
  emoji: string
}

interface CartItem extends MenuItem {
  quantity: number
}

export default function OrderPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  const menuItems: MenuItem[] = [
    { id: 1, name: "Margherita Pizza", description: "Classic tomato, mozzarella, basil", price: 12.99, category: "Pizza", emoji: "🍕" },
    { id: 2, name: "Pepperoni Pizza", description: "Tomato sauce, mozzarella, pepperoni", price: 14.99, category: "Pizza", emoji: "🍕" },
    { id: 3, name: "Caesar Salad", description: "Romaine lettuce, parmesan, croutons", price: 8.99, category: "Salads", emoji: "🥗" },
    { id: 4, name: "Greek Salad", description: "Tomatoes, cucumber, feta, olives", price: 9.99, category: "Salads", emoji: "🥗" },
    { id: 5, name: "Spaghetti Carbonara", description: "Pasta, eggs, bacon, parmesan", price: 13.99, category: "Pasta", emoji: "🍝" },
    { id: 6, name: "Penne Arrabbiata", description: "Spicy tomato sauce, garlic", price: 11.99, category: "Pasta", emoji: "🍝" },
    { id: 7, name: "Grilled Salmon", description: "Fresh salmon, herbs, lemon", price: 18.99, category: "Main Course", emoji: "🐟" },
    { id: 8, name: "Ribeye Steak", description: "Premium beef, grilled to perfection", price: 24.99, category: "Main Course", emoji: "🥩" },
    { id: 9, name: "Tiramisu", description: "Classic Italian dessert", price: 6.99, category: "Desserts", emoji: "🍰" },
    { id: 10, name: "Chocolate Lava Cake", description: "Warm chocolate cake with ice cream", price: 7.99, category: "Desserts", emoji: "🍫" },
  ]

  const categories = ['All', ...Array.from(new Set(menuItems.map(item => item.category)))]

  const filteredItems = selectedCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory)

  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id)
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ))
    } else {
      setCart([...cart, { ...item, quantity: 1 }])
    }
  }

  const removeFromCart = (id: number) => {
    const existingItem = cart.find(cartItem => cartItem.id === id)
    if (existingItem && existingItem.quantity > 1) {
      setCart(cart.map(cartItem => 
        cartItem.id === id 
          ? { ...cartItem, quantity: cartItem.quantity - 1 }
          : cartItem
      ))
    } else {
      setCart(cart.filter(cartItem => cartItem.id !== id))
    }
  }

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-background pb-24">
      <Header />
      
      {totalItems > 0 && (
        <div className="bg-card border-b border-border sticky top-0 z-10">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-end">
              <div className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-sm">
                <ShoppingCart size={20} />
                <span className="font-semibold">{totalItems} Items</span>
                <span className="font-bold">${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Order Online
            </h1>
            <p className="text-lg text-text-muted">
              Browse our menu and place your order for delivery or pickup
            </p>
          </div>

          <div className="flex flex-wrap gap-3 mb-8 justify-center">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary text-white'
                    : 'bg-card text-foreground border border-border hover:border-primary'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredItems.map(item => {
              const cartItem = cart.find(c => c.id === item.id)
              const quantity = cartItem?.quantity || 0

              return (
                <div key={item.id} className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-all">
                  <div className="text-5xl mb-4">{item.emoji}</div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{item.name}</h3>
                  <p className="text-text-muted text-sm mb-4">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">${item.price}</span>
                    <div className="flex items-center space-x-2">
                      {quantity > 0 ? (
                        <>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="bg-background border border-border p-2 rounded-sm hover:border-primary transition-colors"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="font-semibold text-foreground w-8 text-center">{quantity}</span>
                          <button
                            onClick={() => addToCart(item)}
                            className="bg-primary text-white p-2 rounded-sm hover:bg-secondary transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="bg-primary text-white px-4 py-2 rounded-sm hover:bg-secondary transition-colors flex items-center space-x-2"
                        >
                          <Plus size={16} />
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {cart.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 shadow-lg z-20">
              <div className="container mx-auto max-w-7xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-muted text-sm">Total Amount</p>
                    <p className="text-2xl font-bold text-foreground">${totalPrice.toFixed(2)}</p>
                  </div>
                  <button 
                    onClick={() => alert('Checkout functionality coming soon!')}
                    className="bg-primary text-white px-8 py-3 rounded-sm hover:bg-secondary transition-colors font-medium text-lg"
                  >
                    Checkout ({totalItems} items)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
