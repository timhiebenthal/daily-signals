'use strict';
const labels = {caffeine:'Caffeine',alcohol:'Alcohol',meal:'Meal',late_meal:'Late meal',stress:'Stress',frustration:'Frustration',itch_intensity:'Itch intensity',skin_severity:'Skin condition',other:'Other'};
const $ = id => document.getElementById(id);
const form = $('event-form'); let selected, editing = null, originalTime = '', originalInstant = '';
const say = message => $('message').textContent = message;
const localTime = date => { const d = new Date(date); const pad = x => String(x).padStart(2,'0'); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const scoreInput = form.elements.score;
function selectScore() { scoreInput.setCustomValidity(''); $('score-value').textContent = scoreInput.value; }
scoreInput.addEventListener('input', selectScore);
scoreInput.addEventListener('pointerdown', selectScore);
scoreInput.addEventListener('keydown', event => { if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(event.key)) selectScore(); });
const icons = {
  caffeine:'M2 21h18v-2H2v2zM20 8h-1V5H3v9c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4v-1h1c1.66 0 3-1.34 3-3s-1.34-3-3-3zm0 4h-1V9h1a1.5 1.5 0 0 1 0 3z',
  alcohol:'M21 4H3l7 8.5V19H6v2h12v-2h-4v-6.5L21 4zm-4.25 2L12 11.77 7.25 6h9.5z',
  meal:'M8.1 13.34 5.27 16.17l-1.41-1.41 2.83-2.83L2 7.24l1.41-1.41L8.1 10.52l1.41-1.41-4.69-4.7L6.24 3l4.69 4.69c1.56 1.56 1.56 4.09 0 5.65l-6.7 6.7-1.42-1.41 5.29-5.29zM15 3c-1.6 1.6-2.4 5.4 0 7.8l1.3 1.3-5.5 5.5 1.4 1.4L21 10.2 15 3z',
  late_meal:'M12 2a10 10 0 1 0 10 10 8 8 0 0 1-10-10zm0 18a8 8 0 0 1-2.3-15.67A10 10 0 0 0 19.67 14.3 8 8 0 0 1 12 20z',
  stress:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zM8.5 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm7 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM7.5 17c.8-2 2.5-3 4.5-3s3.7 1 4.5 3H7.5z',
  frustration:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zM7 8l3 1-1 1.5-3-1L7 8zm10 0 1 1.5-3 1L14 9l3-1zm-9 8h8v-2H8v2z',
  itch_intensity:'M12 2C9.5 5.5 6 9.1 6 13a6 6 0 1 0 12 0c0-3.9-3.5-7.5-6-11zm0 18a7 7 0 0 1-7-7c0-4.5 4.2-9 7-13 2.8 4 7 8.5 7 13a7 7 0 0 1-7 7z',
  skin_severity:'M12 3c4.42 0 8 3.58 8 8 0 4.42-3.58 8-8 8s-8-3.58-8-8c0-4.42 3.58-8 8-8zm0-2C6.48 1 2 5.48 2 11s4.48 10 10 10 10-4.48 10-10S17.52 1 12 1zm-3 7a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm6 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-5 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
  other:'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z'
};
for (const type of Model.types) { const button = document.createElement('button'); button.type='button'; button.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[type]}"></path></svg><span></span>`; button.querySelector('span').textContent=labels[type]; button.addEventListener('click',()=>start(type)); $('types').append(button); }
function start(type,event=null) {
  selected=type; editing=event; form.reset(); form.hidden=false; $('form-title').textContent=(event ? 'Edit ' : 'Log ')+labels[type];
  $('score-label').hidden=!Model.scores.includes(type); $('quantity-fields').hidden=!['caffeine','alcohol','other'].includes(type); $('description-label').hidden=type!=='other';
  form.elements.description.required=type==='other';
  scoreInput.setCustomValidity(Model.scores.includes(type) && !event ? 'Choose a score using the slider.' : '');
  $('score-value').textContent=event && Model.scores.includes(type) ? event.value : 'Choose a score';
  originalInstant=event ? event.occurred_at : new Date().toISOString(); originalTime=localTime(originalInstant); form.elements.occurred_at.value=originalTime;
  if(event){ form.elements.description.value=event.description || ''; if (Model.scores.includes(type)) scoreInput.value=event.value; form.elements.value.value=event.value ?? ''; form.elements.unit.value=event.unit || ''; form.elements.notes.value=event.notes || ''; }
  form.scrollIntoView({behavior:'smooth',block:'nearest'}); say('');
}
$('cancel').onclick=()=>{form.hidden=true; editing=null;};
form.onsubmit=async e=>{ e.preventDefault(); try {
  const now=new Date(Math.max(Date.now(), editing ? Date.parse(editing.updated_at)+1 : 0)).toISOString(); const score=Model.scores.includes(selected); const quantity=['caffeine','alcohol','other'].includes(selected); const raw=form.elements.value.value;
  const event={event_id:editing?.event_id || crypto.randomUUID(),event_type:selected,occurred_at:form.elements.occurred_at.value===originalTime ? originalInstant : new Date(form.elements.occurred_at.value).toISOString(),created_at:editing?.created_at || now,updated_at:now,value:score ? Number(form.elements.score.value) : quantity && raw!=='' ? Number(raw) : null,unit:score ? 'score_0_10' : quantity ? form.elements.unit.value.trim() || null : null,notes:form.elements.notes.value.trim() || null,description:selected==='other' ? form.elements.description.value.trim() : null,deleted_at:null};
  await Store.put(event); form.hidden=true; editing=null; say('Event saved.'); await render();
} catch(error){say(`Could not save: ${error.message}`);} };
async function render(){ try {const events=(await Store.all()).sort((a,b)=>Date.parse(b.occurred_at)-Date.parse(a.occurred_at)); const history=$('history'); history.replaceChildren(); const visible=events.filter(e=>!e.deleted_at || $('show-deleted').checked); if(!visible.length){history.textContent='No events yet.'; return;} for(const e of visible){const item=document.createElement('article'); item.className='event'+(e.deleted_at?' deleted':''); const title=document.createElement('strong'); title.textContent=labels[e.event_type]+(e.deleted_at?' · Deleted':''); const detail=document.createElement('p'); detail.textContent=[e.description,e.value!==null ? `${e.value}${e.unit && e.unit!=='score_0_10'?' '+e.unit:''}` : null,e.notes].filter(Boolean).join(' · '); const time=document.createElement('p'); time.className='muted'; time.textContent=localTime(e.occurred_at).replace('T',' '); const content=document.createElement('div'); content.className='event-content'; content.append(title,detail,time); item.append(content); if(!e.deleted_at){const actions=document.createElement('div'); actions.className='event-actions'; for(const [label,fn] of [['Edit',()=>start(e.event_type,e)],['Delete',async()=>{if(!confirm('Delete this event? It will remain in backups as deleted.'))return; try{const now=new Date(Math.max(Date.now(), Date.parse(e.updated_at)+1)).toISOString(); await Store.put({...e,updated_at:now,deleted_at:now}); say('Event deleted.'); await render();}catch(err){say(`Could not delete: ${err.message}`);}}]]){const b=document.createElement('button');b.type='button';b.className='icon-button';b.setAttribute('aria-label',`${label} ${labels[e.event_type]}`);b.title=label;b.innerHTML=label==='Edit' ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.04a1 1 0 0 0 0-1.41l-2.5-2.5a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.99-1.67z"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';b.onclick=fn;actions.append(b);} item.append(actions);}history.append(item);} }catch(error){say(`Could not load events: ${error.message}`);} }
$('show-deleted').onchange=render;
async function backupFile(){const data=JSON.stringify({schema_version:1,events:await Store.all()},null,2);return new File([data],`daily-signals-${new Date().toISOString().slice(0,10)}.json`,{type:'application/json'});}
$('export').onclick=async()=>{try{const file=await backupFile();const url=URL.createObjectURL(file);const a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);say('Backup downloaded.');}catch(e){say(`Could not export: ${e.message}`);}};
if(navigator.share && navigator.canShare){$('share').hidden=false;$('share').onclick=async()=>{try{const file=await backupFile();if(!navigator.canShare({files:[file]})) throw Error('File sharing is unavailable. Use Download instead.');await navigator.share({files:[file],title:'Daily Signals backup'});say('Backup shared.');}catch(e){if(e.name!=='AbortError')say(`Could not share: ${e.message}`);}};}
$('import').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;const result=await Store.merge(JSON.parse(await file.text()));say(`Import complete: ${result.inserted} added, ${result.updated} updated, ${result.skipped} unchanged or older.`);await render();}catch(error){say(`Import failed; no events changed: ${error.message}`);}finally{e.target.value='';}};
render();
if('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(()=>say('Offline installation failed. Reopen the app while online.'));
