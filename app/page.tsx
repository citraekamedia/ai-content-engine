"use client";
import { useState } from "react";

type Day = {
  day:number; title:string; objective:string; format:string;
  hook:string; caption:string; cta:string; hashtags:string[]; image_brief:string
};

const seed:Day[] = Array.from({length:30},(_,i)=>({
  day:i+1,
  title:`Content idea ${i+1}`,
  objective:["Awareness","Engagement","Education","Conversion"][i%4],
  format:["Carousel","Single Image","Reel"][i%3],
  hook:`Hook untuk hari ${i+1}`,
  caption:`Caption AI akan muncul di sini untuk hari ${i+1}.`,
  cta:"Ajak audiens berkomentar.",
  hashtags:["#content","#instagram"],
  image_brief:"Visual premium yang sesuai dengan caption."
}));

export default function Home(){
  const [brand,setBrand]=useState("My Brand");
  const [niche,setNiche]=useState("Bisnis");
  const [audience,setAudience]=useState("Target audience");
  const [tone,setTone]=useState("Friendly");
  const [days,setDays]=useState<Day[]>(seed);
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState("30-day campaign siap dibuat.");

  async function generate(){
    setLoading(true); setMessage("Membuat content plan dengan Gemini...");
    try{
      const res=await fetch("/api/campaign",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({brand,niche,audience,tone,count:30})
      });
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||"Gagal generate");
      setDays(data.days);
      setMessage("30 konten berhasil dibuat.");
    }catch(e){
      setMessage(e instanceof Error ? e.message : "Terjadi error");
    }finally{setLoading(false);}
  }

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand">AI Content Engine</div>
      <div className="nav">
        <div className="active">Dashboard</div><div>Campaigns</div><div>Content</div>
        <div>Calendar</div><div>Brand</div><div>Instagram</div><div>Analytics</div><div>Settings</div>
      </div>
    </aside>
    <main className="main">
      <div className="top">
        <div><div className="eyebrow">Content automation</div><div className="title">30-Day Campaign Engine</div>
          <div className="muted">Generate strategy, captions, and image briefs in one batch.</div>
        </div>
        <button className="btn primary" onClick={generate} disabled={loading}>
          {loading?"Generating...":"Generate 30 Days"}
        </button>
      </div>

      <section className="grid">
        <div className="card"><div className="muted small">Campaign</div><div className="metric">30 days</div></div>
        <div className="card"><div className="muted small">Content ready</div><div className="metric">{days.length}</div></div>
        <div className="card"><div className="muted small">Format mix</div><div className="metric">3</div></div>
        <div className="card"><div className="muted small">Status</div><div className="metric" style={{fontSize:18}}>{message}</div></div>
      </section>

      <div className="content-grid">
        <section className="card"><h3>Campaign setup</h3><div className="form-grid">
          <div className="field"><label>Brand</label><input value={brand} onChange={e=>setBrand(e.target.value)}/></div>
          <div className="field"><label>Niche</label><input value={niche} onChange={e=>setNiche(e.target.value)}/></div>
          <div className="field"><label>Target audience</label><input value={audience} onChange={e=>setAudience(e.target.value)}/></div>
          <div className="field"><label>Tone</label><select value={tone} onChange={e=>setTone(e.target.value)}>
            <option>Friendly</option><option>Professional</option><option>Bold</option><option>Educational</option>
          </select></div>
        </div></section>

        <section className="hero">
          <h2>Pipeline aktif</h2>
          <div className="small">Brief → Content Plan → Caption → Image Brief → Review → Schedule → Instagram</div>
          <div className="actions">
            <button className="btn secondary" onClick={()=>setMessage("Mode review aktif. Auto-post belum diaktifkan.")}>Review Mode</button>
            <button className="btn secondary" onClick={()=>setMessage("Instagram connector siap setelah credential ditambahkan.")}>Instagram Setup</button>
          </div>
        </section>
      </div>

      <section className="card" style={{marginTop:16}}>
        <div className="top" style={{marginBottom:10}}>
          <div><h3 style={{margin:"0 0 4px"}}>Content calendar</h3><div className="muted small">30 hasil batch generation</div></div>
        </div>
        <div className="days">{days.map(d=><div className="day" key={d.day}>
          <div className="daynum">DAY {d.day}</div><strong>{d.title}</strong>
          <div className="small muted" style={{marginTop:6}}>{d.objective} · {d.format}</div>
          <div className="status">Draft</div>
        </div>)}</div>
      </section>
    </main>
  </div>;
}
