"use client";

import { useEffect, useState } from "react";

type Day = {
  day:number; title:string; objective:string; format:string;
  hook:string; caption:string; cta:string; hashtags:string[]; image_brief:string
};

export default function Home(){
  const [brand,setBrand]=useState("My Brand");
  const [niche,setNiche]=useState("Bisnis");
  const [audience,setAudience]=useState("Target audience");
  const [tone,setTone]=useState("Friendly");
  const [days,setDays]=useState<Day[]>([]);
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState("Mulai dengan 1 konten preview.");
  const [approved,setApproved]=useState(false);
  const [instagram,setInstagram]=useState<{connected:boolean;username?:string;accountType?:string}>({connected:false});

  useEffect(()=>{ fetch("/api/instagram/status").then(r=>r.json()).then(setInstagram).catch(()=>{}); },[]);

  async function generate(count:number){
    setLoading(true);
    setMessage(count===1 ? "Membuat 1 konten preview dengan Gemini..." : `Membuat ${count} konten...`);
    try{
      const res=await fetch("/api/campaign",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({brand,niche,audience,tone,count})
      });
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||"Gagal generate");
      setDays(data.days);
      setApproved(count>1);
      setMessage(count===1 ? "Preview siap. Review dulu sebelum membuat batch." : `${count} konten berhasil dibuat.`);
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
        <div>
          <div className="eyebrow">Content automation</div>
          <div className="title">Content Preview Engine</div>
          <div className="muted">Test one content first. Expand to a batch only after the preview looks right.</div>
        </div>
        <button className="btn primary" onClick={()=>generate(1)} disabled={loading}>
          {loading ? "Generating..." : "Generate Preview"}
        </button>
      </div>

      <section className="grid">
        <div className="card"><div className="muted small">Mode</div><div className="metric">Preview first</div></div>
        <div className="card"><div className="muted small">Content generated</div><div className="metric">{days.length}</div></div>
        <div className="card"><div className="muted small">Batch status</div><div className="metric" style={{fontSize:18}}>{approved ? "Expanded" : "Not expanded"}</div></div>
        <div className="card"><div className="muted small">Status</div><div className="metric" style={{fontSize:16}}>{message}</div></div>
      </section>

      <div className="content-grid">
        <section className="card">
          <h3>Campaign setup</h3>
          <div className="form-grid">
            <div className="field"><label>Brand</label><input value={brand} onChange={e=>setBrand(e.target.value)}/></div>
            <div className="field"><label>Niche</label><input value={niche} onChange={e=>setNiche(e.target.value)}/></div>
            <div className="field"><label>Target audience</label><input value={audience} onChange={e=>setAudience(e.target.value)}/></div>
            <div className="field"><label>Tone</label><select value={tone} onChange={e=>setTone(e.target.value)}>
              <option>Friendly</option><option>Professional</option><option>Bold</option><option>Educational</option>
            </select></div>
          </div>
        </section>

        <section className="hero">
          <h2>Controlled generation</h2>
          <div className="small">Brief → 1 Preview → Review → Expand → Calendar → Instagram</div>
          <div className="actions">
            <button className="btn secondary" onClick={()=>setMessage("Review mode aktif. Periksa hook, caption, CTA, hashtag, dan image brief.")} disabled={!days.length}>Review Preview</button>
            {instagram.connected ? <button className="btn secondary" onClick={()=>setMessage(`Instagram @${instagram.username || ""} terhubung.`)}>Instagram Connected</button> : <a className="btn secondary" href="/api/instagram/connect">Connect Instagram</a>}
          </div>
        </section>
      </div>

      <section className="card" style={{marginTop:16}}>
        <h3>Instagram connection</h3>
        {instagram.connected ? <div className="small">Terhubung sebagai <strong>@{instagram.username}</strong> ({instagram.accountType || "Professional"}). Token disimpan sebagai cookie HTTP-only dan tidak ditampilkan ke browser.</div> : <div className="small muted">Belum terhubung. Pastikan Meta App sudah dibuat dan environment variables Instagram sudah diisi di Vercel.</div>}
      </section>

      <section className="card" style={{marginTop:16}}>
        <div className="top" style={{marginBottom:10}}>
          <div><h3 style={{margin:"0 0 4px"}}>Preview / Content batch</h3><div className="muted small">{days.length ? `${days.length} content generated` : "Belum ada content generated"}</div></div>
        </div>

        {!days.length ? (
          <div className="empty">Klik <strong>Generate Preview</strong> untuk membuat satu konten terlebih dahulu.</div>
        ) : (
          <div className="days">{days.map(d=><div className="day" key={d.day}>
            <div className="daynum">DAY {d.day}</div>
            <strong>{d.title}</strong>
            <div className="small muted" style={{marginTop:6}}>{d.objective} · {d.format}</div>
            <div style={{marginTop:10}}><strong>Hook:</strong> {d.hook}</div>
            <div style={{marginTop:8}}><strong>Caption:</strong> {d.caption}</div>
            <div style={{marginTop:8}}><strong>CTA:</strong> {d.cta}</div>
            <div style={{marginTop:8}}><strong>Image brief:</strong> {d.image_brief}</div>
            <div className="small muted" style={{marginTop:8}}>{d.hashtags.join(" ")}</div>
            <div className="status">{days.length===1 ? "Preview" : "Draft"}</div>
          </div>)}</div>
        )}

        {days.length===1 && (
          <div style={{marginTop:18}}>
            <div className="small muted" style={{marginBottom:10}}>Kalau preview sudah cocok, pilih ukuran batch:</div>
            <div className="actions">
              <button className="btn secondary" onClick={()=>generate(7)} disabled={loading}>Generate 7</button>
              <button className="btn secondary" onClick={()=>generate(14)} disabled={loading}>Generate 14</button>
              <button className="btn primary" onClick={()=>generate(30)} disabled={loading}>Generate 30</button>
            </div>
          </div>
        )}
      </section>
    </main>
  </div>;
}
