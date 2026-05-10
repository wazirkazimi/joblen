import React, { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';

export default function EditCard({ title, children, onSave, renderEdit }) {
  const [editing, setEditing] = useState(false);

  const handleSave = async () => { await onSave(); setEditing(false); };

  return (
    <div style={{ background:'white', border:'1px solid #e2e8f0', borderRadius:'16px', padding:'1.5rem', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', marginBottom:'1rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', paddingBottom:'0.75rem', borderBottom:'1px solid #f1f5f9' }}>
        <span style={{ fontWeight:700, fontSize:'0.95rem', color:'#0f172a' }}>{title}</span>
        {!editing
          ? <button onClick={() => setEditing(true)} style={{ display:'flex', alignItems:'center', gap:'0.3rem', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'6px', padding:'0.3rem 0.75rem', cursor:'pointer', color:'#2563eb', fontSize:'0.8rem', fontWeight:600 }}><Edit2 size={12}/> Edit</button>
          : <div style={{ display:'flex', gap:'0.5rem' }}>
              <button onClick={handleSave} style={{ display:'flex', alignItems:'center', gap:'0.3rem', background:'#2563eb', border:'none', borderRadius:'6px', padding:'0.3rem 0.75rem', cursor:'pointer', color:'white', fontSize:'0.8rem', fontWeight:600 }}><Check size={12}/> Save</button>
              <button onClick={() => setEditing(false)} style={{ display:'flex', alignItems:'center', gap:'0.3rem', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:'6px', padding:'0.3rem 0.75rem', cursor:'pointer', color:'#64748b', fontSize:'0.8rem' }}><X size={12}/> Cancel</button>
            </div>
        }
      </div>
      {editing ? renderEdit() : children}
    </div>
  );
}
