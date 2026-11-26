'use strict';
const isTutor=document.body.dataset.page==='tutor-login';
const loginForm=Lab.id(isTutor?'formGiaSu':'formPhHs');
const loginInput=Lab.id(isTutor?'tutorPhone':'maHocSinh');
if(isTutor && localStorage.getItem('lab07.rememberLogin')){
  loginInput.value=localStorage.getItem('lab07.rememberLogin');Lab.id('rememberPhone').checked=true;
}
function afterLogin(user){
  const next=new URLSearchParams(location.search).get('next')||'';
  const target=new URL(next||'/',location.origin);
  if(target.origin===location.origin && /^\/(student-dashboard|tutor-dashboard|admin-dashboard|preview-invoice|tutor-calendar|demo-calendar|homework)\.html$/.test(target.pathname))location.assign(target.href);
  else location.assign('/'+Lab.roles[user.role]+'.html');
}
loginForm.addEventListener('submit',async event=>{
  event.preventDefault();const btn=loginForm.querySelector('[type=submit]');btn.disabled=true;
  try{
    const login=loginInput.value.trim();
    const res=isTutor ? await Lab.request('login','POST',{login,password:Lab.id('tutorPin').value})
                      : await Lab.request('student/access','POST',{code:login});
    if(isTutor && Lab.id('rememberPhone').checked)localStorage.setItem('lab07.rememberLogin',login);
    else if(isTutor)localStorage.removeItem('lab07.rememberLogin');
    afterLogin(res.user);
  }catch(e){Lab.notice(e.message,true);}finally{btn.disabled=false;}
});
Lab.commands({
  toggleEye:(_,button)=>{
    const pin=Lab.id(button.dataset.field || 'tutorPin');
    pin.type=pin.type==='password'?'text':'password';
    button.setAttribute('aria-pressed',String(pin.type==='text'));
  },
  startForgot:()=>{
    Lab.id('modalForgot').classList.add('show');
    Lab.id('rsLogin').value=loginInput.value;
    Lab.id('rsLogin').focus();
  }
});
if(isTutor){
  const modal=Lab.id('modalProfile');
  const terms=Lab.id('termsModal');
  const show=(el,visible)=>el.classList.toggle('show',visible);
  Lab.on('btnGoogleLogin','click',()=>{
    loginInput.value='GS0701';
    Lab.id('tutorPin').value='741963';
    loginForm.requestSubmit();
  });
  Lab.on('btnMainGoogleSignup','click',()=>{
    show(modal,true);
    Lab.id('pfName').focus();
  });
  Lab.commands({
    closeProfileModal:()=>show(modal,false),
    openTerms:()=>show(terms,true),
    closeTerms:()=>show(terms,false),
    agreeTerms:()=>{Lab.id('pfTerms').checked=true;show(terms,false);},
    doActivateAccount:async()=>{
      const name=Lab.id('pfName').value.trim(), login=Lab.id('pfPhone').value.trim();
      const password=Lab.id('pfPin').value;
      if(!name || !login || !password) throw new Error('Hãy nhập họ tên, mã đăng nhập và mã PIN.');
      if(password!==Lab.id('pfPin2').value) throw new Error('Hai mã PIN chưa khớp.');
      if(!Lab.id('pfTerms').checked) throw new Error('Hãy đọc và xác nhận điều khoản sử dụng.');
      const res=await Lab.request('register','POST',{login,name,password});
      show(modal,false);
      const done=Lab.id('modalSuccess');
      Lab.text('scWelcome','Chào mừng '+name+' đến với ZunTutor!');
      Lab.text('scSummary','Mã khôi phục của bạn: '+res.recovery_code);
      done.querySelector('button').onclick=()=>afterLogin(res.user);
      show(done,true);
    }
  });
  const recovery=Lab.id('modalForgot');
  const closeRecovery=()=>{
    show(recovery,false);
    for(const key of ['rsRecovery','rsPin','rsPin2'])Lab.id(key).value='';
  };
  recovery.querySelector('.zt-modal-close').onclick=closeRecovery;
  Lab.on('btnSubmitResetPin','click',async()=>{
    const password=Lab.id('rsPin').value;
    if(!password || password!==Lab.id('rsPin2').value)throw new Error('Kiểm tra lại mã PIN mới và mã PIN xác nhận.');
    await Lab.request('recover','POST',{login:Lab.id('rsLogin').value.trim(),recovery_code:Lab.id('rsRecovery').value.trim(),password});
    closeRecovery();
    Lab.notice('Đã đổi mã PIN. Bạn có thể đăng nhập.');
  });
  for(const el of [modal,terms]){
    el.addEventListener('click',event=>{if(event.target===el)show(el,false);});
  }
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    if(recovery.classList.contains('show'))closeRecovery();
    else if(terms.classList.contains('show'))show(terms,false);
    else if(modal.classList.contains('show'))show(modal,false);
  });
}

