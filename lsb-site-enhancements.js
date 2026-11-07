/* LSB F254 — capa pública de estado, secciones, videos y botones de programas.
   Lee ÚNICAMENTE la publicación pública de Supabase; no requiere ni almacena credenciales administrativas. */
(() => {
  'use strict';
  const validLink = (u) => {
    if (typeof u !== 'string') return '';
    try {
      const x = new URL(u, location.href);
      return ['https:', 'http:'].includes(x.protocol) ? x.href : '';
    } catch { return ''; }
  };
  const byId = (id) => document.getElementById(id);
  const isVideo = item => item && (item.type === 'video' || /\.(mp4|webm)(?:[?#]|$)/i.test(item.url || ''));
  const el = (tag, className, txt) => {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (txt !== undefined) n.textContent = String(txt);
    return n;
  };
  const style = el('style');
  style.id = 'lsb-f252-public-style';
  style.textContent = `
  button.program-open[hidden],.inside-download[hidden],.program-pdf[hidden],.fake-download[hidden]{display:none!important}
  #inicio[hidden],#oferta[hidden],#identidad[hidden],#horario[hidden],#galeria[hidden],#noticias[hidden],#llegar[hidden],#contacto[hidden],a[hidden]{display:none!important}
  .lsb-f252-videos,.lsb-f252-extras{width:min(1120px,calc(100% - 32px));margin:30px auto;padding:8px 0 20px}
  .lsb-f252-videos h3,.lsb-f252-extras h2{font-size:clamp(24px,4vw,33px);letter-spacing:-.04em;color:#26316f;margin:14px 0 22px}
  .lsb-f252-video-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(270px,100%),1fr));gap:18px}
  .lsb-f252-video-card{overflow:hidden;background:white;border:1px solid #e0e6f4;border-radius:21px;box-shadow:0 12px 32px rgba(30,40,90,.075)}
  .lsb-f252-video-card video{display:block;width:100%;aspect-ratio:16/9;background:#19233d;object-fit:contain}
  .lsb-f252-video-card strong{display:block;padding:14px 17px;color:#252e62}.lsb-f252-video-card p{padding:0 17px 16px;color:#5d6d88;margin:0}
  .lsb-f252-extra-card{margin:0 0 22px;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:center;gap:25px;border-radius:26px;border:1px solid #e0e6f4;background:linear-gradient(125deg,#f2f4ff,#fff);padding:clamp(21px,4vw,34px)}
  .lsb-f252-extra-card:not(:has(img)){grid-template-columns:1fr}.lsb-f252-extra-card img{max-height:350px;width:100%;object-fit:cover;border-radius:18px}
  .lsb-f252-extra-card p{font-size:16px;line-height:1.75;white-space:pre-line;color:#54617d}
  @media(max-width:720px){.lsb-f252-extra-card{grid-template-columns:1fr}.lsb-f252-video-grid{grid-template-columns:1fr}}
  `;
  style.textContent+=`
.lsb-f254-contact-public{padding:18px 20px;border:1px solid #e5e9f3;border-radius:19px;background:#fff;width:min(100%,1050px);margin:22px auto;}
.lsb-f254-contact-public h3{color:#3b4193;margin:0 0 14px;font-size:20px}.lsb-f254-links{display:flex;gap:10px;flex-wrap:wrap}.lsb-f254-links a{background:#f1f5ff;border:1px solid #dce2f4;border-radius:11px;padding:12px 16px;color:#253577;font-weight:750;text-decoration:none}.lsb-f254-links a:hover{background:#e3f8f8}.lsb-f254-extra-btn{display:inline-flex;margin-top:16px;background:#3b4193;color:#fff!important;padding:11px 19px;border-radius:11px;font-weight:800;text-decoration:none}
`;
  document.head.append(style);

  // Horarios editables: varias jornadas por día y fechas extraordinarias.
  let stateObserver, statusInterval;
  const dayNames=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const formatClock=(value)=>{const m=String(value).match(/^(\d{2}):(\d{2})$/);if(!m)return String(value);const h=+m[1];return (h%12||12)+':'+m[2]+(h<12?' a. m.':' p. m.');};
  const slotsOf=(items)=>Array.isArray(items)?items.map(x=>Array.isArray(x)?{open:x[0],close:x[1]}:x).filter(x=>x&&/^\d{2}:\d{2}$/.test(x.open)&&/^\d{2}:\d{2}$/.test(x.close)&&x.open<x.close).sort((a,b)=>a.open.localeCompare(b.open)):[];
  const slotsText=(slots)=>slots.length?slots.map(x=>formatClock(x.open)+' – '+formatClock(x.close)).join(' · '):'Cerrado';
  function nowGuatemala(){
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Guatemala',year:'numeric',month:'2-digit',day:'2-digit',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
    const obj=Object.fromEntries(parts.map(p=>[p.type,p.value]));const map={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};return {weekday:map[obj.weekday],date:obj.year+'-'+obj.month+'-'+obj.day,time:obj.hour+':'+obj.minute};
  }
  function paintStatus(status){
    const badge=byId('badge'), title=byId('statusTitle'), note=byId('statusNote');
    if(!status || !badge || !title || !note)return;
    const mode=status.mode||'auto',manual=mode==='open'||mode==='closed';
    if(!manual && !status.schedule)return; // Conserva el modo original si todavía no se configuró un horario.
    let open=false,desc='',heading='';
    const g=nowGuatemala();let todaySlots=[];
    if(manual){
      open=mode==='open';desc=String(status.note||'').trim()||(open?'Puedes comunicarte con nosotros durante el horario de atención.':'Consulta nuestros horarios para planificar tu visita.');
    }else{
      const schedule=status.schedule||{};
      const special=Array.isArray(status.specialDates)?status.specialDates.find(s=>s.date===g.date):null;
      todaySlots=slotsOf(special?special.slots:schedule[dayNames[g.weekday]]);
      const range=todaySlots.find(s=>g.time>=s.open&&g.time<s.close);
      open=Boolean(range);
      if(range)desc='Atendemos hasta las '+formatClock(range.close)+'.';
      else{const upcoming=todaySlots.find(s=>g.time<s.open);desc=upcoming?'Abriremos hoy a las '+formatClock(upcoming.open)+'.':'No hay más atención programada para hoy.';}
      desc+=' Horario de hoy: '+slotsText(todaySlots)+'.';
      if(special)desc='Horario especial. '+desc;
      if(status.note && String(status.note).trim())desc=String(status.note).trim();
      const rows=[...document.querySelectorAll('#horario .day')];
      rows.forEach((row,i)=>{const key=dayNames[(i+1)%7];const slot=slotsOf(schedule[key]);
        const cell=row.querySelector('span');if(cell){const value=slotsText(slot);if(cell.textContent!==value)cell.textContent=value;}
        row.classList.toggle('hoy',i===((g.weekday+6)%7));
      });
    }
    heading=open?'El Liceo se encuentra abierto.':'El Liceo se encuentra cerrado.';
    const nextBadge=open?'ABIERTO':'CERRADO';if(badge.textContent!==nextBadge)badge.textContent=nextBadge;
    badge.style.background=open?'#dcfaef':'#ffe8e8';badge.style.color=open?'#087650':'#b43131';
    if(title.textContent!==heading)title.textContent=heading;
    if(note.textContent!==desc)note.textContent=desc;
  }
  function setStatus(status){
    stateObserver?.disconnect();if(statusInterval)clearInterval(statusInterval);
    if(!status || status.mode==='auto' && !status.schedule)return;
    const nodes=[byId('badge'),byId('statusTitle'),byId('statusNote')].filter(Boolean);
    if(!nodes.length)return;
    let busy=false;const repaint=()=>{if(busy)return;busy=true;try{paintStatus(status)}finally{busy=false}};
    repaint();stateObserver=new MutationObserver(repaint);
    nodes.forEach(node=>stateObserver.observe(node,{childList:true,subtree:true,characterData:true}));
    statusInterval=setInterval(repaint,30000);
  }
  function setVisibility(cfg) {
    const hidden = cfg.sectionVisibility || {};
    const mapped = ['inicio','oferta','identidad','horario','galeria','noticias','llegar','contacto'];
    mapped.forEach(id => { const target = byId(id); if (target) target.hidden = hidden[id] === false; });
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      const id = a.getAttribute('href')?.slice(1);
      if (mapped.includes(id)) a.hidden = hidden[id] === false;
    });
  }
  function filterGalleryVideoCards(){
    const g=window.LSB_PUBLIC_GALLERY;
    if(!g?.items?.some(isVideo))return;
    g.items=g.items.filter(x=>!isVideo(x));
    window.dispatchEvent(new Event('lsb-gallery-update'));
  }
  window.addEventListener('lsb-gallery-update',filterGalleryVideoCards);
  function setVideos(gallery) {
    const parent = byId('galeria');
    if (!parent) return;
    parent.querySelector('#lsb-f252-videos')?.remove();
    const videos = (gallery?.items || []).filter(x => x?.published !== false && isVideo(x) && validLink(x.url));
    if (!videos.length) return;
    const section = el('section','lsb-f252-videos');section.id = 'lsb-f252-videos';
    section.append(el('h3','','Videos institucionales'));
    const grid = el('div','lsb-f252-video-grid');section.append(grid);
    for (const item of videos) {
      const card = el('article','lsb-f252-video-card');
      const video = el('video');video.src = validLink(item.url);video.controls = true;video.preload = 'metadata';video.playsInline = true;
      card.append(video, el('strong','',item.title || 'Video institucional'));
      if (item.desc) card.append(el('p','',item.desc));grid.append(card);
    }
    parent.append(section);
    // El carrusel original solo acepta imágenes; excluimos los videos de sus tarjetas.
    filterGalleryVideoCards();
  }
  function setCustomSections(cfg) {
    document.getElementById('lsb-f252-custom')?.remove();
    const items = Array.isArray(cfg.customSections) ? cfg.customSections : [];
    const good = items.filter(x=>x && String(x.title||'').trim());
    if (!good.length) return;
    const wrap = el('section','lsb-f252-extras');wrap.id = 'lsb-f252-custom';
    for(const item of good){
      const card = el('article','lsb-f252-extra-card');
      const body = el('div');body.append(el('h2','',item.title));
      if(item.body) body.append(el('p','',item.body));const buttonUrl=validLink(item.buttonUrl);if(buttonUrl&&item.buttonText){const link=el('a','lsb-f254-extra-btn',item.buttonText);link.href=buttonUrl;link.target='_blank';link.rel='noopener noreferrer';body.append(link)}card.append(body);
      const image = validLink(item.image);
      if(image){const pic=el('img');pic.src=image;pic.alt=item.title;pic.loading='lazy';card.append(pic)}
      wrap.append(card);
    }
    const anchor = byId('contacto');if(anchor)anchor.before(wrap);else document.body.append(wrap);
  }

  function setContactAndRoutes(cfg){
    byId('lsb-f254-contacts')?.remove();byId('lsb-f254-routes')?.remove();
    const contacts=cfg.contactExtras||{}, phones=Array.isArray(contacts.phones)?contacts.phones:[], socials=Array.isArray(contacts.socials)?contacts.socials:[];
    const contactHost=byId('contacto');
    if(contactHost && (phones.some(x=>x.number)||socials.some(x=>x.name&&x.url))){
      const pane=el('div','lsb-f254-contact-public');pane.id='lsb-f254-contacts';pane.append(el('h3','','Otros medios de contacto'));
      const links=el('div','lsb-f254-links');pane.append(links);
      for(const phone of phones){const digit=String(phone.number||'').replace(/[^0-9]/g,'');if(digit.length<8||digit.length>15)continue;
       const label=String(phone.display||phone.number);const n=phone.whatsapp===false?null:el('a','','WhatsApp · '+label);if(n){n.href='https://wa.me/'+(digit.length===8?'502'+digit:digit);n.target='_blank';n.rel='noopener noreferrer';links.append(n)}
       if(phone.call!==false){const a=el('a','','Llamar · '+label);a.href='tel:+'+(digit.length===8?'502'+digit:digit);links.append(a)}
      }
      for(const social of socials){const link=validLink(social.url);if(!link||!String(social.name||'').trim())continue;const a=el('a','',social.name);a.href=link;a.target='_blank';a.rel='noopener noreferrer';links.append(a)}
      contactHost.append(pane);
    }
    const mainNum=String(contacts.primaryWhatsapp||'').replace(/\D/g,'');
    if(mainNum.length>=8&&mainNum.length<=15){const target=document.querySelector('#contacto a[href*="wa.me/"]');if(target){target.href='https://wa.me/'+(mainNum.length===8?'502'+mainNum:mainNum)}}
    const placeHost=byId('llegar'),places=Array.isArray(cfg.routeExtras)?cfg.routeExtras:[];
    if(placeHost && places.some(x=>x.name&&x.mapsUrl)){
      const pane=el('div','lsb-f254-contact-public');pane.id='lsb-f254-routes';pane.append(el('h3','','Otros puntos de referencia'));const links=el('div','lsb-f254-links');pane.append(links);
      for(const item of places){const url=validLink(item.mapsUrl);if(!url||!String(item.name||'').trim())continue;const a=el('a','',item.name);a.href=url;a.rel='noopener noreferrer';a.target='_blank';links.append(a)}
      placeHost.append(pane);
    }
  }

  function setPrograms(cfg) {
    const opt = cfg.programOptions || {};
    const mode = opt.showProgramButtons || 'auto';
    document.querySelectorAll('button.program-open').forEach(button=>{
      const name = button.dataset.program || '';
      const p = cfg.programs?.[name] || {};
      const hasInfo = ['description','study','observation'].some(k=>typeof p[k]==='string'&&p[k].trim().length>0);
      const hasDocument = !!(cfg.documents?.[name]);
      button.hidden = mode==='none' || (mode==='auto' && !hasInfo && !hasDocument) || opt.hiddenPrograms?.[name]===true;
    });
    const downloadsAllowed=opt.showPdfDownloads===true;
    document.querySelectorAll('.inside-download, .program-pdf, .fake-download, .program-download, #programPage a[download], #programPage a[href*=".pdf"], .program-actions a[download], .download-success').forEach(b=>{
      if(!downloadsAllowed){b.hidden=true;b.style.display='none';}
      else if(!b.classList.contains('download-success')){b.hidden=false;b.style.removeProperty('display');}
    });
  }
  // F253: «Atrás» cierra primero la ficha que está abierta antes de salir del sitio.
  function installProgramBack(){
    const program=byId('programPage');
    if(!program)return;
    let inHistory=false;
    document.querySelectorAll('.program-open').forEach(button=>button.addEventListener('click',()=>{
      if(button.hidden)return;
      history.pushState({lsbPublicProgram:true},'',location.pathname+location.search+'#programa');inHistory=true;
    }));
    function closeViaHistory(){if(inHistory&&history.state?.lsbPublicProgram){history.back();}else{program.hidden=true;program.style.display='none';document.body.style.overflow='';}}
    for(const id of ['programBack','programClose']){
      byId(id)?.addEventListener('click',closeViaHistory,{capture:true});
    }
    window.addEventListener('popstate',event=>{
      if(event.state?.lsbPublicProgram)return;
      inHistory=false;
      if(!program.hidden){program.hidden=true;program.style.display='none';document.body.style.overflow=''}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installProgramBack,{once:true});else installProgramBack();
  async function load() {
    const cfg=window.LSB_SITE_BACKEND;
    if (!cfg?.url || !cfg.publishableKey) return;
    try {
      const url=cfg.url+'/rest/v1/lsb_site_content?select=data&id=eq.published&limit=1';
      const response=await fetch(url,{headers:{apikey:cfg.publishableKey,Accept:'application/json'},cache:'no-store'});
      if(!response.ok)throw new Error('HTTP '+response.status);
      const value=(await response.json())?.[0]?.data;
      if (!value || typeof value!=='object') return;
      setStatus(value.siteStatus);
      setVisibility(value);
      setVideos(value.gallery);
      setCustomSections(value);
      setPrograms(value);
      setContactAndRoutes(value);
    } catch(error) {
      console.warn('LSB: se conserva el contenido público existente; no se pudo cargar la extensión.',error?.message || error);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();
