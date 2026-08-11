/* ================= NOTHINGBUH FABRICS — app.js ================= */
(function () {
"use strict";
var C = window.NBF_CONFIG || {};
var sb = window.sb || null;
var money = function (n) { return "\u20a6" + Number(n || 0).toLocaleString("en-NG"); };
var LS = { cart: "nbf_cart", wish: "nbf_wish" };

/* ---------- demo catalog (used until Supabase is configured) ---------- */
var SEED_CATS = [
  { name:"Brocade", slug:"brocade", image:"fab-brocade", description:"Structured, regal jacquard weaves." },
  { name:"Lace", slug:"lace", image:"fab-lace", description:"Delicate guipure & corded lace." },
  { name:"Sequins", slug:"sequins", image:"fab-sequin", description:"Full-coverage shimmer for statements." },
  { name:"Velvet", slug:"velvet", image:"fab-velvet", description:"Rich, light-catching evening velvet." },
  { name:"Organza", slug:"organza", image:"fab-organza", description:"Sheer, airy layering fabric." },
  { name:"Prints", slug:"prints", image:"fab-adire", description:"Adire, Ankara & heritage prints." }
];
var SEED_COLS = [
  { name:"Bridal", slug:"bridal", image:"fab-lace", description:"For the aisle and everything after." },
  { name:"Aso-Ebi", slug:"aso-ebi", image:"fab-asooke", description:"Coordinated fabrics for the family." },
  { name:"Occasion", slug:"occasion", image:"fab-sequin", description:"Statement pieces for every event." },
  { name:"Heritage", slug:"heritage", image:"fab-adire", description:"Adire, aso-oke & woven tradition." }
];
var SEED = [
  p("Champagne Brocade","champagne-brocade","Brocade","fab-brocade","fab-satin",45000,0,"brocade","aso-ebi",20,1,1,0,"A regal gold jacquard that photographs like money."),
  p("Ivory Guipure Lace","ivory-guipure-lace","Lace","fab-lace","fab-organza",52000,0,"lace","bridal",15,1,0,1,"Corded ivory lace with generous drape."),
  p("Molten Gold Sequins","molten-gold-sequins","Sequins","fab-sequin","fab-satin",60000,0,"sequins","occasion",12,1,1,0,"Full-coverage sequins for a proper entrance."),
  p("Wine Silk Velvet","wine-silk-velvet","Velvet","fab-velvet","fab-brocade",48000,0,"velvet","occasion",10,0,0,0,"Deep wine velvet with a soft light-catching pile."),
  p("Indigo Adire","indigo-adire","Prints","fab-adire","fab-ankara",30000,0,"prints","heritage",18,0,0,0,"Hand-resist indigo, rich and unmistakably heritage."),
  p("Aso-Oke Woven","aso-oke-woven","Aso-Oke","fab-asooke","fab-brocade",75000,0,"prints","heritage",6,0,0,0,"Traditional handwoven aso-oke stripe."),
  p("Blush Organza","blush-organza","Organza","fab-organza","fab-chiffon",28000,0,"organza","bridal",22,0,0,1,"Sheer blush organza for layering and volume."),
  p("Ankara Statement","ankara-statement","Prints","fab-ankara","fab-adire",18000,0,"prints","heritage",30,0,0,0,"Bold graphic Ankara for confident looks."),
  p("Rose Chiffon","rose-chiffon","Chiffon","fab-chiffon","fab-organza",22000,0,"organza","occasion",24,0,0,0,"Floaty rose chiffon with beautiful movement."),
  p("Gilded Embroidery","gilded-embroidery","Embroidery","fab-embroidery","fab-brocade",68000,0,"brocade","aso-ebi",8,0,1,0,"Gold thread embroidery on a soft base."),
  p("Onyx Sequins","onyx-sequins","Sequins","fab-sequin","fab-velvet",60000,0,"sequins","occasion",14,0,0,0,"Black-on-black sequins with a wet shine."),
  p("Pearl Satin","pearl-satin","Satin","fab-satin","fab-organza",35000,0,"organza","bridal",16,0,0,1,"Liquid pearl satin with a bridal sheen.")
];
function p(name,slug,type,sw,alt,price,sale,cat,col,stock,feat,best,newa,desc){
  return { name:name,slug:slug,fabric_type:type,swatch:sw,alt:alt,price:price,sale_price:sale||null,
    category:cat,collection:col,stock_quantity:stock,featured:!!feat,best_seller:!!best,new_arrival:!!newa,
    description:desc,colors:["#c6a35b","#5a2b34","#1a1613"],images:[] };
}

/* ---------- data layer ---------- */
function swBg(v){ return (v && v.indexOf("fab-")!==0) ? 'style="background-image:url('+v+')" class="swatch img"' : 'class="swatch '+(v||"fab-brocade")+'"'; }
function normalize(row){
  return { name:row.name, slug:row.slug, fabric_type:row.fabric_type, swatch:row.swatch,
    alt:(row.product_images&&row.product_images[1]?row.product_images[1].url:row.swatch),
    price:Number(row.price), sale_price:row.sale_price?Number(row.sale_price):null,
    category:row.category_slug||"", collection:row.collection_slug||"", stock_quantity:row.stock_quantity,
    featured:row.featured, best_seller:row.best_seller, new_arrival:row.new_arrival,
    description:row.description, colors:row.colors&&row.colors.length?row.colors:["#c6a35b","#5a2b34","#1a1613"],
    images:(row.product_images||[]).map(function(i){return i.url;}), unit:row.unit };
}
var DATA = {
  products: async function () {
    if (!sb) return SEED.slice();
    try {
      var r = await sb.from("products")
        .select("*,categories(slug),collections(slug),product_images(url,sort)")
        .eq("active", true).order("created_at", { ascending:false });
      if (r.error || !r.data) return SEED.slice();
      return r.data.map(function (row) {
        row.category_slug = row.categories && row.categories.slug;
        row.collection_slug = row.collections && row.collections.slug;
        if (row.product_images) row.product_images.sort(function(a,b){return (a.sort||0)-(b.sort||0);});
        return normalize(row);
      });
    } catch (e) { return SEED.slice(); }
  },
  categories: async function () {
    if (!sb) return SEED_CATS.slice();
    try { var r = await sb.from("categories").select("*").order("sort"); return (!r.error&&r.data&&r.data.length)?r.data:SEED_CATS.slice(); }
    catch(e){ return SEED_CATS.slice(); }
  },
  collections: async function () {
    if (!sb) return SEED_COLS.slice();
    try { var r = await sb.from("collections").select("*").order("sort"); return (!r.error&&r.data&&r.data.length)?r.data:SEED_COLS.slice(); }
    catch(e){ return SEED_COLS.slice(); }
  },
  product: async function (slug) {
    var all = await DATA.products(); return all.filter(function(x){return x.slug===slug;})[0] || null;
  }
};

/* ---------- cart / wishlist (localStorage; guest-friendly) ---------- */
function read(k){ try { return JSON.parse(localStorage.getItem(k)) || []; } catch(e){ return []; } }
function write(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
var Cart = {
  items: function(){ return read(LS.cart); },
  add: function(prod, qty){
    var c = read(LS.cart); var f = c.filter(function(x){return x.slug===prod.slug;})[0];
    if (f) f.qty += (qty||1);
    else c.push({ slug:prod.slug, name:prod.name, type:prod.fabric_type, swatch:prod.swatch,
      price:(prod.sale_price||prod.price), qty:(qty||1) });
    write(LS.cart, c); sync(); openDrawer();
  },
  set: function(slug,qty){ var c=read(LS.cart); c.forEach(function(x){if(x.slug===slug)x.qty=Math.max(1,qty);}); write(LS.cart,c); sync(); },
  remove: function(slug){ write(LS.cart, read(LS.cart).filter(function(x){return x.slug!==slug;})); sync(); },
  count: function(){ return read(LS.cart).reduce(function(a,b){return a+b.qty;},0); },
  subtotal: function(){ return read(LS.cart).reduce(function(a,b){return a+b.price*b.qty;},0); }
};
var Wish = {
  list: function(){ return read(LS.wish); },
  has: function(slug){ return read(LS.wish).indexOf(slug)>-1; },
  toggle: function(slug){ var w=read(LS.wish); var i=w.indexOf(slug); if(i>-1)w.splice(i,1); else w.push(slug); write(LS.wish,w); sync();
    if (sb) { supaWishSync(slug, i===-1); } return i===-1; },
  count: function(){ return read(LS.wish).length; }
};
async function supaWishSync(slug, added){
  try{ var u=(await sb.auth.getUser()).data.user; if(!u)return;
    var pr=await sb.from("products").select("id").eq("slug",slug).single(); if(pr.error)return;
    if(added) await sb.from("wishlist").upsert({user_id:u.id,product_id:pr.data.id});
    else await sb.from("wishlist").delete().eq("user_id",u.id).eq("product_id",pr.data.id);
  }catch(e){}
}

/* ---------- WhatsApp (secondary support only) ---------- */
function waLink(msg){ return "https://wa.me/"+(C.WA_NUMBER||"")+"?text="+encodeURIComponent(msg); }
window.waGeneral = function(){ window.open(waLink("Hello "+(C.BRAND||"Nothingbuh Fabrics")+" \uD83D\uDC4B I'd love some help."),"_blank"); return false; };
window.waProduct = function(name){ window.open(waLink("Hello "+(C.BRAND||"Nothingbuh Fabrics")+", I'm interested in "+name+". Please can you send me more details?"),"_blank"); return false; };

/* ---------- shared chrome ---------- */
var NAV = [["/shop","Shop"],["/collections","Collections"],["/new-arrivals","New Arrivals"],["/best-sellers","Best Sellers"],["/about","About"],["/contact","Contact"]];
var page = document.body.getAttribute("data-page") || "";
var hasHero = page === "home";

function icon(n){
  var s={search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>',
    heart:'<path d="M12 20s-7-4.5-9-9c-1.3-3 .5-6 3.5-6 2 0 3.5 1.5 5.5 4 2-2.5 3.5-4 5.5-4 3 0 4.8 3 3.5 6-2 4.5-9 9-9 9z"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    bag:'<path d="M6 8h12l1 12H5L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    home:'<path d="M3 10l9-7 9 7v9a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2z"/>',
    menu:'<path d="M3 6h18M3 12h18M3 18h18"/>'};
  return '<svg viewBox="0 0 24 24">'+s[n]+'</svg>';
}
function buildChrome(){
  var mm = NAV.map(function(n){return '<a href="'+n[0]+'">'+n[1]+'</a>';}).join("");
  var header =
  '<div class="announce" id="announce"></div>'+
  '<header class="nav'+(hasHero?" over":"")+'" id="nav"><div class="nav-inner">'+
    '<button class="burger nav-icons" aria-label="Menu" onclick="NBF.mob(1)">'+icon("menu")+'</button>'+
    '<a href="/" class="brand">Nothingbuh<small>Fabrics</small></a>'+
    '<nav aria-label="Primary"><ul class="menu">'+
      NAV.map(function(n){return '<li><a href="'+n[0]+'"'+(("/"+page)===n[0]||(page==="shop"&&n[0]==="/shop")?' class="active"':"")+'>'+n[1]+'</a></li>';}).join("")+
    '</ul></nav>'+
    '<div class="nav-icons">'+
      '<button class="desk-only" aria-label="Search" onclick="location.href=\'/shop\'">'+icon("search")+'</button>'+
      '<button class="desk-only" aria-label="Account" onclick="location.href=\'/account\'">'+icon("user")+'</button>'+
      '<button class="desk-only" aria-label="Wishlist" onclick="location.href=\'/shop\'">'+icon("heart")+'<span class="badge" data-wishbadge>0</span></button>'+
      '<button aria-label="Cart" onclick="NBF.drawer(1)">'+icon("bag")+'<span class="badge" data-bagbadge>0</span></button>'+
    '</div>'+
  '</div></header>'+
  '<div class="mobmenu" id="mobmenu"><div class="top"><span class="serif">Nothingbuh Fabrics</span>'+
    '<button aria-label="Close" onclick="NBF.mob(0)"><svg width="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>'+
    '<nav>'+mm+'</nav>'+
    '<div class="foot"><a href="/account" class="btn btn-line">My Account</a><a href="#" onclick="return waGeneral()" class="btn btn-gold">Chat With Us</a></div></div>';

  var footer =
  '<footer><div class="wrap">'+
    '<div class="foot-cta"><span class="eyebrow" style="color:var(--taupe)">Join The List</span>'+
      '<h2 class="serif">First Look At <em>New Fabrics.</em></h2>'+
      '<p style="color:var(--taupe);max-width:36ch;margin:0 auto;font-weight:300">Fresh arrivals and seasonal edits before they reach the grid.</p>'+
      '<form onsubmit="return NBF.subscribe(event,this)"><input type="email" required placeholder="Your email address" aria-label="Email"><button type="submit">Subscribe</button></form></div>'+
    '<div class="foot-main">'+
      '<div class="foot-brand"><span class="serif">Nothingbuh Fabrics</span><p>A luxury Nigerian textile house. Beautiful fabrics for weddings, celebrations and the outfits worth remembering.</p></div>'+
      '<div class="foot-col"><h4>Shop</h4><a href="/shop">All Fabrics</a><a href="/collections">Collections</a><a href="/new-arrivals">New Arrivals</a><a href="/best-sellers">Best Sellers</a></div>'+
      '<div class="foot-col"><h4>Help</h4><a href="/contact">Contact</a><a href="/contact">Delivery &amp; Pickup</a><a href="/contact">Aso-Ebi Orders</a><a href="/account">My Account</a></div>'+
      '<div class="foot-col"><h4>Contact</h4><a href="#" onclick="return waGeneral()">WhatsApp Us</a><a href="#">'+(C.IG_HANDLE||"@nothingbuhfabrics")+'</a><a href="/about">Our Story</a></div>'+
    '</div>'+
    '<div class="foot-bottom"><span>\u00a9 2026 Nothingbuh Fabrics \u00b7 Lagos, Nigeria</span><span>Paystack \u00b7 Flutterwave \u00b7 Bank Transfer</span></div>'+
  '</div></footer>';

  var mobnav =
  '<nav class="mobnav" aria-label="Mobile">'+
    '<a href="/">'+icon("home")+'Home</a>'+
    '<a href="/shop">'+icon("bag")+'Shop</a>'+
    '<a href="/shop">'+icon("search")+'Search</a>'+
    '<a href="/account">'+icon("user")+'Account</a>'+
    '<button onclick="NBF.drawer(1)">'+icon("bag")+'Cart<span class="badge" data-bagbadge>0</span></button>'+
  '</nav>';

  var drawer =
  '<div class="scrim" id="scrim" onclick="NBF.drawer(0)"></div>'+
  '<aside class="drawer" id="drawer" aria-label="Cart" aria-hidden="true">'+
    '<div class="drawer-head"><h3>Your Bag</h3><button class="drawer-x" aria-label="Close" onclick="NBF.drawer(0)"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>'+
    '<div class="bag-list" id="bagList"></div>'+
    '<div class="drawer-foot"><div class="row"><span>Subtotal</span><span id="bagSub">'+money(0)+'</span></div>'+
      '<a href="/cart" class="btn btn-line btn-block" style="margin-bottom:8px">View Bag</a>'+
      '<a href="/checkout" class="btn btn-gold btn-block">Checkout</a></div>'+
  '</aside>';

  var modal =
  '<div class="modal-scrim" id="qvScrim" onclick="if(event.target===this)NBF.closeQuick()"><div class="modal" id="qv">'+
    '<div class="modal-img"><div class="swatch" id="qvSw"></div></div>'+
    '<div class="modal-body"><button class="modal-x" aria-label="Close" onclick="NBF.closeQuick()"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>'+
      '<span class="eyebrow" id="qvType">Fabric</span><h3 id="qvName">Fabric</h3><div class="price" id="qvPrice"></div>'+
      '<p id="qvDesc" style="color:var(--espresso);font-size:.9rem;margin-bottom:16px"></p>'+
      '<div class="modal-actions"><a href="#" id="qvLink" class="btn btn-line btn-block">View Full Details</a>'+
        '<button class="btn btn-dark btn-block" id="qvAdd">Add To Bag</button></div></div>'+
  '</div></div>';

  var wa = '<a href="#" class="wa-float" aria-label="Chat on WhatsApp" onclick="return waGeneral()"><span class="wa-tip">Need help? Chat with us</span>'+
    '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.9.9-2.8-.2-.3A8 8 0 1 1 12 20zm4.5-6c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.7.9-.3.2-.5 0a6.5 6.5 0 0 1-1.9-1.2 7.2 7.2 0 0 1-1.3-1.7c-.1-.2 0-.4.1-.5l.4-.4.2-.4v-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3A2.8 2.8 0 0 0 6.5 8a4.9 4.9 0 0 0 1 2.6 11 11 0 0 0 4.3 3.8c2 .8 2 .5 2.4.5a2.5 2.5 0 0 0 1.6-1.1 2 2 0 0 0 .1-1.1c0-.1-.2-.2-.4-.3z"/></svg></a>';

  document.body.insertAdjacentHTML("afterbegin", header);
  document.body.insertAdjacentHTML("beforeend", footer + mobnav + drawer + modal + wa);
  document.body.classList.add("has-mobnav");
}

/* ---------- announcement ---------- */
async function initAnnounce(){
  var el = document.getElementById("announce"); if(!el) return;
  var msgs = ["New Fabrics In \u2014 Curated For The Season","Nationwide Delivery \u2014 Lagos Same-Day Available","Shopping For Aso-Ebi? Message Us For Group Orders"];
  var on = true;
  if (sb) { try { var r = await sb.from("site_settings").select("value").eq("key","announcement").single();
    if (!r.error && r.data && r.data.value){ on = r.data.value.on !== false; if(r.data.value.messages&&r.data.value.messages.length) msgs=r.data.value.messages; } } catch(e){} }
  if (!on){ el.style.display="none"; return; }
  el.innerHTML = msgs.map(function(m,i){return '<span'+(i===0?' class="on"':'')+'>'+m+'</span>';}).join("");
  if (msgs.length>1){ var i=0, sp=el.querySelectorAll("span");
    setInterval(function(){ sp[i].classList.remove("on"); i=(i+1)%sp.length; sp[i].classList.add("on"); }, 4200); }
}

/* ---------- anniversary popup ---------- */
function confetti(n){
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var host=document.createElement("div"); host.className="confetti"; document.body.appendChild(host);
  var colors=["#c6a35b","#d8bd82","#ece3d2","#5a2b34","#e8d9b0"];
  for(var i=0;i<n;i++){
    var s=document.createElement("i"); var size=6+Math.random()*8;
    s.style.left=(Math.random()*100)+"vw";
    s.style.width=size+"px"; s.style.height=(size*(0.5+Math.random()))+"px";
    s.style.background=colors[i%colors.length];
    s.style.animationDuration=(3+Math.random()*3.5)+"s";
    s.style.animationDelay=(Math.random()*2.2)+"s";
    if(Math.random()>0.62) s.style.borderRadius="50%";
    host.appendChild(s);
  }
  setTimeout(function(){ if(host.parentNode) host.remove(); }, 9500);
}
async function initAnniversary(){
  var KEY="nbf_anniv_seen";
  try{ var last=localStorage.getItem(KEY); if(last && (Date.now()-(+last))<86400000) return; }catch(e){}
  var a={ on:true, num:"10", label:"Years", from:"2016", to:"2026",
    heading:"A Decade Of <em>Beautiful Fabric.</em>",
    message:"Ten years dressing your weddings, your Aso-Ebi and your best days. Thank you for celebrating with us.",
    cta:"Explore The Store", link:"/shop" };
  if(sb){ try{ var r=await sb.from("site_settings").select("value").eq("key","anniversary").single();
    if(!r.error && r.data && r.data.value){ for(var k in r.data.value){ a[k]=r.data.value[k]; } } }catch(e){} }
  if(a.on===false) return;
  var html='<div class="anniv-scrim" id="annivScrim"><div class="anniv" role="dialog" aria-label="Anniversary">'+
    '<button class="anniv-x" aria-label="Close" onclick="NBF.closeAnniv()"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>'+
    '<div class="anniv-eyebrow">Nothingbuh Fabrics</div>'+
    '<div class="anniv-num">'+a.num+'</div>'+
    '<div class="anniv-years">'+a.from+' \u2014 '+a.to+' \u00b7 '+a.label+'</div>'+
    '<div class="anniv-rule"></div>'+
    '<h2>'+a.heading+'</h2>'+
    '<p>'+a.message+'</p>'+
    '<a href="'+(a.link||"/shop")+'" class="btn btn-gold" onclick="NBF.closeAnniv()">'+a.cta+'</a>'+
  '</div></div>';
  document.body.insertAdjacentHTML("beforeend", html);
  try{ localStorage.setItem(KEY, Date.now()); }catch(e){}
  setTimeout(function(){ var s=document.getElementById("annivScrim"); if(s){ s.classList.add("open"); confetti(48);
    s.addEventListener("click",function(e){ if(e.target===s) NBF.closeAnniv(); }); } }, 650);
}

/* ---------- render helpers ---------- */
function badges(pr){
  var h="";
  if (pr.stock_quantity<=0) h+='<span class="tag sold">Out Of Stock</span>';
  else { if(pr.new_arrival) h+='<span class="tag new">New</span>'; if(pr.best_seller) h+='<span class="tag">Best Seller</span>'; if(pr.sale_price) h+='<span class="tag sale">Sale</span>'; }
  return h;
}
function priceHtml(pr){
  if (pr.sale_price) return '<span class="price"><del>'+money(pr.price)+'</del>'+money(pr.sale_price)+'</span>';
  return '<span class="price">'+money(pr.price)+'</span>';
}
function cardHtml(pr){
  var on = Wish.has(pr.slug)?" on":"";
  return '<article class="card" data-slug="'+pr.slug+'">'+
    '<div class="card-img">'+
      '<a class="card-tags" href="/product?slug='+pr.slug+'">'+badges(pr)+'</a>'+
      '<button class="wish'+on+'" aria-label="Save" onclick="NBF.wish(\''+pr.slug+'\',this)"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.5-9-9c-1.3-3 .5-6 3.5-6 2 0 3.5 1.5 5.5 4 2-2.5 3.5-4 5.5-4 3 0 4.8 3 3.5 6-2 4.5-9 9-9 9z"/></svg></button>'+
      '<a href="/product?slug='+pr.slug+'" '+swBg(pr.swatch).replace('class="swatch','class="swatch main')+'></a>'+
      '<div '+swBg(pr.alt||pr.swatch).replace('class="swatch','class="swatch alt')+'></div>'+
      '<div class="card-hover"><button class="mini ghost" onclick="NBF.quick(\''+pr.slug+'\')">Quick View</button>'+
        '<button class="mini" onclick="NBF.add(\''+pr.slug+'\')">Add To Bag</button></div>'+
    '</div>'+
    '<h3><a href="/product?slug='+pr.slug+'">'+pr.name+'</a></h3>'+
    '<div class="type">'+pr.fabric_type+'</div>'+
    '<div class="foot">'+priceHtml(pr)+'<span class="dots"><i style="background:'+(pr.colors[0]||"#c6a35b")+'"></i><i style="background:'+(pr.colors[1]||"#5a2b34")+'"></i><i style="background:'+(pr.colors[2]||"#1a1613")+'"></i></span></div>'+
  '</article>';
}
function paintCards(container, list){
  if (!list.length){ container.innerHTML='<div class="empty"><h3>No fabrics found</h3><p>Try another search, or ask us on WhatsApp \u2014 we may have it off-catalog.</p></div>'; return; }
  container.innerHTML = list.map(cardHtml).join("");
  var cards = container.querySelectorAll(".card");
  requestAnimationFrame(function(){ cards.forEach(function(c,i){ setTimeout(function(){c.classList.add("in");}, i*40); }); });
}
function tileHtml(item, hrefBase){
  return '<a href="'+hrefBase+item.slug+'" class="tile"><div '+swBg(item.image)+'></div>'+
    '<div class="tile-veil"><h3>'+item.name+'</h3><p>'+(item.description||"")+'</p><span class="go">Explore \u2192</span></div></a>';
}

/* ---------- sync badges + drawer ---------- */
function sync(){
  var bc = Cart.count(), wc = Wish.count();
  document.querySelectorAll("[data-bagbadge]").forEach(function(b){ b.textContent=bc; b.classList.toggle("show",bc>0); });
  document.querySelectorAll("[data-wishbadge]").forEach(function(b){ b.textContent=wc; b.classList.toggle("show",wc>0); });
  document.querySelectorAll(".card .wish").forEach(function(w){ var s=w.closest(".card").getAttribute("data-slug"); w.classList.toggle("on",Wish.has(s)); });
  renderDrawer();
}
function renderDrawer(){
  var list=document.getElementById("bagList"); if(!list) return;
  var items=Cart.items();
  document.getElementById("bagSub").textContent=money(Cart.subtotal());
  if(!items.length){ list.innerHTML='<div class="bag-empty"><svg viewBox="0 0 24 24"><path d="M6 8h12l1 12H5L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg><p>Your bag is empty.</p><p style="font-size:.82rem;margin-top:6px">Add fabrics you love and they\'ll wait here.</p></div>'; return; }
  list.innerHTML=items.map(function(it){ return '<div class="bag-item"><div '+swBg(it.swatch).replace('class="swatch','class="sw swatch')+'></div>'+
    '<div><h4>'+it.name+'</h4><div class="t">'+(it.type||"")+'</div>'+
    '<div class="qtyrow"><button onclick="NBF.qty(\''+it.slug+'\',-1)">\u2212</button><span>'+it.qty+'</span><button onclick="NBF.qty(\''+it.slug+'\',1)">+</button>'+
    '<button class="rm" onclick="NBF.rm(\''+it.slug+'\')">Remove</button></div>'+
    '<div class="p">'+money(it.price*it.qty)+'</div></div></div>'; }).join("");
}
function openDrawer(){ NBF.drawer(1); }

/* ---------- public API ---------- */
window.NBF = {
  money: money, DATA: DATA, swBg: swBg, cardHtml: cardHtml, paintCards: paintCards, tileHtml: tileHtml,
  mob:function(o){ document.getElementById("mobmenu").classList.toggle("open",!!o); },
  drawer:function(o){ document.getElementById("drawer").classList.toggle("open",!!o); document.getElementById("scrim").classList.toggle("open",!!o);
    document.getElementById("drawer").setAttribute("aria-hidden",o?"false":"true"); if(o)renderDrawer(); },
  add: async function(slug,qty){ var pr=await DATA.product(slug); if(pr)Cart.add(pr,qty||1); },
  qty:function(slug,d){ var it=Cart.items().filter(function(x){return x.slug===slug;})[0]; if(it)Cart.set(slug,it.qty+d); },
  rm:function(slug){ Cart.remove(slug); },
  wish:function(slug,btn){ var on=Wish.toggle(slug); if(btn)btn.classList.toggle("on",on); },
  quick: async function(slug){ var pr=await DATA.product(slug); if(!pr)return;
    var sw=document.getElementById("qvSw"); sw.className=""; sw.removeAttribute("style");
    if(pr.swatch&&pr.swatch.indexOf("fab-")!==0){ sw.className="swatch img"; sw.style.backgroundImage="url("+pr.swatch+")"; }
    else sw.className="swatch "+(pr.swatch||"fab-brocade");
    document.getElementById("qvName").textContent=pr.name;
    document.getElementById("qvType").textContent=pr.fabric_type;
    document.getElementById("qvDesc").textContent=pr.description||"";
    document.getElementById("qvPrice").innerHTML=priceHtml(pr);
    document.getElementById("qvLink").href="/product?slug="+pr.slug;
    document.getElementById("qvAdd").onclick=function(){ Cart.add(pr,1); NBF.closeQuick(); };
    document.getElementById("qvScrim").classList.add("open"); },
  closeQuick:function(){ document.getElementById("qvScrim").classList.remove("open"); },
  closeAnniv:function(){ var s=document.getElementById("annivScrim"); if(s)s.classList.remove("open"); },
  subscribe: async function(e,form){ e.preventDefault(); var email=form.querySelector("input").value;
    if(sb){ try{ await sb.from("subscribers").insert({email:email}); }catch(err){} }
    form.querySelector("button").textContent="Added \u2713"; form.reset(); return false; },
  Cart: Cart, Wish: Wish, sync: sync
};

/* ---------- scroll chrome ---------- */
function onScroll(){ var nav=document.getElementById("nav"); if(!nav)return;
  if(hasHero){ nav.classList.toggle("over", window.scrollY<60); } }

/* ---------- boot ---------- */
document.addEventListener("DOMContentLoaded", function(){
  buildChrome(); sync(); initAnnounce(); initAnniversary();
  window.addEventListener("scroll", onScroll, {passive:true}); onScroll();
  document.addEventListener("keydown", function(e){ if(e.key==="Escape"){ NBF.drawer(0); NBF.closeQuick(); NBF.mob(0); NBF.closeAnniv(); }});
  var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add("in");io.unobserve(x.target);}});},{threshold:.12});
  document.querySelectorAll(".reveal").forEach(function(el){io.observe(el);});
  if (window.NBF_PAGE) window.NBF_PAGE();   // page-specific init defined inline per page
});
})();
