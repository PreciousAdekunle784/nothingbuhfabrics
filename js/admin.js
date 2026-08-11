/* ================= NOTHINGBUH FABRICS — admin.js ================= */
(function () {
"use strict";
var sb = window.sb || null;
var money = function (n){ return "\u20a6"+Number(n||0).toLocaleString("en-NG"); };
var $ = function(id){ return document.getElementById(id); };
var root, cats=[], cols=[], SLUG=function(s){return (s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");};
var STATUSES=["pending","confirmed","processing","shipped","delivered","cancelled"];

// surface Supabase write errors instead of silently swallowing them
function saveErr(box,res){
  if(res && res.error){ var m=res.error.message||"Save failed";
    if(/row-level security|permission/i.test(m)) m="Permission denied — your account isn't an admin yet. Run the promote SQL from the admin home, then refresh.";
    if(box){ box.innerHTML='<div class="msg err">'+m+'</div>'; } else { alert(m); }
    return true; }
  return false;
}
async function uploadTo(folder,file){
  var path=folder+"/"+Date.now()+"-"+file.name.replace(/[^a-zA-Z0-9.]/g,"_");
  var up=await sb.storage.from("product-images").upload(path,file,{upsert:true});
  if(up.error) return {error:up.error.message};
  return { url:sb.storage.from("product-images").getPublicUrl(path).data.publicUrl, path:path };
}
async function removeStoragePath(p){ if(p){ try{ await sb.storage.from("product-images").remove([p]); }catch(e){} } }

document.addEventListener("DOMContentLoaded", guard);

async function guard(){
  root = $("adminRoot");
  if(!sb){ deny("Admin goes live with Supabase","Add your Supabase URL + anon key in <b>js/config.js</b> and run <b>sql/schema.sql</b>. Then register, promote yourself to admin (see below), and this dashboard controls the whole store."); return; }
  var u=(await sb.auth.getUser()).data.user;
  if(!u){ location.href="/login"; return; }
  var pr=null;
  try{ var res=await sb.from("profiles").select("role,full_name").eq("id",u.id).maybeSingle(); pr=res.data; }catch(e){}
  var fix='<div style="text-align:left;max-width:560px;margin:18px auto 0;background:#fff;border:1px solid var(--line);padding:18px"><p style="font-family:var(--f-util);font-size:.66rem;letter-spacing:.12em;text-transform:uppercase;color:var(--taupe-deep);margin-bottom:8px">Run this once in Supabase &rarr; SQL Editor</p>'+
    '<pre style="white-space:pre-wrap;font-size:.8rem;line-height:1.6;color:var(--espresso);margin:0">insert into public.profiles (id, full_name, role)\nselect id, coalesce(raw_user_meta_data-&gt;&gt;\'full_name\',\'Admin\'), \'admin\'\nfrom auth.users where email = \''+(u.email||"you@example.com")+'\'\non conflict (id) do update set role = \'admin\';</pre></div>'+
    '<p style="color:var(--taupe-deep);margin-top:14px;font-size:.85rem">Then refresh this page.</p>';
  if(!pr){ deny("One step left to finish setup","We couldn\u2019t find a profile for <b>"+(u.email||"your account")+"</b> yet \u2014 it was likely created before the database was set up, so there\u2019s no row to promote. This SQL creates it and makes you admin in one go:"+fix); return; }
  if(pr.role!=="admin"){ deny("Not an admin yet","Your account <b>"+(u.email||"")+"</b> exists but isn\u2019t an admin. Run this to promote it:"+fix); return; }
  $("adminWho").textContent=(pr.full_name||u.email);
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
  var r=await sb.from("products").select("*,categories(name),collections(name),product_images(url,sort)").order("created_at",{ascending:false});
  var list=r.data||[];
  list.forEach(function(p){ if(p.product_images && Array.isArray(p.product_images)) p.product_images.sort(function(a,b){return (a.sort||0)-(b.sort||0);}); });
  root.innerHTML='<h1>Products</h1><p class="lead">Add, edit, price, stock and flag products.</p>'+
    '<div class="panel"><div class="panel-head"><h3>'+list.length+' Products</h3><button class="btn btn-dark" id="addProd" style="padding:11px 22px">+ Add Product</button></div>'+
    '<div style="overflow-x:auto">'+table(["","Name","Price","Stock","Flags","Active",""],
      list.map(function(p){ var main=(p.product_images&&p.product_images[0])?p.product_images[0].url:p.swatch; return [
        '<div class="swatch-cell '+(main&&main.indexOf("fab-")===0?main:"")+'"'+(main&&main.indexOf("fab-")!==0?' style="background:url('+main+') center/cover"':"")+'></div>',
        '<b>'+p.name+'</b><br><span style="color:var(--taupe-deep);font-size:.78rem">'+(p.categories?p.categories.name:"\u2014")+'</span>',
        p.sale_price? '<del style="color:var(--taupe)">'+money(p.price)+'</del> '+money(p.sale_price) : money(p.price),
        p.stock_quantity>0? p.stock_quantity : '<span class="pill out">Out</span>',
        flags(p),
        '<span class="pill '+(p.active?"paid":"cancelled")+'">'+(p.active?"Live":"Off")+'</span>',
        '<button class="mini-btn" data-edit="'+p.id+'">Edit</button> <button class="mini-btn danger" data-del="'+p.id+'">Delete</button>'
      ]; }))+'</div></div>';
  $("addProd").onclick=function(){ productForm(null); };
  root.querySelectorAll("[data-edit]").forEach(function(b){ b.onclick=function(){ productForm(list.filter(function(x){return String(x.id)===String(b.getAttribute("data-edit"));})[0]); }; });
  root.querySelectorAll("[data-del]").forEach(function(b){ b.onclick=async function(){ if(!confirm("Delete this product?"))return; var res=await sb.from("products").delete().eq("id",b.getAttribute("data-del")); if(saveErr(null,res))return; products(); }; });
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
    '<div class="field"><label>Main image (upload photos below, or paste an image URL / leave a fabric texture like fab-brocade)</label><input name="swatch" value="'+(p.swatch||"fab-brocade")+'"></div>'+
    '<div class="field"><label>Flags</label><div style="display:flex;gap:16px;flex-wrap:wrap;font-family:var(--f-util);font-size:.8rem">'+
      chk("featured","Featured",p.featured)+chk("best_seller","Best Seller",p.best_seller)+chk("new_arrival","New Arrival",p.new_arrival)+chk("active","Live",p.active!==false)+'</div></div>'+
    (p.id? '<div class="field"><label>Product photos &mdash; the first one is the picture customers see</label><input type="file" id="pimg" accept="image/*" multiple><div id="imgList" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"></div><div id="imgMsg"></div></div>':'<p style="font-family:var(--f-util);font-size:.62rem;letter-spacing:.06em;text-transform:uppercase;color:var(--taupe-deep);margin:-6px 0 14px">Create the product first, then re-open it to upload photos.</p>')+
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
    var btn=f.querySelector("button[type=submit]"); btn.disabled=true; btn.textContent="Saving\u2026";
    var res = p.id ? await sb.from("products").update(data).eq("id",p.id) : await sb.from("products").insert(data);
    btn.disabled=false; btn.textContent=p.id?"Save Changes":"Create Product";
    if(saveErr(box,res)) return false;
    closeModal(); products(); return false; };
  if(p.id){ var fi=$("pimg"); fi.onchange=async function(){ var mb=$("imgMsg"); mb.innerHTML='<p style="color:var(--taupe-deep);font-size:.82rem;margin-top:8px">Uploading\u2026</p>';
    for(var i=0;i<fi.files.length;i++){ var e2=await uploadImage(p.id, fi.files[i]); if(e2){ mb.innerHTML='<div class="msg err">'+e2+'</div>'; break; } }
    if(!$("imgMsg").querySelector(".msg")) mb.innerHTML=""; fi.value=""; loadImages(p.id); }; }
}
async function loadImages(pid){ var box=$("imgList"); if(!box)return;
  var r=await sb.from("product_images").select("*").eq("product_id",pid).order("sort");
  var imgs=r.data||[];
  box.innerHTML=imgs.length? imgs.map(function(im,i){ return '<div style="position:relative">'+(i===0?'<span style="position:absolute;bottom:2px;left:2px;background:var(--gold);color:var(--charcoal);font-family:var(--f-util);font-size:.5rem;letter-spacing:.08em;text-transform:uppercase;padding:2px 5px;z-index:2">Main</span>':'')+'<img src="'+im.url+'" style="width:66px;height:82px;object-fit:cover"><button class="mini-btn danger" style="position:absolute;top:2px;right:2px;padding:2px 6px" data-rm="'+im.id+'" data-path="'+(im.path||"")+'" title="Remove">\u00d7</button></div>'; }).join("")
    : '<p style="color:var(--taupe-deep);font-size:.82rem">No photos yet. The fabric texture / URL above is used until you add one.</p>';
  box.querySelectorAll("[data-rm]").forEach(function(b){ b.onclick=async function(){ await removeStoragePath(b.getAttribute("data-path")); var res=await sb.from("product_images").delete().eq("id",b.getAttribute("data-rm")); if(saveErr($("imgMsg"),res))return; loadImages(pid); }; });
}
async function uploadImage(pid,file){
  var sortRes=await sb.from("product_images").select("id",{count:"exact",head:true}).eq("product_id",pid);
  var up=await uploadTo(pid,file); if(up.error) return up.error;
  var res=await sb.from("product_images").insert({product_id:pid,url:up.url,path:up.path,sort:(sortRes.count||0)});
  if(res.error){ await removeStoragePath(up.path); return res.error.message; }
  return null;
}

/* ---------- CATEGORIES / COLLECTIONS ---------- */
async function taxonomy(t,label){
  var rows=await fetchAll(t,"sort");
  root.innerHTML='<h1>'+label+'</h1><p class="lead">Group your fabrics for easy shopping.</p>'+
    '<div class="panel"><div class="panel-head"><h3>'+rows.length+' '+label+'</h3><button class="btn btn-dark" id="addTax" style="padding:11px 22px">+ Add</button></div>'+
    table(["Name","Slug","Description",""], rows.map(function(c){ return [ '<b>'+c.name+'</b>', c.slug, (c.description||"\u2014'").slice(0,60), '<button class="mini-btn" data-e="'+c.id+'">Edit</button> <button class="mini-btn danger" data-d="'+c.id+'">Delete</button>' ]; }))+'</div>';
  $("addTax").onclick=function(){ taxForm(t,label,null); };
  root.querySelectorAll("[data-e]").forEach(function(b){ b.onclick=function(){ taxForm(t,label,rows.filter(function(x){return x.id===b.getAttribute("data-e");})[0]); }; });
  root.querySelectorAll("[data-d]").forEach(function(b){ b.onclick=async function(){ if(!confirm("Delete?"))return; var res=await sb.from(t).delete().eq("id",b.getAttribute("data-d")); if(saveErr(null,res))return; if(t==="categories")cats=await fetchAll("categories","sort"); else cols=await fetchAll("collections","sort"); taxonomy(t,label); }; });
}
function taxForm(t,label,c){ c=c||{};
  var cur=c.image||"";
  var isImg = cur && cur.indexOf("fab-")!==0;
  modal((c.id?"Edit":"Add")+" "+label.replace(/s$/,""),
    '<form id="tf">'+field("Name","name","text",c.name||"")+
    '<div class="field"><label>Description</label><textarea name="description" rows="2">'+(c.description||"")+'</textarea></div>'+
    '<div class="field"><label>Image</label>'+
      '<div id="taxPrev" style="width:90px;height:110px;margin-bottom:10px;'+(isImg?'background:url('+cur+') center/cover':'')+'" class="swatch '+(cur&&!isImg?cur:'')+'"></div>'+
      '<input type="file" id="taxImg" accept="image/*">'+
      '<input type="hidden" name="image" value="'+(cur||"fab-brocade")+'">'+
      '<p style="font-family:var(--f-util);font-size:.6rem;letter-spacing:.06em;text-transform:uppercase;color:var(--taupe-deep);margin-top:8px">Upload a photo, or type a fabric texture (e.g. fab-lace) below.</p>'+
      '<input name="imagetext" value="'+(cur&&!isImg?cur:'')+'" placeholder="fab-lace (optional)" style="margin-top:6px">'+
    '</div>'+
    '<div id="tfMsg"></div><button class="btn btn-dark btn-block">'+(c.id?"Save":"Create")+'</button></form>');
  var fi=$("taxImg"); fi.onchange=async function(){ var mb=$("tfMsg"); mb.innerHTML='<p style="color:var(--taupe-deep);font-size:.82rem">Uploading\u2026</p>';
    var up=await uploadTo(t, fi.files[0]); if(up.error){ mb.innerHTML='<div class="msg err">'+up.error+'</div>'; return; }
    document.querySelector("#tf [name=image]").value=up.url;
    var pv=$("taxPrev"); pv.className="swatch"; pv.style.background="url("+up.url+") center/cover"; mb.innerHTML=''; };
  $("tf").onsubmit=async function(e){ e.preventDefault(); var f=e.target;
    var img = f.imagetext.value.trim() || f.image.value.trim() || "fab-brocade";
    var d={ name:f.name.value.trim(), slug:SLUG(f.name.value), description:f.description.value, image:img };
    var btn=f.querySelector("button"); btn.disabled=true; btn.textContent="Saving\u2026";
    var res = c.id ? await sb.from(t).update(d).eq("id",c.id) : await sb.from(t).insert(d);
    btn.disabled=false; btn.textContent=c.id?"Save":"Create";
    if(saveErr($("tfMsg"),res)) return false;
    if(t==="categories")cats=await fetchAll("categories","sort"); else cols=await fetchAll("collections","sort");
    closeModal(); taxonomy(t,label); return false; };
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
  root.querySelectorAll("[data-order]").forEach(function(s){ s.onchange=async function(){ var _r=await sb.from("orders").update({status:s.value}).eq("id",s.getAttribute("data-order")); saveErr(null,_r); }; });
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
  $("savePay").onclick=async function(){ var _r=await sb.from("orders").update({payment_status:$("payst").value}).eq("id",o.id); if(saveErr(null,_r))return; closeModal(); orders(); };
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
  root.querySelectorAll("[data-d]").forEach(function(b){ b.onclick=async function(){ var _r=await sb.from("subscribers").delete().eq("id",b.getAttribute("data-d")); if(saveErr(null,_r))return; subscribers(); }; });
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
  root.querySelectorAll("[data-ap]").forEach(function(b){ b.onclick=async function(){ var _r=await sb.from("reviews").update({approved:b.getAttribute("data-on")!=="true"}).eq("id",b.getAttribute("data-ap")); if(saveErr(null,_r))return; reviews(); }; });
  root.querySelectorAll("[data-d]").forEach(function(b){ b.onclick=async function(){ if(!confirm("Delete review?"))return; var _r=await sb.from("reviews").delete().eq("id",b.getAttribute("data-d")); if(saveErr(null,_r))return; reviews(); }; });
}

/* ---------- HOMEPAGE / ANNOUNCEMENT ---------- */
async function homepage(){
  var val={on:true,messages:[]}; try{ var r=await sb.from("site_settings").select("value").eq("key","announcement").single(); if(!r.error&&r.data)val=r.data.value; }catch(e){}
  root.innerHTML='<h1>Homepage</h1><p class="lead">Control the announcement bar. (Feature / Best Seller / New Arrival are set per product.)</p>'+
    '<div class="panel"><div class="panel-head"><h3>Announcement Bar</h3><div style="display:flex;align-items:center;gap:10px"><span style="font-family:var(--f-util);font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:var(--taupe-deep)">Show on site</span><div class="toggle'+(val.on!==false?" on":"")+'" id="annToggle"></div></div></div>'+
    '<div style="padding:20px"><div class="field"><label>Messages (one per line)</label><textarea id="annMsgs" rows="4">'+((val.messages||[]).join("\n"))+'</textarea></div><button class="btn btn-dark" id="annSave">Save Announcement</button></div></div>';
  var on=val.on!==false; $("annToggle").onclick=function(){ on=!on; $("annToggle").classList.toggle("on",on); };
  $("annSave").onclick=async function(){ var msgs=$("annMsgs").value.split("\n").map(function(x){return x.trim();}).filter(Boolean);
    var res=await sb.from("site_settings").upsert({key:"announcement",value:{on:on,messages:msgs}});
    if(saveErr(null,res))return;
    $("annSave").textContent="Saved \u2713"; setTimeout(function(){$("annSave").textContent="Save Announcement";},1500); };

  // ---- Homepage hero image ----
  var hero={image:"",path:""}; try{ var hr=await sb.from("site_settings").select("value").eq("key","hero").single(); if(!hr.error&&hr.data&&hr.data.value){ hero=hr.data.value; } }catch(e){}
  root.insertAdjacentHTML("beforeend",
    '<div class="panel"><div class="panel-head"><h3>Homepage Hero Image</h3></div><div style="padding:20px">'+
      '<div id="heroPrev" style="width:100%;max-width:420px;aspect-ratio:16/7;margin-bottom:12px;'+(hero.image?'background:url('+hero.image+') center/cover':'')+'" class="swatch '+(hero.image?'':'fab-brocade')+'"></div>'+
      '<input type="file" id="heroImg" accept="image/*"> <button class="mini-btn danger" id="heroRemove"'+(hero.image?'':' style="display:none"')+'>Remove Image</button>'+
      '<div id="heroMsg"></div>'+
      '<p style="font-family:var(--f-util);font-size:.62rem;letter-spacing:.06em;text-transform:uppercase;color:var(--taupe-deep);margin-top:10px">A wide, high-quality photo works best. Leave empty to use the default fabric texture.</p>'+
    '</div></div>');
  async function saveHero(v){ var res=await sb.from("site_settings").upsert({key:"hero",value:v}); return saveErr($("heroMsg"),res); }
  $("heroImg").onchange=async function(){ var mb=$("heroMsg"); mb.innerHTML='<p style="color:var(--taupe-deep);font-size:.82rem;margin-top:8px">Uploading\u2026</p>';
    if(hero.path) await removeStoragePath(hero.path);
    var up=await uploadTo("hero", this.files[0]); if(up.error){ mb.innerHTML='<div class="msg err">'+up.error+'</div>'; return; }
    hero={image:up.url,path:up.path}; if(await saveHero(hero))return;
    var pv=$("heroPrev"); pv.className="swatch"; pv.style.background="url("+up.url+") center/cover"; $("heroRemove").style.display=""; mb.innerHTML='<div class="msg ok">Hero image updated.</div>'; this.value=""; };
  $("heroRemove").onclick=async function(){ if(hero.path) await removeStoragePath(hero.path); hero={image:"",path:""}; if(await saveHero(hero))return;
    var pv=$("heroPrev"); pv.className="swatch fab-brocade"; pv.style.background=""; this.style.display="none"; $("heroMsg").innerHTML='<div class="msg ok">Reverted to default.</div>'; };

  // ---- Anniversary popup ----
  var av={on:true,num:"10",label:"Years",from:"2016",to:"2026",heading:"A Decade Of <em>Beautiful Fabric.</em>",message:"Ten years dressing your weddings, your Aso-Ebi and your best days. Thank you for celebrating with us.",cta:"Explore The Store",link:"/shop"};
  try{ var ar=await sb.from("site_settings").select("value").eq("key","anniversary").single(); if(!ar.error&&ar.data&&ar.data.value){ for(var k in ar.data.value){ av[k]=ar.data.value[k]; } } }catch(e){}
  root.insertAdjacentHTML("beforeend",
    '<div class="panel"><div class="panel-head"><h3>Anniversary Popup</h3><div style="display:flex;align-items:center;gap:10px"><span style="font-family:var(--f-util);font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:var(--taupe-deep)">Show popup</span><div class="toggle'+(av.on!==false?" on":"")+'" id="avToggle"></div></div></div>'+
    '<div style="padding:20px">'+
      '<div class="field-row">'+field("Big number","av_num","text",av.num)+field("Label","av_label","text",av.label)+'</div>'+
      '<div class="field-row">'+field("From year","av_from","text",av.from)+field("To year","av_to","text",av.to)+'</div>'+
      '<div class="field"><label>Heading (you can use &lt;em&gt; for gold italic)</label><input id="av_heading" value="'+(av.heading||"").replace(/"/g,"&quot;")+'"></div>'+
      '<div class="field"><label>Message</label><textarea id="av_message" rows="3">'+(av.message||"")+'</textarea></div>'+
      '<div class="field-row">'+field("Button text","av_cta","text",av.cta)+field("Button link","av_link","text",av.link)+'</div>'+
      '<p style="font-family:var(--f-util);font-size:.62rem;letter-spacing:.06em;text-transform:uppercase;color:var(--taupe-deep);margin:2px 0 14px">Shows once per visitor every 24 hours, with falling confetti.</p>'+
      '<button class="btn btn-dark" id="avSave">Save Popup</button> <button class="mini-btn" id="avReset" style="margin-left:8px">Reset "seen" on this device</button>'+
    '</div></div>');
  var avon=av.on!==false; $("avToggle").onclick=function(){ avon=!avon; $("avToggle").classList.toggle("on",avon); };
  $("avSave").onclick=async function(){
    var value={ on:avon, num:$("av_num").value, label:$("av_label").value, from:$("av_from").value, to:$("av_to").value,
      heading:$("av_heading").value, message:$("av_message").value, cta:$("av_cta").value, link:$("av_link").value };
    var _r=await sb.from("site_settings").upsert({key:"anniversary",value:value}); if(saveErr(null,_r))return;
    $("avSave").textContent="Saved \u2713"; setTimeout(function(){$("avSave").textContent="Save Popup";},1500); };
  $("avReset").onclick=function(){ try{ localStorage.removeItem("nbf_anniv_seen"); }catch(e){} $("avReset").textContent="Cleared \u2713"; setTimeout(function(){$("avReset").textContent='Reset "seen" on this device';},1500); };
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
