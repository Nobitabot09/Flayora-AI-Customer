import {useState} from 'react'
import {ArrowUp,Bot,Gift,RotateCcw,Sparkles,ShoppingBag} from 'lucide-react'
import {catalogue} from './catalogue'

type Message={role:'user'|'assistant';content:string;products?:string[]}
const starters=['Show me photo frames','I need a gift for someone special','What can I customise?','How much is a photo mug?']

function localReply(input:string,history:Message[]):Message{
  const q=input.toLowerCase().trim()
  const previousProducts=history.flatMap(m=>m.products||[])
  const selectedId=[...previousProducts].reverse().find(id=>catalogue.some(p=>p.id===id))
  const selected= catalogue.find(p=>p.id===selectedId)
  const findProduct=()=>catalogue.find(p=>p.active&&(
    (p.id==='FRAME-001'&&/\b(frame|frames|photo frame|picture frame)\b/.test(q))||
    (p.id==='MUG-001'&&/\b(mug|mugs|cup|cups)\b/.test(q))||
    (p.id==='KEY-001'&&/\b(keychain|key chain|keyring|key ring)\b/.test(q))||
    (p.id==='TSH-001'&&/\b(t.?shirt|tee|shirt|clothing)\b/.test(q))
  ))
  const product=findProduct()
  const greeting=/^(hi|hello|hey|hii|hlo|good morning|good evening|good afternoon)[!. ]*$/.test(q)
  if(greeting)return{role:'assistant',content:"Hey there! 👋 Welcome to Flayora! Looking for a gift for someone special, or something custom-printed? I can help you explore what we have."}
  if(/\bhow are you\b|\bhow r u\b|\bhow're you\b/.test(q))return{role:'assistant',content:"I'm doing great, thank you for asking! 😊 How about you? And whenever you're ready, I can help you find a lovely gift or something personalised."}
  if(/\b(thanks|thank you|thx)\b/.test(q))return{role:'assistant',content:"You're very welcome! 😊 Is there anything else you'd like to explore?"}
  if(/\b(bye|goodbye|see you)\b/.test(q))return{role:'assistant',content:"See you soon! Thanks for stopping by Flayora. Have a lovely day! 💛"}
  if(product){
    const details=product.price>0?'The sample listed price is ₹'+product.price+'. Final pricing should be confirmed.':'The price depends on the garment and printing details, so we would need to prepare a quote.'
    const variants=product.id==='TSH-001'?' Available sizes: S, M, L, XL and XXL. Listed colours: black, blue and red.':product.id==='MUG-001'?' It is a standard white ceramic mug.':product.id==='FRAME-001'?' Frame dimensions and colour options need confirmation.':' Shape and colour options need confirmation.'
    const custom=' You can personalise it with '+product.personalisation.join(', ')+'.'
    return{role:'assistant',content:'Absolutely! 😊 We have the '+product.name+'. '+product.description+variants+custom+' '+details+' Is it for you, or are you choosing it as a gift for someone?',products:[product.id]}
  }
  if(/\b(what can i customise|customi[sz]e|what do you sell|what do you have|catalogue|catalog|available products|show.*products)\b/.test(q)){
    return{role:'assistant',content:"We have a few personalised gift options in our current demo catalogue: photo mugs, custom keychains, printed T-shirts and personalised photo frames. What kind of item are you interested in?",products:['MUG-001','KEY-001','TSH-001','FRAME-001']}
  }
  const recipient=/\b(friend|friends|bestie|best friend|someone i love|loved one|girlfriend|boyfriend|partner|wife|husband|mother|mom|mum|father|dad|parents|family|sister|brother)\b/.test(q)
  const occasion=/\b(birthday|anniversary|wedding|graduation|farewell|thank.?you|surprise|just because|festival)\b/.test(q)
  if(recipient){
    return{role:'assistant',content:'That sounds lovely! ❤️ A personalised gift can make it extra meaningful. Is there a particular occasion, like a birthday or anniversary, or is it just a sweet surprise?'}
  }
  if(occasion){
    const occasionName=q.match(/\b(birthday|anniversary|wedding|graduation|farewell|thank.?you|surprise|festival)\b/)?.[0]||'special occasion'
    const suggestion=selected||catalogue.find(p=>p.id==='FRAME-001')!
    return{role:'assistant',content:'For a '+occasionName+', a '+suggestion.name.toLowerCase()+' could be a thoughtful choice. '+suggestion.description+' Would you like to see this option, or explore another type of gift?',products:[suggestion.id]}
  }
  if(/\b(price|cost|how much|rate|₹|rupees)\b/.test(q)&&selected){
    return{role:'assistant',content:selected.price>0?'The sample listed price for '+selected.name+' is ₹'+selected.price+'. Please confirm the final price before ordering. Would you like to personalise it with a photo, name or message?':'We have not set a confirmed price for '+selected.name+'. It depends on the print details, so a quote is needed. What design do you have in mind?',products:[selected.id]}
  }
  if(/\b(available|in stock|do you have|sell)\b/.test(q)&&!product){
    const options=catalogue.filter(p=>p.active).map(p=>p.name).join(', ')
    return{role:'assistant',content:"I don't see that exact item in our current catalogue, sorry! But I can help you explore these available demo catalogue options: "+options+". Would any of those work for you?",products:catalogue.filter(p=>p.active).map(p=>p.id)}
  }
  if(selected){
    return{role:'assistant',content:'Got it! 😊 For the '+selected.name.toLowerCase()+', I can help with the personalisation. Is it for a birthday, anniversary, or another occasion?',products:[selected.id]}
  }
  if(/\b(budget|under \d+|cheap|affordable)\b/.test(q)){
    return{role:'assistant',content:"I can help you find something within your budget. Our sample catalogue includes custom keychains (₹30), photo mugs (₹199) and personalised photo frames (₹249). These are demo prices, so please confirm final pricing. What's your budget?",products:['KEY-001','MUG-001','FRAME-001']}
  }
  const alternatives=catalogue.filter(p=>p.active).map(p=>p.name).join(', ')
  return{role:'assistant',content:"Sorry, I don't see that exact item in our current catalogue yet. But we can explore "+alternatives+". Are you looking for a gift, or something for personal use?",products:catalogue.filter(p=>p.active).map(p=>p.id)}
}

export default function App(){
  const [messages,setMessages]=useState<Message[]>([{role:'assistant',content:"Hey! 👋 Welcome to Flayora! I'm here to help you find a thoughtful gift or explore custom printing. What are you looking for today?"}])
  const [input,setInput]=useState('')
  const [busy,setBusy]=useState(false)

  function send(value=input){
    const clean=value.trim()
    if(!clean||busy)return
    const next=[...messages,{role:'user' as const,content:clean}]
    setMessages(next)
    setInput('')
    setBusy(true)
    window.setTimeout(()=>{
      const answer=localReply(clean,next)
      setMessages(current=>[...current,answer])
      setBusy(false)
    },450)
  }

  function reset(){
    setMessages([{role:'assistant',content:"A fresh chat! 😊 Tell me what you're shopping for, and I'll help you find something lovely."}])
    setInput('')
  }

  const productIds=[...new Set(messages.flatMap(m=>m.products||[]))]
  const products=catalogue.filter(p=>productIds.includes(p.id)&&p.active)

  return <main className="shell">
    <aside className="side">
      <div className="brand"><div className="brandmark">F</div><div><b>FLAYORA</b><small>AI CUSTOMER ASSISTANT</small></div></div>
      <div className="side-note"><Sparkles size={17}/>Your ideas, personalised.</div>
      <div className="side-bottom"><span className="dot"/> Shopping assistant · Preview mode</div>
    </aside>
    <section className="workspace">
      <header className="topbar"><div><div className="eyebrow">YOUR PERSONAL SHOPPING ASSISTANT</div><h1>Let's make it personal.</h1></div><button className="reset" onClick={reset}><RotateCcw size={15}/> New chat</button></header>
      <div className="chat-area"><div className="chat-inner">
        <div className="welcome"><div className="bot-orb"><Bot size={25}/></div><div><b>Flayora Assistant</b><span><i/> Online · Preview mode</span></div></div>
        <div className="messages">
          {messages.map((m,i)=><div className={'message-row '+m.role} key={i}>{m.role==='assistant'&&<div className="mini-orb"><Bot size={15}/></div>}<div className="bubble">{m.content}</div></div>)}
          {busy&&<div className="message-row assistant"><div className="mini-orb"><Bot size={15}/></div><div className="bubble">Thinking···</div></div>}
        </div>
        {products.length>0&&<div className="product-strip">{products.map(p=><article className="product" key={p.id}><div className="product-icon"><Gift size={20}/></div><div><b>{p.name}</b><small>{p.price>0?'₹'+p.price+' · sample price':'Quote required'}</small><small>{p.category}</small></div></article>)}</div>}
        {messages.length===1&&<div className="suggestions"><p>TRY ASKING</p>{starters.map(s=><button key={s} onClick={()=>send(s)}>{s}</button>)}</div>}
      </div></div>
      <div className="composer-wrap"><form className="composer" onSubmit={e=>{e.preventDefault();send()}}><ShoppingBag size={18}/><input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask about gifts, frames, colours, sizes or prices..." disabled={busy}/><button disabled={!input.trim()||busy} aria-label="Send message"><ArrowUp size={19}/></button></form><p>Preview assistant · Sample catalogue and prices, not live stock or final quotes.</p></div>
    </section>
  </main>
}