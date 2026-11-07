/* LSB F252 — capa pública de estado, secciones, videos y botones de programas.
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
  button.program-open[hidden]{display:none!important}
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
  document.head.append(style);

  let stateObserver;
  function paintStatus(status) {
    if (!status || !['open','closed'].includes(status.mode)) return;
    const isOpen = status.mode === 'open';
    const badge = byId('badge'), title = byId('statusTitle'), note = byId('statusNote');
    const text = isOpen ? 'ABIERTO' : 'CERRADO';
    const heading = isOpen ? 'El Liceo se encuentra abierto.' : 'El Liceo se encuentra cerrado.';
    const desc = String(status.note || (isOpen ? 'Puedes comunicarte con nosotros durante el horario de atención.' : 'Consulta el horario de atención para planificar tu visita.'));
    if (badge && badge.textContent !== text) badge.textContent = text;
    if (badge) { badge.style.background = isOpen ? '#dcfaef' : '#ffe8e8'; badge.style.color = isOpen ? '#087650' : '#b43131'; }
    if (title && title.textContent !== heading) title.textContent = heading;
    if (note && note.textContent !== desc) note.textContent = desc;
  }
  function setStatus(status) {
    stateObserver?.disconnect();
    if (!status || status.mode === 'auto') return;
    const nodes = [byId('badge'),byId('statusTitle'),byId('statusNote')].filter(Boolean);
    if (!nodes.length) return;
    paintStatus(status);
    stateObserver = new MutationObserver(() => paintStatus(status));
    nodes.forEach(node => stateObserver.observe(node,{childList:true,subtree:true,characterData:true}));
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
      if(item.body) body.append(el('p','',item.body));card.append(body);
      const image = validLink(item.image);
      if(image){const pic=el('img');pic.src=image;pic.alt=item.title;pic.loading='lazy';card.append(pic)}
      wrap.append(card);
    }
    const anchor = byId('contacto');if(anchor)anchor.before(wrap);else document.body.append(wrap);
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
    if(opt.showPdfDownloads!==true){
      document.querySelectorAll('#programPage .inside-download, #programPage a[download], #programPage a[href*=".pdf"], .program-actions a[download]').forEach(b=>{b.hidden=true;b.style.display='none'});
    }
  }
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
    } catch(error) {
      console.warn('LSB: se conserva el contenido público existente; no se pudo cargar la extensión.',error?.message || error);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();
