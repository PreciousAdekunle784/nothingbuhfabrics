/* ================= NOTHINGBUH FABRICS — admin.js ================= */
(function () {
"use strict";
var sb = window.sb || null;
var money = function (n){ return "\u20a6"+Number(n||0).toLocaleString("en-NG"); };
var $ = function(id){ return document.getElementById(id); };
var root, cats=[], cols=[], SLUG=function(s){return (s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");};
var STATUSES=["pending","confirmed","processing","shipped","delivered","cancelled"];

document.addEventListener("DOMContentLoaded", guard);

async function guard(){
  root = $("adminRoot");
  if(!sb){ deny("Admin goes live with Supabase","Add your Supabase URL + anon key in <b>js/config.js</b> and run <b>sql/schema.sql</b>. Then register, promote yourself to admin (see schema comments), and this dashboard controls the whole store."); return; }
  var u=(await sb.auth.getUser()).data.user;
  if(!u){ location.href="/login"; return; }
  var pr; try{ pr=await sb.from("profiles").select("role,full_name").eq("id",u.id).single(); }catch(e){}
  if(!pr || pr.error || !pr.data || pr.data.role!=="admin"){ deny("Access denied","This area is for administrators. If you should have access, ask the owner to set your role to <b>admin</b>."); return; }
  $("adminWho").textContent=(pr.data.full_name||u.email);
  [cats,cols] = await Promise.all([ fetchAll("categories","sort"), fetchAll("collections","sort") ]);
  bindNav(); show("overview");
}
function deny(t,b){ document.querySelector(".dash").innerHTML='<div style="padding:80px 20px;text-align:center;grid-column:1/-1"><h1 class="serif" style="font-size:2rem;margin-bottom:10px">'+t+'</h1><p style="color:var(--taupe-deep);max-width:52ch;margin:0 auto 22px">'+b+'</p><a href="/" class="btn btn-dark">Back To Store</a></div>'; }
async function fetchAll(t,order){ try{ var r=await sb.from(t).select("*").order(order||"created_at",{ascending:true}); return r.data||[]; }catch(e){ return []; } }

function bindNav(){
  document.querySelectorAll("[data-tab]").forEach(function(a){ a.onclick=function(){ show(a.getAttribute("data-tab")); document.querySelector(".dash-side").classList.remove("open"); }; });
}
function setActive(tab){ document.querySelectorAll("[data-tab]").forEach(function(a){ a.classList.toggle("active", a.getAttribute("data-tab")===tab); }); }

async function show(tab){ setActive(tab); root.innerHTML='<p class="lead">Loading\u2026</p>';
  if(tab==="overview") return overview();
  if(tab==="products") return products();
  if(tab==="categories") return taxonomy("categories","Categories");
  if(tab==="collections") return taxonomy("collections","Collections");
  if(tab==="orders") return orders();
  if(tab==="customers") return customers();
  if(tab==="subscribers") return subscribers();
  if(tab==="reviews") return reviews();
  if(tab==="homepage") return homepage();
}

/* ---------- OVERVIEW ---------- */
async function overview(){
  var pc=await count("products"), oc=await count("orders"), cc=await count("profiles"), sc=await count("subscribers");
  var recent=[]; try{ var r=await sb.from("orders").select("*").order("created_at",{ascending:false}).limit(6); recent=r.data||[]; }catch(e){}
  root.innerHTML='<h1>Overview</h1><p class="lead">Everything at a glance.</p>'+
    '<div class="stat-grid">'+stat(pc,"Products")+stat(oc,"Orders")+stat(cc,"Customers")+stat(sc,"Subscribers")+'</div>'+
    '<div class="panel"><div class="panel-head"><h3>Recent Orders</h3><button class="mini-btn" data-goto="orders">View All</button></div>'+
    (recent.length? table(["Order","Customer","Total","Status"], recent.map(function(o){return ['#'+o.id.slice(0,8), o.customer_name||"\u2014", money(o.total), pill(o.status,o.status)];}))
      : '<p style="padding:16px 20px;color:var(--taupe-deep)">No orders yet.</p>')+'</div>';
  var g=root.querySelector("[data-goto]"); if(g)g.onclick=function(){show("orders");};
}
function stat(n,l){ return '<div class="stat"><div class="n">'+n+'</div><div class="l">'+l+'</div></div>'; }
async function count(t){ try{ var r=await sb.from(t).select("id",{count:"exact",head:true}); return r.count||0; }catch(e){ return 0; } }

/* ---------- PRODUCTS ---------- */
async function products(){
  var r=await sb.from("products").select("*,categories(name),collections(name)").order("created_at",{ascending:false});
  var list=r.data||[];
  root.innerHTML='<h1>Products</h1><p class="lead">Add, edit, price, stock and flag products.</p>'+
    '<div class="panel"><div class="panel-head"><h3>'+list.length+' Products</h3><button class="btn btn-dark" id="addProd" style="padding:11px 22px">+ Add Product</button></div>'+
    '<div style="overflow-x:auto">'+table(["","Name","Price","Stock","Flags","Active",""],
      list.map(function(p){ return [
        '<div class="swatch-cell '+(p.swatch&&p.swatch.indexOf("fab-")===0?p.swatch:"")+'"'+(p.swatch&&p.swatch.indexOf("fab-")!==0?' style="background:url('+p.swatch+') center/cover"':"")+'></div>',
        '<b>'+p.name+'</b><br><span style="color:var(--taupe-deep);font-size:.78rem">'+(p.categories?p.categories.name:"\u2014")+'</span>',
        p.sale_price? '<del style="color:var(--taupe)">'+money(p.price)+'</del> '+money(p.sale_price) : money(p.price),
        p.stock_quantity>0? p.stock_quantity : '<span class="pill out">Out</span>',
        flags(p),
        '<span class="pill '+(p.active?"paid":"cancelled")+'">'+(p.active?"Live":"Off")+'</span>',
        '<button class="mini-btn" data-edit="'+p.id+'">Edit</button> <button class="mini-btn danger" data-del="'+p.id+'">Delete</button>'
      ]; }))+'</div></div>';
  $("addProd").onclick=function(){ productForm(null); };
  root.querySelectorAll("[data-edit]").forEach(function(b){ b.onclick=function(){ productForm(list.filter(function(x){return x.id===b.getAttribute("data-edit");})[0]); }; });
  root.querySelectorAll("[data-del]").forEach(function(b){ b.onclick=async function(){ if(!confirm("Delete this product?"))return; await sb.from("products").delete().eq("id",b.getAttribute("data-del")); products(); }; });
}
function flags(p){ var f=[]; if(p.featured)f.push("Featured"); if(p.best_seller)f.push("Best"); if(p.new_arrival)f.push("New"); return f.length?f.map(function(x){return '<span class="pill processing" style="margin:1px">'+x+'</span>';}).join(" "):"\u2014"; }

function productForm(p){
  p=p||{};
  var opt=function(arr,sel){ return '<option value="">\u2014</option>'+arr.map(function(x){return '<option value="'+x.id+'"'+(sel===x.id?' selected':'')+'>'+x.name+'</option>';}).join(""); };
  modal((p.id?"Edit":"Add")+" Product",
    '<form id="pf">'+
    field("Name","name","text",p.name||"")+
    '<div class="field-row">'+field("Price (\u20a6)","price","number",p.price||0)+field("Sale price (optional)","sale_price","number",p.sale_price||"")+'</div>'+
    '<div class="field-row"><div class="field"><label>Category</label><select name="category_id">'+opt(cats,p.category_id)+'</select></div>'+
      '<div class="field"><label>Collection</label><select name="collection_id">'+opt(cols,p.collection_id)+'</select></div></div>'+
    '<div class="field-row">'+field("Fabric type","fabric_type","text",p.fabric_type||"")+field("Stock qty","stock_quantity","number",p.stock_quantity||0)+'</div>'+
    '<div class="field"><label>Description</label><textarea name="description" rows="3">'+(p.description||"")+'</textarea></div>'+
    '<div class="field"><label>Swatch class or image URL</label><input name="swatch" value="'+(p.swatch||"fab-brocade")+'"></div>'+
    '<div class="field"><label>Flags</label><div style="display:flex;gap:16px;flex-wrap:wrap;font-family:var(--f-util);font-size:.8rem">'+
      chk("featured","Featured",p.featured)+chk("best_seller","Best Seller",p.best_seller)+chk("new_arrival","New Arrival",p.new_arrival)+chk("active","Live",p.active!==false)+'</div></div>'+
    (p.id? '<div class="field"><label>Product images (Supabase Storage)</label><input type="file" id="pimg" accept="image/*" multiple><div id="imgList" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"></div></div>':"")+
    '<div id="pfMsg"></div>'+
    '<button type="submit" class="btn btn-dark btn-block">'+(p.id?"Save Changes":"Create Product")+'</button></form>');
  if(p.id) loadImages(p.id);
  $("pf").onsubmit=async function(e){ e.preventDefault(); var f=e.target; var box=$("pfMsg");
    var data={ name:f.name.value.trim(), slug:SLUG(f.name.value), price:+f.price.value||0,
      sale_price:f.sale_price.value?+f.sale_price.value:null, category_id:f.category_id.value||null,
      collection_id:f.collection_id.value||null, fabric_type:f.fabric_type.value, stock_quantity:+f.stock_quantity.value||0,
      description:f.description.value, swatch:f.swatch.value.trim(),
      featured:f.featured.checked, best_seller:f.best_seller.checked, new_arrival:f.new_arrival.checked, active:f.active.checked,
      updated_at:new Date().toISOString() };
    try{ if(p.id){ await sb.from("products").update(data).eq("id",p.id); } else { await sb.from("products").insert(data); }
      closeModal(); products(); }catch(err){ box.innerHTML='<div class="msg err">'+err.message+'</div>'; };
    return false; };
  if(p.id){ var fi=$("pimg"); fi.onchange=async function(){ for(var i=0;i<fi.files.length;i++){ await uploadImage(p.id, fi.files[i]); } loadImages(p.id); }; }
}
async function loadImages(pid){ var box=$("imgList"); if(!box)return; var r=await sb.from("product_images").select("*").eq("product_id",pid).order("sort"); box.innerHTML=(r.data||[]).map(function(im){ return '<div style="position:relative"><img src="'+im.url+'" style="width:66px;height:82px;object-fit:cover"><button class="mini-btn danger" style="position:absolute;top:2px;right:2px;padding:2px 6px" data-rm="'+im.id+'" data-path="'+(im.path||"")+'">\u00d7</button></div>'; }).join(""); box.querySelectorAll("[data-rm]").forEach(function(b){ b.onclick=async function(){ if(b.getAttribute("data-path")) await sb.storage.from("product-images").remove([b.getAttribute("data-path")]); await sb.from("product_images").delete().eq("id",b.getAttribute("data-rm")); loadImages(pid); }; }); }
async function uploadImage(pid,file){ var path=pid+"/"+Date.now()+"-"+file.name.replace(/[^a-zA-Z0-9.]/g,"_"); var up=await sb.storage.from("product-images").upload(path,file); if(up.error){ alert(up.error.message); return; } var url=sb.storage.from("product-images").getPublicUrl(path).data.publicUrl; await sb.from("product_images").insert({product_id:pid,url:url,path:path}); }

/* ---------- CATEGORIES / COLLECTIONS ---------- */
async function taxonomy(t,label){
  var rows=await fetchAll(t,"sort");
  root.innerHTML='<h1>'+label+'</h1><p class="lead">Group your fabrics for easy shopping.</p>'+
    '<div class="panel"><div class="panel-head"><h3>'+rows.length+' '+label+'</h3><button class="btn btn-dark" id="addTax" style="padding:11px 22px">+ Add</button></div>'+
    table(["Name","Slug","Description",""], rows.map(function(c){ return [ '<b>'+c.name+'</b>', c.slug, (c.description||"\u2014'").slice(0,60), '<button class="mini-btn" data-e="'+c.id+'">Edit</button> <button class="mini-btn danger" data-d="'+c.id+'">Delete</button>' ]; }))+'</div>';
  $("addTax").onclick=function(){ taxForm(t,label,null); };
  root.querySelectorAll("[data-e]").forEach(function(b){ b.onclick=function(){ taxForm(t,label,rows.filter(function(x){return x.id===b.getAttribute("data-e");})[0]); }; });
  root.querySelectorAll("[data-d]").forEach(function(b){ b.onclick=async function(){ if(!confirm("Delete?"))return; await sb.from(t).delete().eq("id",b.getAttribute("data-d")); if(t==="categories")cats=await fetchAll("categories","sort"); else cols=await fetchAll("collections","sort"); taxonomy(t,label); }; });
}
function taxForm(t,label,c){ c=c||{};
  modal((c.id?"Edit":"Add")+" "+label.replace(/s$/,""),
    '<form id="tf">'+field("Name","name","text",c.name||"")+
    '<div class="field"><label>Description</label><textarea name="description" rows="2">'+(c.description||"")+'</textarea></div>'+
    '<div class="field"><label>Image (swatch class or URL)</label><input name="image" value="'+(c.image||"fab-brocade")+'"></div>'+
    '<div id="tfMsg"></div><button class="btn btn-dark btn-block">'+(c.id?"Save":"Create")+'</button></form>');
  $("tf").onsubmit=async function(e){ e.preventDefault(); var f=e.target;
    var d={ name:f.name.value.trim(), slug:SLUG(f.name.value), description:f.description.value, image:f.image.value.trim() };
    try{ if(c.id) await sb.from(t).update(d).eq("id",c.id); else await sb.from(t).insert(d);
      if(t==="categories")cats=await fetchAll("categories","sort"); else cols=await fetchAll("collections","sort");
      closeModal(); taxonomy(t,label); }catch(err){ $("tfMsg").innerHTML='<div class="msg err">'+err.message+'</div>'; } return false; };
}

/* ---------- ORDERS ---------- */
async function orders(){
  var r=await sb.from("orders").select("*").order("created_at",{ascending:false});
  var list=r.data||[];
  root.innerHTML='<h1>Orders</h1><p class="lead">Track and fulfill customer orders.</p>'+
    '<div class="panel"><div style="overflow-x:auto">'+table(["Order","Customer","Total","Payment","Status","Date",""],
      list.map(function(o){ return [ '#'+o.id.slice(0,8), (o.customer_name||"\u2014")+'<br><span style="color:var(--taupe-deep);font-size:.76rem">'+(o.customer_phone||"")+'</span>',
        money(o.total), pill(o.payment_status,o.payment_status),
        '<select class="sortsel" data-order="'+o.id+'" style="padding:6px 8px">'+STATUSES.map(function(s){return '<option'+(o.status===s?' selected':'')+'>'+s+'</option>';}).join("")+'</select>',
        new Date(o.created_at).toLocaleDateString(), '<button class="mini-btn" data-view=\''+o.id+'\'>View</button>' ]; }))+
    (list.length?"":'<p style="padding:16px 20px;color:var(--taupe-deep)">No orders yet.</p>')+'</div></div>';
  root.querySelectorAll("[data-order]").forEach(function(s){ s.onchange=async function(){ await sb.from("orders").update({status:s.value}).eq("id",s.getAttribute("data-order")); }; });
  root.querySelectorAll("[data-view]").forEach(function(b){ b.onclick=async function(){ viewOrder(list.filter(function(x){return x.id===b.getAttribute("data-view");})[0]); }; });
}
async function viewOrder(o){
  var it=[]; try{ var r=await sb.from("order_items").select("*").eq("order_id",o.id); it=r.data||[]; }catch(e){}
  modal("Order #"+o.id.slice(0,8),
    '<p style="font-size:.9rem;line-height:1.8"><b>'+(o.customer_name||"")+'</b><br>'+(o.customer_email||"")+'<br>'+(o.customer_phone||"")+'<br>'+(o.address||"")+', '+(o.city||"")+', '+(o.state||"")+'<br>Delivery: '+(o.delivery_method||"\u2014")+'</p>'+
    '<table class="table" style="margin:14px 0">'+it.map(function(i){return '<tr><td>'+i.product_name+' \u00d7'+i.quantity+'</td><td style="text-align:right">'+money(i.price*i.quantity)+'</td></tr>';}).join("")+
    '<tr><td>Delivery</td><td style="text-align:right">'+money(o.delivery_fee)+'</td></tr><tr><td><b>Total</b></td><td style="text-align:right"><b>'+money(o.total)+'</b></td></tr></table>'+
    '<div class="field"><label>Payment status</label><select id="payst" class="sortsel" style="width:100%">'+["pending","paid","failed"].map(function(s){return '<option'+(o.payment_status===s?' selected':'')+'>'+s+'</option>';}).join("")+'</select></div>'+
    '<button class="btn btn-dark btn-block" id="savePay">Update Payment</button>');
  $("savePay").onclick=async function(){ await sb.from("orders").update({payment_status:$("payst").value}).eq("id",o.id); closeModal(); orders(); };
}

/* ---------- CUSTOMERS ---------- */
async function customers(){
  var r=await sb.from("profiles").select("*").order("created_at",{ascending:false});
  var list=(r.data||[]).filter(function(p){return p.role!=="admin"||true;});
  root.innerHTML='<h1>Customers</h1><p class="lead">Everyone with an account.</p><div class="panel"><div style="overflow-x:auto">'+
    table(["Name","Phone","Role","Joined"], list.map(function(c){ return [ c.full_name||"\u2014", c.phone||"\u2014", '<span class="pill '+(c.role==="admin"?"processing":"out")+'">'+c.role+'</span>', new Date(c.created_at).toLocaleDateString() ]; }))+
    (list.length?"":'<p style="padding:16px 20px;color:var(--taupe-deep)">No customers yet.</p>')+'</div></div>';
}

/* ---------- SUBSCRIBERS ---------- */
async function subscribers(){
  var r=await sb.from("subscribers").select("*").order("created_at",{ascending:false});
  var list=r.data||[];
  root.innerHTML='<h1>Subscribers</h1><p class="lead">Your newsletter list.</p><div class="panel"><div style="overflow-x:auto">'+
    table(["Email","Joined",""], list.map(function(s){ return [ s.email, new Date(s.created_at).toLocaleDateString(), '<button class="mini-btn danger" data-d="'+s.id+'">Remove</button>' ]; }))+
    (list.length?"":'<p style="padding:16px 20px;color:var(--taupe-deep)">No subscribers yet.</p>')+'</div></div>';
  root.querySelectorAll("[data-d]").forEach(function(b){ b.onclick=async function(){ await sb.from("subscribers").delete().eq("id",b.getAttribute("data-d")); subscribers(); }; });
}

/* ---------- REVIEWS ---------- */
async function reviews(){
  var r=await sb.from("reviews").select("*,products(name)").order("created_at",{ascending:false});
  var list=r.data||[];
  root.innerHTML='<h1>Reviews</h1><p class="lead">Approve, hide or remove customer reviews.</p><div class="panel"><div style="overflow-x:auto">'+
    table(["Product","Rating","Review","Status",""], list.map(function(v){ return [ v.products?v.products.name:"\u2014", "\u2605".repeat(v.rating), (v.body||"").slice(0,80),
      '<span class="pill '+(v.approved?"paid":"pending")+'">'+(v.approved?"Approved":"Pending")+'</span>',
      '<button class="mini-btn" data-ap="'+v.id+'" data-on="'+v.approved+'">'+(v.approved?"Hide":"Approve")+'</button> <button class="mini-btn danger" data-d="'+v.id+'">Delete</button>' ]; }))+
    (list.length?"":'<p style="padding:16px 20px;color:var(--taupe-deep)">No reviews yet.</p>')+'</div></div>';
  root.querySelectorAll("[data-ap]").forEach(function(b){ b.onclick=async function(){ await sb.from("reviews").update({approved:b.getAttribute("data-on")!=="true"}).eq("id",b.getAttribute("data-ap")); reviews(); }; });
  root.querySelectorAll("[data-d]").forEach(function(b){ b.onclick=async function(){ if(!confirm("Delete review?"))return; await sb.from("reviews").delete().eq("id",b.getAttribute("data-d")); reviews(); }; });
}

/* ---------- HOMEPAGE / ANNOUNCEMENT ---------- */
async function homepage(){
  var val={on:true,messages:[]}; try{ var r=await sb.from("site_settings").select("value").eq("key","announcement").single(); if(!r.error&&r.data)val=r.data.value; }catch(e){}
  root.innerHTML='<h1>Homepage</h1><p class="lead">Control the announcement bar. (Feature / Best Seller / New Arrival are set per product.)</p>'+
    '<div class="panel"><div class="panel-head"><h3>Announcement Bar</h3><div style="display:flex;align-items:center;gap:10px"><span style="font-family:var(--f-util);font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:var(--taupe-deep)">Show on site</span><div class="toggle'+(val.on!==false?" on":"")+'" id="annToggle"></div></div></div>'+
    '<div style="padding:20px"><div class="field"><label>Messages (one per line)</label><textarea id="annMsgs" rows="4">'+((val.messages||[]).join("\n"))+'</textarea></div><button class="btn btn-dark" id="annSave">Save Announcement</button></div></div>';
  var on=val.on!==false; $("annToggle").onclick=function(){ on=!on; $("annToggle").classList.toggle("on",on); };
  $("annSave").onclick=async function(){ var msgs=$("annMsgs").value.split("\n").map(function(x){return x.trim();}).filter(Boolean);
    await sb.from("site_settings").update({value:{on:on,messages:msgs}}).eq("key","announcement");
    $("annSave").textContent="Saved \u2713"; setTimeout(function(){$("annSave").textContent="Save Announcement";},1500); };
}

/* ---------- ui helpers ---------- */
function table(head,rows){ return '<table class="table"><thead><tr>'+head.map(function(h){return '<th>'+h+'</th>';}).join("")+'</tr></thead><tbody>'+
  rows.map(function(r){ return '<tr>'+r.map(function(c){return '<td>'+c+'</td>';}).join("")+'</tr>'; }).join("")+'</tbody></table>'; }
function pill(cls,txt){ return '<span class="pill '+cls+'">'+txt+'</span>'; }
function field(label,name,type,val){ return '<div class="field"><label>'+label+'</label><input name="'+name+'" type="'+type+'" value="'+(val===null||val===undefined?"":val)+'"'+(type==="number"?' step="any"':"")+'></div>'; }
function chk(name,label,on){ return '<label style="display:flex;align-items:center;gap:6px"><input type="checkbox" name="'+name+'" '+(on?"checked":"")+'>'+label+'</label>'; }
function modal(title,body){ var s=document.getElementById("admModal"); if(!s){ s=document.createElement("div"); s.id="admModal"; s.className="modal-scrim"; document.body.appendChild(s);
    s.onclick=function(e){ if(e.target===s)closeModal(); }; }
  s.innerHTML='<div class="modal" style="grid-template-columns:1fr;max-width:520px"><div class="modal-body" style="padding:26px"><button class="modal-x" onclick="document.getElementById(\'admModal\').classList.remove(\'open\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 6l12 12M18 6L6 18"/></svg></button><h3 style="font-family:var(--f-display);font-size:1.4rem;margin-bottom:16px">'+title+'</h3>'+body+'</div></div>';
  s.classList.add("open");
}
window.closeModal=function(){ var s=document.getElementById("admModal"); if(s)s.classList.remove("open"); };
window.toggleAdminNav=function(){ document.querySelector(".dash-side").classList.toggle("open"); };
})();
