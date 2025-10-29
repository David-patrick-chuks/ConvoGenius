"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export default function PublicAgentChatPage() {
  const params = useParams();
  const sp = useSearchParams();
  const agentId = params?.id as string;
  const theme = (sp.get('theme') || 'dark').toLowerCase();
  const primaryColor = sp.get('primaryColor') || '#2563eb';
  const title = sp.get('title') || 'Chat';

  const [messages, setMessages] = useState<{type:'user'|'agent'; content:string}[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const sessionId = useMemo(()=>`pub-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,[]);

  const bg = theme==='light' ? '#ffffff' : '#0b1120';
  const fg = theme==='light' ? '#111827' : '#e5e7eb';
  const sub = theme==='light' ? '#6b7280' : '#9ca3af';

  const send = async () => {
    if (!text.trim()) return;
    const t = text; setText(""); setMessages(prev=>[...prev,{type:'user',content:t}]); setLoading(true);
    try {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backend}/api/chat/public`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ agentId, message: t, sessionId }) });
      const data = await res.json();
      if (res.ok) setMessages(prev=>[...prev,{type:'agent',content:data.message||''}]);
      else setMessages(prev=>[...prev,{type:'agent',content:data.error||'Something went wrong.'}]);
    } catch (e:any) {
      setMessages(prev=>[...prev,{type:'agent',content:'Network error.'}]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{background:bg,color:fg,height:'100vh',display:'flex',flexDirection:'column',fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'}}>
      <div style={{padding:'12px 16px',borderBottom:`1px solid ${theme==='light'?'#e5e7eb':'#1f2937'}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{fontWeight:700}}>{title}</div>
        <div style={{width:10,height:10,borderRadius:'50%',background:primaryColor}}/>
      </div>
      <div style={{flex:1,overflow:'auto',padding:16}}>
        {messages.length===0 && (
          <div style={{textAlign:'center',color:sub,marginTop:40}}>Say hello to start a conversation.</div>
        )}
        {messages.map((m,i)=> (
          <div key={i} style={{margin:'8px 0',display:'flex',justifyContent:m.type==='user'?'flex-end':'flex-start'}}>
            <div style={{maxWidth:'80%',padding:'10px 12px',borderRadius:12,background:m.type==='user'?primaryColor:(theme==='light'?'#f3f4f6':'#111827'),color:m.type==='user'?'#fff':fg}}>
              {m.content}
            </div>
          </div>
        ))}
      </div>
      <div style={{padding:12,borderTop:`1px solid ${theme==='light'?'#e5e7eb':'#1f2937'}`,display:'flex',gap:8}}>
        <Input value={text} placeholder="Type a message..." onChange={e=>setText(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') send(); }} className="flex-1 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500" />
        <Button onClick={send} disabled={loading} className="rounded-xl" style={{background:primaryColor}}>{loading?'...':'Send'}</Button>
      </div>
    </div>
  );
}


