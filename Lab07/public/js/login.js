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
    const res=await Lab.request('login','POST',{login,password:Lab.id(isTutor?'tutorPin':'studentPin').value});
    if(isTutor && Lab.id('rememberPhone').checked)localStorage.setItem('lab07.rememberLogin',login);
    else if(isTutor)localStorage.removeItem('lab07.rememberLogin');
    afterLogin(res.user);
  }catch(e){Lab.notice(e.message,true);}finally{btn.disabled=false;}
});
Lab.commands({
  toggleEye:()=>{const pin=Lab.id('tutorPin');pin.type=pin.type==='password'?'text':'password';},
  startForgot:()=>Lab.dialog('Đặt lại mã PIN',[
    {name:'login',label:'Mã đăng nhập',required:true},{name:'recovery_code',label:'Mã khôi phục đã cấp khi đăng ký',required:true},
    {name:'password',label:'Mã PIN mới',type:'password',required:true}
  ],async values=>{await Lab.request('recover','POST',values);Lab.notice('Đã đổi mã PIN. Bạn có thể đăng nhập.');})
});
Lab.on('registerTutor','click',()=>Lab.dialog('Tạo tài khoản gia sư',[
  {name:'name',label:'Tên gia sư',required:true},{name:'login',label:'Mã đăng nhập',required:true},
  {name:'password',label:'Mã PIN / mật khẩu',type:'password',required:true}
],async values=>{
  const res=await Lab.request('register','POST',values);
  const done=Lab.dialog('Lưu mã khôi phục',[],null,'',`<p>Hãy giữ mã này để đặt lại mật khẩu.</p><p><strong>${Lab.escape(res.recovery_code)}</strong></p>`);
  done.addEventListener('close',()=>afterLogin(res.user));
},'Tạo tài khoản'));

