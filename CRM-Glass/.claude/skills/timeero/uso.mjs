// Mede o custo de uma sessao do Claude Code por agente (sessao principal + subagents/*.jsonl).
// Como rodar (sem .jsonl no fim):
//   node .claude/skills/timeero/uso.mjs C:\Users\Eduardo\.claude\projects\<pasta-do-projeto>\<id-da-sessao>
// Pesos do custo efetivo: entrada 1x, cache read 0,1x, cache write 2x, output 5x.
// Use para comparar entregas do /timeero (ver a memoria crmglass-custo-timeero).
import fs from 'fs'; import path from 'path';
const base = process.argv[2];
function uso(file){
  const seen=new Map(); let tools=0;
  for (const l of fs.readFileSync(file,'utf8').split('\n')){ if(!l.trim()) continue; let o; try{o=JSON.parse(l)}catch{continue}
    const m=o.message; if(!m||o.type!=='assistant') continue;
    if (Array.isArray(m.content)) tools+=m.content.filter(c=>c.type==='tool_use').length;
    if(m.usage) seen.set(m.id||Math.random(), m.usage);
  }
  let e={inp:0,cw:0,cr:0,out:0};
  for(const u of seen.values()){e.inp+=u.input_tokens||0;e.cw+=u.cache_creation_input_tokens||0;e.cr+=u.cache_read_input_tokens||0;e.out+=u.output_tokens||0;}
  e.ef=e.inp+2*e.cw+0.1*e.cr+5*e.out; e.calls=seen.size; e.tools=tools; return e;
}
const rows=[];
const main=uso(base+'.jsonl'); rows.push({tipo:'gerente (esta conversa)',desc:'',...main});
const dir=path.join(base,'subagents');
for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.jsonl'))){
  const meta=JSON.parse(fs.readFileSync(path.join(dir,f.replace('.jsonl','.meta.json')),'utf8'));
  rows.push({tipo:meta.agentType,desc:meta.description,...uso(path.join(dir,f))});
}
const tot=rows.reduce((s,r)=>s+r.ef,0);
const por={}; for(const r of rows){por[r.tipo]??={ef:0,n:0,out:0,cr:0,cw:0,tools:0}; const p=por[r.tipo]; p.ef+=r.ef;p.n++;p.out+=r.out;p.cr+=r.cr;p.cw+=r.cw;p.tools+=r.tools;}
console.log('TOTAL efetivo', Math.round(tot));
for(const [k,v] of Object.entries(por).sort((a,b)=>b[1].ef-a[1].ef)) console.log(k.padEnd(26), (v.ef/tot*100).toFixed(1).padStart(5)+'%', 'exec='+v.n, 'tools='+v.tools, 'out='+v.out, 'cacheRead='+v.cr, 'cacheWrite='+v.cw);
console.log('--- por execução');
for(const r of rows.sort((a,b)=>b.ef-a.ef)) console.log((r.ef/tot*100).toFixed(1).padStart(5)+'%', r.tipo.padEnd(20), r.desc.padEnd(40), 'turnos='+r.calls, 'tools='+r.tools, 'out='+r.out, 'cr='+r.cr);
