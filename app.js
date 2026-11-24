'use strict';
const $ = id => document.getElementById(id);
const CATEGORIES = ['All','Research','Coding','Maths','News'];
const STORAGE = 'researchtube-v1-state';
const initial = {saved:[],feedback:{},tab:'home',category:'All'};
let state;
try {state={...initial,...JSON.parse(localStorage.getItem(STORAGE)||'{}')};} catch {state={...initial};}
let catalogue=[];
function persist(){try{localStorage.setItem(STORAGE,JSON.stringify(state));}catch(e){console.warn('Storage unavailable',e);}}
function safeUrl(item){return item.type==='video' && /^[\w-]{11}$/.test(item.id) ? `https://www.youtube.com/watch?v=${encodeURIComponent(item.id)}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(item.query||item.title)}`;}
function elt(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
function button(text,cls,fn,aria){const b=elt('button',cls,text);b.type='button';if(aria)b.setAttribute('aria-label',aria);b.addEventListener('click',fn);return b;}
function setTab(tab){state.tab=tab;persist();render();window.scrollTo({top:0,behavior:'smooth'});}
function toggleSaved(id){state.saved=state.saved.includes(id)?state.saved.filter(x=>x!==id):[...state.saved,id];persist();render();}
function feedback(id,value){state.feedback[id]=state.feedback[id]===value?null:value;persist();render();}
function filtered(){const q=$('search').value.trim().toLowerCase();return catalogue.filter(x=>(state.tab!=='saved'||state.saved.includes(x.id))&&(state.tab!=='liked'||state.feedback[x.id]==='useful')&&(state.category==='All'||x.category===state.category)&&(!q||[x.title,x.description,x.channel,...(x.tags||[])].join(' ').toLowerCase().includes(q))&&state.feedback[x.id]!=='irrelevant').sort((a,b)=>(b.score+(state.feedback[b.id]==='useful'?12:0))-(a.score+(state.feedback[a.id]==='useful'?12:0))).slice(0,15);}
function render(){
 $('savedCount').textContent=state.saved.length;$('totalCount').textContent=catalogue.length;
 $('filters').replaceChildren(...CATEGORIES.map(cat=>button(cat,cat===state.category?'selected':'',()=>{state.category=cat;persist();render();})));
 ['home','saved','liked'].forEach(t=>$(t+'Nav').classList.toggle('active',state.tab===t));
 $('sectionName').textContent={home:'For you',saved:'Saved for later',liked:'Marked useful'}[state.tab];
 $('sectionDesc').textContent=state.tab==='home'?'A finite, intentionally selected list.': 'Stored locally on this iPhone.';
 const items=filtered();$('empty').hidden=items.length!==0;
 const cards=items.map(item=>{
  const card=elt('article','card'),art=elt('div','art');
  if(item.type==='video'){const img=elt('img');img.src=`https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;img.alt='Video thumbnail';img.loading='lazy';art.append(img);}else{art.append(elt('span','symbol',({Research:'◈',Coding:'⌘',Maths:'∑',News:'◎'})[item.category]));}
  art.append(elt('span','type',item.type==='video'?'VERIFIED VIDEO':'YOUTUBE TOPIC SEARCH'));card.append(art);
  const body=elt('div','card-body');body.append(elt('div','meta',item.category.toUpperCase()+'  ·  '+item.channel),elt('h3','',item.title),elt('p','',item.description));
  const actions=elt('div','actions');const watch=elt('a','watch',item.type==='video'?'▶ Watch on YouTube ↗':'⌕ Find videos on YouTube ↗');watch.href=safeUrl(item);watch.target='_blank';watch.rel='noopener noreferrer';actions.append(watch);
  actions.append(button(state.saved.includes(item.id)?'♥':'♡',state.saved.includes(item.id)?'small-btn on':'small-btn',()=>toggleSaved(item.id),state.saved.includes(item.id)?'Remove bookmark':'Save bookmark'));body.append(actions);
  const fb=elt('div','feedback');fb.append(elt('span','','Was this useful?'));
  fb.append(button('✓ Useful',state.feedback[item.id]==='useful'?'on':'',()=>feedback(item.id,'useful')));
  fb.append(button('✕ Not for me',state.feedback[item.id]==='irrelevant'?'on':'',()=>feedback(item.id,'irrelevant')));
  body.append(fb);card.append(body);return card;
 });$('cards').replaceChildren(...cards);
}
$('search').addEventListener('input',render);
$('homeNav').addEventListener('click',()=>setTab('home'));
$('savedNav').addEventListener('click',()=>setTab('saved'));
$('likedNav').addEventListener('click',()=>setTab('liked'));
$('settingsBtn').addEventListener('click',()=>$('settings').showModal());
function downloadJSON(filename,data){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);}
$('exportCatalogue').addEventListener('click',()=>downloadJSON('researchtube-catalogue.json',{format:'researchtube-catalogue-v1',note:'Video entries are distinguished from YouTube topic searches. Searches are not vetted recommendations.',items:catalogue}));
$('exportPreferences').addEventListener('click',()=>downloadJSON('researchtube-preferences.json',{format:'researchtube-preferences-v1',exportedAt:new Date().toISOString(),saved:state.saved,feedback:state.feedback}));
$('resetBtn').addEventListener('click',()=>{if(confirm('Clear all relevance feedback? Bookmarks will remain.')){state.feedback={};persist();render();}});
fetch('catalogue.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Cannot load catalogue');return r.json()}).then(data=>{catalogue=data.filter(x=>x.id&&x.title&&x.category&&(x.type==='video'||x.type==='search'));render();}).catch(e=>{$('empty').hidden=false;$('empty').textContent='Catalogue could not be loaded. Please reload the page.';console.error(e)});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(console.warn));
