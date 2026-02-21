export default function WebsiteLoading() {
  return (
    <div className="flex-1 h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-text-muted">Loading website...</p>
      </div>
    </div>
  )
}
