/* Shared, same-origin client for the Lab07 Flask API. */
'use strict';
const Lab = (() => {
  const id = key => document.getElementById(key);
  const all = selector => [...document.querySelectorAll(selector)];
  const text = (key, value) => { if (id(key)) id(key).textContent = value ?? '—'; };
  const html = (key, value) => { if (id(key)) id(key).innerHTML = value; };
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const live = rows => (rows || []).filter(row => !row.deleted_at);
  const money = n => new Intl.NumberFormat('vi-VN', {style:'currency',currency:'VND'}).format(Number(n)||0);
  const iso = (dt = new Date()) => [dt.getFullYear(), String(dt.getMonth()+1).padStart(2,'0'), String(dt.getDate()).padStart(2,'0')].join('-');
  const month = () => iso().slice(0,7);
  const date = str => str ? String(str).slice(0,10).split('-').reverse().join('/') : '—';
  const empty = (label='Chưa có dữ liệu.') => `<p class="lab-empty">${escape(label)}</p>`;
  const btn = (action, label, key='', primary=false) => `<button type="button" class="${primary?'lab-btn':'lab-action'}" data-command="${escape(action)}" data-key="${escape(key)}">${escape(label)}</button>`;
  const item = (title,detail='',actions='') => `<article class="lab-item"><strong>${escape(title)}</strong>${detail}${actions?`<div class="lab-actions">${actions}</div>`:''}</article>`;
  const section = (title,body) => `<section class="lab-section"><h2>${escape(title)}</h2>${body}</section>`;
  const invoice = (student,period='') => `<a class="lab-action" href="/preview-invoice.html?id=${Number(student)}&amp;month=${encodeURIComponent(period)}">Xem hóa đơn</a>`;
  const files = list => (list || []).map(f => `<span><a class="lab-file" href="/api/files/${Number(f.id)}" target="_blank" rel="noopener">${escape(f.name)}</a><a class="lab-action" aria-label="Tải ${escape(f.name)}" href="/api/files/${Number(f.id)}?download=1">Tải</a></span>`).join(' ');
  async function request(path, method='GET', data) {
    const options = {method, credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}};
    if (data instanceof FormData) options.body=data;
    else if (data !== undefined) {options.headers['Content-Type']='application/json';options.body=JSON.stringify(data);}
    let response;
    try {response=await fetch('/api/'+path, options);}
    catch {throw new Error('Mất kết nối với máy chủ Lab07. Hãy thử lại.');}
    const result=await response.json().catch(()=>({}));
    if(!response.ok){const e=new Error(result.error || result.message || 'Không thể hoàn tất thao tác.');e.status=response.status;throw e;}
    return result;
  }
  function notice(message, error=false) {
    id('labNotice')?.remove();const el=document.createElement('p');el.id='labNotice';el.className='lab-notice';el.setAttribute('role',error?'alert':'status');el.textContent=message;document.body.append(el);
    setTimeout(()=>el.remove(),6000);
  }
  function guard(fn) { return async event => {try{await fn(event);}catch(e){notice(e.message,true);}}; }
  const on = (key,ev,fn) => id(key)?.addEventListener(ev,guard(fn));
  function commands(map) {
    document.addEventListener('click',guard(async e=>{
      const el=e.target.closest('[data-command],[data-original-action]');if(!el)return;
      const fn=map[el.dataset.command || el.dataset.originalAction];if(fn){e.preventDefault();await fn(el.dataset.key,el);}
    }));
  }
  function buildField(f) {
    const label=escape(f.label), n=escape(f.name);
    const attrs=`name="${n}" ${f.required?'required':''} ${f.multiple?'multiple':''} ${f.min!==undefined?`min="${escape(f.min)}"`:''} ${f.max!==undefined?`max="${escape(f.max)}"`:''} ${f.step!==undefined?`step="${escape(f.step)}"`:''}`;
    let control;
    if(f.options) control=`<select ${attrs}>${f.options.map(([v,t])=>`<option value="${escape(v)}" ${String(v)===String(f.value)?'selected':''}>${escape(t)}</option>`).join('')}</select>`;
    else if(f.type==='textarea') control=`<textarea ${attrs}>${escape(f.value)}</textarea>`;
    else control=`<input type="${escape(f.type || 'text')}" ${attrs} ${f.type==='file'?'':`value="${escape(f.value)}"`}>`;
    return `<label>${label}${control}</label>`;
  }
  function dialog(title, fields, submit, label='Lưu', detail='') {
    const el=document.createElement('dialog');el.className='lab-dialog';el.setAttribute('aria-label',title);
    el.innerHTML=`<h2>${escape(title)}</h2>${detail}<form>${fields.map(buildField).join('')}<p class="lab-error" role="alert" hidden></p><menu><button class="lab-action" type="button">Đóng</button>${submit?`<button class="lab-btn">${escape(label)}</button>`:''}</menu></form>`;
    document.body.append(el);el.addEventListener('close',()=>el.remove());el.querySelector('button[type=button]').onclick=()=>el.close();
    el.querySelector('form').onsubmit=async event=>{
      event.preventDefault();if(!submit)return;const form=event.currentTarget, button=form.querySelector('.lab-btn');button.disabled=true;
      const status=form.querySelector('.lab-error');status.hidden=true;
      try {const data=new FormData(form);await submit(Object.fromEntries(data),data);el.close();}
      catch(e){status.textContent=e.message;status.hidden=false;}
      finally {button.disabled=false;}
    };el.showModal();return el;
  }
  let chartInstances=new Map();
  function chart(key,type,labels,datasets,options={}) {
    const canvas=id(key);if(!canvas || !window.Chart)return;
    chartInstances.get(key)?.destroy();
    chartInstances.set(key,new Chart(canvas,{type,data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,animation:false,plugins:{legend:{display:type!=='doughnut'}},...options}}));
    return chartInstances.get(key);
  }
  const roles={student:'student-dashboard',tutor:'tutor-dashboard',admin:'admin-dashboard',homework:'homework'};
  async function dashboard(allow) {
    try {
      const data=await request('dashboard');
      if(!allow.includes(data.user.role)) {location.replace('/'+(roles[data.user.role]||'tutor-login')+'.html');return null;}
      return data;
    } catch(e){if(e.status!==401)throw e;
      const login=allow.includes('student')?'student-login':'tutor-login';
      location.replace('/'+login+'.html?next='+encodeURIComponent(location.pathname.slice(1)+location.search));return null;
    }
  }
  const theme = name => {document.documentElement.className=/^theme-[\w-]+$/.test(name||'')?name:'theme-soft-blue-white-full';};
  return {id,all,text,html,escape,live,money,iso,month,date,empty,btn,item,section,invoice,files,request,notice,guard,on,commands,dialog,buildField,chart,dashboard,roles,theme};
})();
