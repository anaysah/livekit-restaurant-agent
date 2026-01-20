## Main Problem

**`on_session_end` mein `session` object accessible nahi hai** - sirf `ctx` milta hai. Isliye aapka code kaam nahi kar raha. [docs.livekit](https://docs.livekit.io/deploy/observability/data/)

## Working Solution (Simple & Guaranteed)

**Ye method use karo** - `ctx.add_shutdown_callback` kyunki yahan `session` scope mein hai: [docs.livekit](https://docs.livekit.io/agents/server/job/)

```python
@server.rtc_session()
async def my_agent(ctx: JobContext):
    # Session create karo
    session = AgentSession[UserData](...)
    
    # SHUTDOWN CALLBACK - yahaan session accessible hai
    async def save_transcript():
        import json
        from datetime import datetime
        
        # Session history nikalo
        history = session.history.to_dict()
        
        # File mein save karo
        filename = f"transcript_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w') as f:
            json.dump(history, f, indent=2)
        
        print(f"✅ Saved: {filename}")
    
    # Callback register karo
    ctx.add_shutdown_callback(save_transcript)
    
    # Baaki ka code...
    await session.start(...)
    await ctx.connect()
```

## Kyun Kaam Karega?

1. **Scope**: `save_transcript` function ke andar `session` accessible hai [github](https://github.com/livekit/agents/issues/812)
2. **Guaranteed execution**: Shutdown callback **60 seconds tak** run hota hai [docs.livekit](https://docs.livekit.io/agents/server/job/)
3. **Automatic flush**: File `with open` se automatically close/flush ho jati hai [docs.livekit](https://docs.livekit.io/deploy/observability/data/)

## Alternative (Agar on_session_end use karna hai)

`ctx.make_session_report()` use karo - isme already conversation history hai: [github](https://github.com/livekit/agents/issues/812)

```python
async def on_session_end(ctx: JobContext):
    import json
    
    # Report mein already history hai
    report = ctx.make_session_report()
    
    # Save karo
    with open(f"report_{ctx.room.name}.json", 'w') as f:
        json.dump(report.to_dict(), f, indent=2)
    
    print("✅ Report saved")

@server.rtc_session(on_session_end=on_session_end)
async def my_agent(ctx: JobContext):
    # Your code...
```

**Recommendation**: Pehla method (shutdown callback) zyada reliable hai kyunki `session.history` directly accessible hai. [docs.livekit](https://docs.livekit.io/deploy/observability/data/)