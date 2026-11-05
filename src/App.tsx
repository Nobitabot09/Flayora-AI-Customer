import {useState} from 'react'
import {ArrowUp,Bot,Gift,RotateCcw,Sparkles,ShoppingBag} from 'lucide-react'
import {catalogue} from './catalogue'

type Message={role:'user'|'assistant';content:string;products?:string[]}
const starters=['Show me photo frames','I need a gift for someone special','What can I customise?','How much is a photo mug?']

export default function App(){
  const [messages,setMessages]=useState<Message[]>([{role:'assistant',content:"Hey! 👋 Welcome to Flayora! I'm here to help you find a thoughtful gift or explore custom printing. What are you looking for today?"}])
  const [input,setInput]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')

  async function send(value=input){
    const clean=value.trim()
    if(!clean||busy)return
    const next=[...messages,{role:'user' as const,content:clean}]
    setMessages(next)
    setInput('')
    setBusy(true)
    setError('')
    try{
      const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:next.slice(-20).map(({role,content})=>({role,content}))})})
      const data=await response.json() as {reply?:string;products?:string[];error?:string}
      if(!response.ok||!data.reply)throw new Error(data.error||'I could not connect right now. Please try again.')
      setMessages(current=>[...current,{role:'assistant',content:data.reply!,products:Array.isArray(data.products)?data.products:[]}])
    }catch(e){
      setError(e instanceof Error?e.message:'Something went wrong. Please try again.')
    }finally{setBusy(false)}
  }

  function reset(){
    setMessages([{role:'assistant',content:"A fresh chat! 😊 Tell me what you're shopping for, and I'll help you find something lovely."}])
    setInput('')
    setError('')
  }

  const productIds=[...new Set(messages.flatMap(m=>m.products||[]))]
  const products=catalogue.filter(p=>productIds.includes(p.id)&&p.active)

  return <main className="shell">
    <aside className="side">
      <div className="brand"><div className="brandmark">F</div><div><b>FLAYORA</b><small>AI CUSTOMER ASSISTANT</small></div></div>
      <div className="side-note"><Sparkles size={17}/>Your ideas, personalised.</div>
      <div className="side-bottom"><span className="dot"/> AI shopping assistant</div>
    </aside>
    <section className="workspace">
      <header className="topbar"><div><div className="eyebrow">YOUR PERSONAL SHOPPING ASSISTANT</div><h1>Let's make it personal.</h1></div><button className="reset" onClick={reset}><RotateCcw size={15}/> New chat</button></header>
      <div className="chat-area"><div className="chat-inner">
        <div className="welcome"><div className="bot-orb"><Bot size={25}/></div><div><b>Flayora Assistant</b><span><i/> Online · AI powered</span></div></div>
        <div className="messages">
          {messages.map((m,i)=><div className={'message-row '+m.role} key={i}>{m.role==='assistant'&&<div className="mini-orb"><Bot size={15}/></div>}<div className="bubble">{m.content}</div></div>)}
          {busy&&<div className="message-row assistant"><div className="mini-orb"><Bot size={15}/></div><div className="bubble">Thinking···</div></div>}
        </div>
        {products.length>0&&<div className="product-strip">{products.map(p=><article className="product" key={p.id}><div className="product-icon"><Gift size={20}/></div><div><b>{p.name}</b><small>{p.price>0?'₹'+p.price+' · sample price':'Quote required'}</small><small>{p.category}</small></div></article>)}</div>}
        {messages.length===1&&<div className="suggestions"><p>TRY ASKING</p>{starters.map(s=><button key={s} onClick={()=>send(s)}>{s}</button>)}</div>}
        {error&&<div className="error-note">{error} Your message is still here — tap send to retry.</div>}
      </div></div>
      <div className="composer-wrap"><form className="composer" onSubmit={e=>{e.preventDefault();send()}}><ShoppingBag size={18}/><input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask about gifts, frames, colours, sizes or prices..." disabled={busy}/><button disabled={!input.trim()||busy} aria-label="Send message"><ArrowUp size={19}/></button></form><p>Flayora AI · Product details and prices are based on the current catalogue.</p></div>
    </section>
  </main>
}