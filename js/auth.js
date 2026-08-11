/* ================= NOTHINGBUH FABRICS — auth.js ================= */
(function () {
"use strict";
var sb = window.sb || null;
var money = function (n){ return "\u20a6"+Number(n||0).toLocaleString("en-NG"); };

function msg(box, type, text){ if(!box)return; box.className="msg "+type; box.textContent=text; box.classList.remove("hide"); }
function needSupabase(box){
  if(!sb){ msg(box,"err","Accounts go live once Supabase is connected (edit js/config.js). Everything else works on demo data."); return true; }
  return false;
}
window.togglePw = function(btn,id){ var f=document.getElementById(id); var s=f.type==="password"; f.type=s?"text":"password"; btn.textContent=s?"Hide":"Show"; };

/* ---------- REGISTER ---------- */
window.doRegister = async function(e){ e.preventDefault();
  var f=e.target, box=document.getElementById("authMsg");
  var name=f.full_name.value.trim(), email=f.email.value.trim(), phone=f.phone.value.trim(),
      pw=f.password.value, pw2=f.confirm.value;
  if(pw!==pw2){ msg(box,"err","Passwords don't match."); return false; }
  if(pw.length<6){ msg(box,"err","Use at least 6 characters for your password."); return false; }
  if(needSupabase(box)) return false;
  var btn=f.querySelector("button[type=submit]"); btn.disabled=true; btn.textContent="Creating\u2026";
  try{
    var r=await sb.auth.signUp({ email:email, password:pw, options:{ data:{ full_name:name, phone:phone } } });
    if(r.error){ msg(box,"err",r.error.message); btn.disabled=false; btn.textContent="Create Account"; return false; }
    msg(box,"ok","Account created. Check your email to confirm, then sign in.");
    setTimeout(function(){ location.href="/login"; }, 2200);
  }catch(err){ msg(box,"err","Something went wrong. Try again."); btn.disabled=false; btn.textContent="Create Account"; }
  return false;
};

/* ---------- LOGIN ---------- */
window.doLogin = async function(e){ e.preventDefault();
  var f=e.target, box=document.getElementById("authMsg");
  if(needSupabase(box)) return false;
  var btn=f.querySelector("button[type=submit]"); btn.disabled=true; btn.textContent="Signing in\u2026";
  try{
    var r=await sb.auth.signInWithPassword({ email:f.email.value.trim(), password:f.password.value });
    if(r.error){ msg(box,"err",r.error.message); btn.disabled=false; btn.textContent="Sign In"; return false; }
    location.href="/";
  }catch(err){ msg(box,"err","Something went wrong. Try again."); btn.disabled=false; btn.textContent="Sign In"; }
  return false;
};
window.doGoogle = async function(){ var box=document.getElementById("authMsg"); if(needSupabase(box))return false;
  try{ await sb.auth.signInWithOAuth({ provider:"google", options:{ redirectTo: location.origin+"/" } }); }
  catch(e){ msg(box,"err","Google sign-in isn't enabled yet. Enable it in Supabase > Authentication > Providers."); }
  return false;
};

/* ---------- FORGOT ---------- */
window.doForgot = async function(e){ e.preventDefault();
  var f=e.target, box=document.getElementById("authMsg");
  if(needSupabase(box)) return false;
  var btn=f.querySelector("button[type=submit]"); btn.disabled=true; btn.textContent="Sending\u2026";
  try{
    var r=await sb.auth.resetPasswordForEmail(f.email.value.trim(), { redirectTo: location.origin+"/reset-password" });
    if(r.error){ msg(box,"err",r.error.message); } else { msg(box,"ok","Check your email for a reset link."); }
  }catch(err){ msg(box,"err","Something went wrong."); }
  btn.disabled=false; btn.textContent="Send Reset Link"; return false;
};

/* ---------- ACCOUNT DASHBOARD ---------- */
window.initAccount = async function(){
  if(!sb){ document.getElementById("acctRoot").innerHTML=
    '<div style="padding:60px var(--pad);text-align:center"><h1 class="serif" style="font-size:2rem;margin-bottom:10px">Accounts go live with Supabase</h1>'+
    '<p style="color:var(--taupe-deep);max-width:46ch;margin:0 auto 20px">Add your Supabase URL and anon key in <b>js/config.js</b>, run <b>sql/schema.sql</b>, and this becomes a full customer dashboard \u2014 orders, wishlist and addresses.</p>'+
    '<a href="/login" class="btn btn-dark">Go To Sign In</a></div>'; return; }
  var u=(await sb.auth.getUser()).data.user;
  if(!u){ location.href="/login"; return; }
  var prof={}; try{ var pr=await sb.from("profiles").select("*").eq("id",u.id).single(); if(!pr.error)prof=pr.data; }catch(e){}
  renderAccount(u, prof); loadOrders(u); loadAddresses(u);
};
function renderAccount(u, prof){
  document.getElementById("acctName").textContent=(prof.full_name||"there").split(" ")[0];
  var pf=document.getElementById("acctProfile");
  if(pf){ pf.full_name.value=prof.full_name||""; pf.phone.value=prof.phone||""; pf.email.value=u.email||""; }
}
window.saveProfile = async function(e){ e.preventDefault(); var f=e.target, box=document.getElementById("acctMsg");
  try{ var u=(await sb.auth.getUser()).data.user;
    await sb.from("profiles").update({ full_name:f.full_name.value, phone:f.phone.value }).eq("id",u.id);
    msg(box,"ok","Profile updated."); }catch(err){ msg(box,"err","Could not save."); } return false;
};
window.changePw = async function(e){ e.preventDefault(); var f=e.target, box=document.getElementById("pwMsg");
  if(f.pw.value.length<6){ msg(box,"err","Use at least 6 characters."); return false; }
  try{ var r=await sb.auth.updateUser({ password:f.pw.value }); if(r.error){msg(box,"err",r.error.message);} else {msg(box,"ok","Password changed."); f.reset();} }
  catch(err){ msg(box,"err","Could not change password."); } return false;
};
async function loadOrders(u){
  var box=document.getElementById("acctOrders"); if(!box)return;
  try{ var r=await sb.from("orders").select("*").eq("user_id",u.id).order("created_at",{ascending:false});
    if(r.error||!r.data.length){ box.innerHTML='<p style="color:var(--taupe-deep);padding:16px 0">No orders yet. <a href="/shop" style="color:var(--gold)">Start shopping \u2192</a></p>'; return; }
    box.innerHTML='<table class="table"><thead><tr><th>Order</th><th>Date</th><th>Total</th><th>Status</th></tr></thead><tbody>'+
      r.data.map(function(o){ return '<tr><td>#'+o.id.slice(0,8)+'</td><td>'+new Date(o.created_at).toLocaleDateString()+'</td><td>'+money(o.total)+'</td><td><span class="pill '+o.status+'">'+o.status+'</span></td></tr>'; }).join("")+'</tbody></table>';
  }catch(e){ box.innerHTML=""; }
}
async function loadAddresses(u){
  var box=document.getElementById("acctAddr"); if(!box)return;
  try{ var r=await sb.from("addresses").select("*").eq("user_id",u.id);
    if(r.error||!r.data.length){ box.innerHTML='<p style="color:var(--taupe-deep);padding:8px 0">No saved addresses.</p>'; return; }
    box.innerHTML=r.data.map(function(a){ return '<div class="panel" style="padding:16px"><b>'+(a.label||"Address")+'</b><br>'+(a.full_name||"")+' \u00b7 '+(a.phone||"")+'<br>'+(a.address||"")+', '+(a.city||"")+', '+(a.state||"")+'</div>'; }).join("");
  }catch(e){ box.innerHTML=""; }
}
window.signOut = async function(){ if(sb){ try{ await sb.auth.signOut(); }catch(e){} } location.href="/"; };
})();
