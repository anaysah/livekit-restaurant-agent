# Next.js Parallel Routes Implementation

## Folder Structure

```
app/
├── layout.tsx              # Root layout with parallel slots
├── page.tsx                # Root page (returns null, slots handle UI)
├── @chat/                  # Chat UI parallel slot
│   ├── page.tsx            # Chat for / route
│   ├── default.tsx         # Fallback for unmatched routes
│   └── loading.tsx         # Loading state
└── @website/               # Website content parallel slot
    ├── page.tsx            # Home page for / route
    ├── default.tsx         # Fallback for unmatched routes
    ├── loading.tsx         # Loading state
    ├── booking/
    │   └── page.tsx        # /booking route
    └── order/
        └── page.tsx        # /order route
```

## How It Works

### 1. Parallel Slots (@chat and @website)
- Folders starting with `@` are parallel route slots
- Each slot is automatically passed as a prop to the parent layout
- Slots render independently and can have their own loading/error states

### 2. Layout.tsx
```tsx
export default function RootLayout({
  children,
  chat,      // @chat slot
  website,   // @website slot
}) {
  return (
    <div className="flex h-screen">
      {chat}      // Left side - always visible
      {website}   // Right side - changes based on route
    </div>
  )
}
```

### 3. Routes and Rendering

| URL       | @chat Slot      | @website Slot       |
|-----------|-----------------|---------------------|
| /         | page.tsx        | page.tsx (home)     |
| /booking  | default.tsx*    | booking/page.tsx    |
| /order    | default.tsx*    | order/page.tsx      |

*When a route doesn't exist in a slot (like @chat/booking), Next.js renders `default.tsx`

### 4. Key Benefits

✅ **Independent Loading**: Each slot loads at its own pace
✅ **Persistent UI**: Chat UI stays visible during navigation
✅ **Better UX**: No full page reloads, smooth transitions
✅ **Type Safety**: Automatic props in layout
✅ **Error Isolation**: Errors in one slot don't affect others

### 5. Important Files

#### default.tsx (REQUIRED!)
- Fallback when route doesn't exist in that slot
- Prevents 404 errors during navigation
- Usually renders the same as page.tsx or returns null

#### loading.tsx (Optional but Recommended)
- Shows while slot content is loading
- Independent loading states per slot

## Session Management

The @chat slot uses `ChatWithSession` wrapper which:
- Initializes LiveKit session
- Provides AgentSessionProvider context
- Wraps AgentChatUI component

## Component Organization

### Simplified Components
Created for parallel routes (use Next.js Link):
- `header-simple.tsx` - Navigation with Link components
- `hero-section-simple.tsx` - Hero with Link buttons
- `footer-simple.tsx` - Footer with Link components

### Original Components
Kept for reference (use onNavigate prop):
- `header.tsx`
- `hero-section.tsx`
- `footer.tsx`

## Navigation

All navigation uses Next.js `<Link>` component:
```tsx
<Link href="/booking">Book A Table</Link>
<Link href="/order">Order Online</Link>
<Link href="/#about">About Us</Link>  // Hash for sections
```

## Testing

### Development Mode
```bash
npm run dev
```
Navigate to:
- http://localhost:3000/ - Home with chat
- http://localhost:3000/booking - Booking page with chat
- http://localhost:3000/order - Order page with chat

### Production Build (Recommended for Testing)
```bash
npm run build
npm run start
```

Parallel routes behavior can differ between dev/prod modes.

## Troubleshooting

### 404 on Navigation?
- Check if `default.tsx` exists in all slots
- Verify route folder structure matches URL

### Slot Not Updating?
- Clear `.next` folder and rebuild
- Check browser console for hydration errors

### Session Provider Issues?
- Ensure ChatWithSession component wraps AgentChatUI
- Verify API endpoint `/api/connection-details` is accessible

## Future Enhancements

- Add error.tsx files for error boundaries
- Implement slot-specific metadata
- Add animation transitions between routes
- Consider intercepting routes for modals
