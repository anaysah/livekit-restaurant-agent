export default function ChatLoading() {
  return (
    <div className="w-1/4 min-w-[300px] bg-card border-r border-border h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-3"></div>
        <p className="text-text-muted text-sm">Loading chat...</p>
      </div>
    </div>
  )
}
