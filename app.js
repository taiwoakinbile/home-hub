(function(){
var RM=matchMedia("(prefers-reduced-motion: reduce)").matches,lastTab="",KEY="chore-rota-v1",UN={d:"day",w:"week",m:"month",y:"year"},DAYS={d:1,w:7,m:30,y:365},tab="due",freq="1m";
var S={chores:[],partners:[],seeded:false};
function load(){try{var r=localStorage.getItem(KEY);if(r)S=JSON.parse(r)}catch(e){}S.meals=S.meals||{};S.shop=S.shop||[];S.bills=S.bills||[];S.log=S.log||[];S.prefs=Object.assign({daily:true,dTime:"07:30",weekly:true,wDay:0,wTime:"18:00",lastD:"",lastW:""},S.prefs||{})}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
var $=function(i){return document.getElementById(i)};
function esc(s){var d=document.createElement("div");d.textContent=s==null?"":s;return d.innerHTML}
function iso(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function parse(s){var p=s.split("-");return new Date(+p[0],+p[1]-1,+p[2])}
function today(){var d=new Date();return new Date(d.getFullYear(),d.getMonth(),d.getDate())}
function add(d,n,u){var x=new Date(d);if(u==="d")x.setDate(x.getDate()+n);else if(u==="w")x.setDate(x.getDate()+7*n);else{var day=x.getDate();x.setDate(1);if(u==="m")x.setMonth(x.getMonth()+n);else x.setFullYear(x.getFullYear()+n);x.setDate(Math.min(day,new Date(x.getFullYear(),x.getMonth()+1,0).getDate()))}return x}
function diff(a,b){return Math.round((a-b)/864e5)}
function every(c){return c.n===1?"Every "+UN[c.u]:"Every "+c.n+" "+UN[c.u]+"s"}
function label(c){var k=c.n+c.u;return {"1w":"Weekly","2w":"Every 2 weeks","1m":"Monthly","3m":"Every 3 months","1y":"Yearly"}[k]||every(c)}
function uid(){return Math.random().toString(36).slice(2,9)}
function pname(id){var p=S.partners.filter(function(p){return p.id===id})[0];return p?p.name:""}
function fdate(s){return parse(s).toLocaleDateString(undefined,{weekday:"short",day:"numeric",month:"short"})}

var STARTER=[["Curtains",3,"m"],["Bedsheets and duvet",2,"w"],["Rugs",1,"m"],["Declutter",1,"m"],["Kitchen cabinets",1,"m"],["Wardrobes",3,"m"],["Pantry",1,"m"],["Cobwebs",1,"m"],["Pots and pans",1,"w"],["Plate and rack",1,"w"],["Balcony",2,"w"],["Toilets",1,"w"],["Bedrooms",1,"w"],["Work station",1,"w"],["Smoke alarm batteries",6,"m"],["Clean washing machine",1,"m"],["Clean fridge",1,"m"],["Clean oven",3,"m"],["Descale kettle and taps",1,"m"],["Replace air or water filters",3,"m"],["Defrost freezer",6,"m"],["Flip or rotate mattress",3,"m"],["Wash bins",1,"m"],["Check first aid kit",6,"m"],["Clear gutters and drains",6,"m"],["Clean windows",3,"m"]];
function seed(){if(S.seeded)return;S.seeded=true;STARTER.slice(0,14).forEach(function(s,i){S.chores.push({id:uid(),name:s[0],n:s[1],u:s[2],next:iso(add(today(),i%7,"d")),who:"",notified:""})});save()}

function row(c){
  var d=diff(parse(c.next),today()),chip=d<0?'<span class="chip od">'+(-d)+'d overdue</span>':d===0?'<span class="chip today">Today</span>':'<span class="chip">'+fdate(c.next)+'</span>';
  var sel=S.partners.length?'<select data-act="assign" data-id="'+c.id+'" aria-label="Assign '+esc(c.name)+'"><option value="">Anyone</option>'+S.partners.map(function(p){return '<option value="'+p.id+'"'+(p.id===c.who?' selected':'')+'>'+esc(p.name)+'</option>'}).join("")+'</select>':'';
  return '<div class="row"><button class="done" data-act="done" data-id="'+c.id+'" aria-label="Mark '+esc(c.name)+' done" title="Mark done">&#10003;</button>'+
  '<div><div class="name">'+esc(c.name)+'</div><div class="meta">'+label(c)+(c.who?' · '+esc(pname(c.who)):'')+'</div>'+
  '<div class="acts">'+sel+'<a class="btn ghost sm" target="_blank" rel="noopener" href="'+gcal(c)+'">Calendar</a><button class="btn ghost sm" data-act="del" data-id="'+c.id+'">Remove</button></div></div>'+chip+'</div>';
}
function block(title,items){return '<h2><span>'+title+'</span><span>'+items.length+'</span></h2><div class="card">'+items.map(row).join("")+'</div>'}
function byDate(a,b){return a.next<b.next?-1:a.next>b.next?1:0}

function render(){
  var t=today(),od=0,wk=0;
  S.chores.forEach(function(c){var d=diff(parse(c.next),t);if(d<0)od++;if(d>=0&&d<=6)wk++});
  countTo("sOd",od);countTo("sWeek",wk);countTo("sAll",S.chores.length);
  document.querySelectorAll(".tab").forEach(function(b){b.setAttribute("aria-selected",b.dataset.tab===tab)});
  $("vDue").hidden=tab!=="due";$("vMeals").hidden=tab!=="meals";$("vShop").hidden=tab!=="shop";$("vBills").hidden=tab!=="bills";$("open").hidden=!(tab==="due"||tab==="all");
  if(tab!==lastTab){lastTab=tab;["vDue","vAll","vMeals","vShop","vBills","vPeople"].forEach(function(i){$(i).classList.remove("enter")});var av=$({due:"vDue",all:"vAll",meals:"vMeals",shop:"vShop",bills:"vBills",people:"vPeople"}[tab]);void av.offsetWidth;av.classList.add("enter");setTimeout(function(){av.classList.remove("enter")},900)}$("vAll").hidden=tab!=="all";$("vPeople").hidden=tab!=="people";
  var who=S.partners.map(function(p){return '<option value="'+p.id+'">'+esc(p.name)+'</option>'}).join("");
  var fv=$("fWho").value||"all";$("fWho").innerHTML='<option value="all">Everyone</option><option value="none">Unassigned</option>'+who;$("fWho").value=fv;if(!$("fWho").value)$("fWho").value="all";
  var cv=$("cWho").value;$("cWho").innerHTML='<option value="">Anyone</option>'+who;$("cWho").value=cv;
  // To do
  var sorted=S.chores.slice().sort(byDate),h="";
  [["Overdue chores",function(d){return d<0}],["Chores today",function(d){return d===0}]].forEach(function(g){
    var it=sorted.filter(function(c){return g[1](diff(parse(c.next),t))});if(it.length)h+=block(g[0],it)});
  $("vDue").innerHTML=h||'<h2><span>Chores today</span></h2><p class="empty">No chores due today. Enjoy!</p>';
  // All chores grouped by frequency
  var q=$("q").value.trim().toLowerCase(),f=$("fWho").value,list=sorted.filter(function(c){return (!q||c.name.toLowerCase().indexOf(q)>-1)&&(f==="all"||(f==="none"?!c.who:c.who===f))});
  var groups={};list.forEach(function(c){var k=label(c);(groups[k]=groups[k]||{days:c.n*DAYS[c.u],items:[]}).items.push(c)});
  var ah=Object.keys(groups).sort(function(a,b){return groups[a].days-groups[b].days}).map(function(k){return block(k,groups[k].items)}).join("");
  $("allList").innerHTML=ah||'<p class="empty">No chores match. Tap "+ Add chore" to create one.</p>';
  var miss=STARTER.map(function(s,i){return [s,i]}).filter(function(x){return !S.chores.some(function(c){return c.name.toLowerCase()===x[0][0].toLowerCase()})});
  $("sugg").innerHTML=miss.length?'<button class="pick" data-act="quickall" style="background:var(--acc);color:var(--onacc)">Add all '+miss.length+'</button>'+miss.map(function(x){return '<button class="pick" data-act="quick" data-i="'+x[1]+'">'+esc(x[0][0])+'</button>'}).join(""):'<span class="meta">All suggested chores are already added.</span>';
  renderMore();
  // Partners
  $("partners").innerHTML=S.partners.length?S.partners.map(function(p){var n=S.chores.filter(function(c){return c.who===p.id}).length;
    return '<div class="partner"><div><b>'+esc(p.name)+'</b><div class="meta">'+n+' chores'+(p.mail?' · '+esc(p.mail):'')+'</div></div><div class="acts" style="margin:0">'+(p.mail?'<a class="btn ghost sm" href="'+mail(p)+'">Email reminder</a>':'')+'<button class="btn ghost sm" data-act="delp" data-id="'+p.id+'">Remove</button></div></div>'}).join(""):'<p class="empty">No partners yet. Add one below, then assign chores to them.</p>';
}
var DN=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],SL=[["b","Breakfast"],["l","Lunch"],["d","Dinner"]],
IDEAS=["Jollof rice and chicken","Spaghetti bolognese","Veggie stir-fry","Grilled fish and salad","Lentil soup","Chicken curry","Tacos","Egg fried rice","Pasta bake","Roast chicken and veg","Bean stew","Pancakes","Sandwich night","Pizza night"],
SHOPQ=["Milk","Eggs","Bread","Rice","Fruit","Vegetables","Toilet paper","Dish soap","Laundry detergent","Bin bags","Cleaning spray"],
BILLQ=["Rent or mortgage","Electricity","Water","Internet","Phone","Insurance","Subscriptions","Waste collection"];
function qa(s){return esc(s).replace(/"/g,"&quot;")}
function chip(c){var d=diff(parse(c.next),today());return d<0?'<span class="chip od">'+(-d)+'d overdue</span>':d===0?'<span class="chip today">Today</span>':'<span class="chip">'+fdate(c.next)+'</span>'}
function billRow(c){return '<div class="row"><button class="done" data-act="bdone" data-id="'+c.id+'" aria-label="Mark '+qa(c.name)+' paid" title="Mark paid">&#10003;</button><div><div class="name">'+esc(c.name)+'</div><div class="meta">'+label(c)+(c.amt?' · '+c.amt:'')+'</div><div class="acts"><a class="btn ghost sm" target="_blank" rel="noopener" href="'+gcal(c)+'">Calendar</a><button class="btn ghost sm" data-act="bdel" data-id="'+c.id+'">Remove</button></div></div>'+chip(c)+'</div>'}
function renderMore(){
  var td=(new Date().getDay()+6)%7,opts=function(sel){return S.partners.map(function(p){return '<option value="'+p.id+'"'+(p.id===sel?' selected':'')+'>'+esc(p.name)+'</option>'}).join("")};
  $("mealGrid").innerHTML=DN.map(function(n,i){return '<div class="card day'+(i===td?' today':'')+'"><h3>'+n+(i===td?' · today':'')+'</h3>'+SL.map(function(s){return '<div class="slot"><span>'+s[1]+'</span><input data-meal="'+i+s[0]+'" value="'+qa(S.meals[i+s[0]]||"")+'" placeholder="Plan a meal" aria-label="'+n+' '+s[1]+'"></div>'}).join("")+(S.partners.length?'<div class="slot"><span>Cooks</span><select data-meal="'+i+'c" aria-label="'+n+' cook"><option value="">Anyone</option>'+opts(S.meals[i+"c"])+'</select></div>':'')+'</div>'}).join("");
  var sq=SHOPQ.filter(function(t){return !S.shop.some(function(x){return x.t.toLowerCase()===t.toLowerCase()})});
  $("shopQ").innerHTML=sq.map(function(t){return '<button class="pick" data-act="sq" data-t="'+qa(t)+'">+ '+esc(t)+'</button>'}).join("");
  var items=S.shop.filter(function(x){return !x.d}).concat(S.shop.filter(function(x){return x.d}));
  $("shopList").innerHTML=items.length?'<div class="card">'+items.map(function(x){return '<div class="tick'+(x.d?' d':'')+'"><input type="checkbox" data-act="stick" data-id="'+x.id+'"'+(x.d?' checked':'')+' aria-label="Got '+qa(x.t)+'"><span>'+esc(x.t)+'</span><button class="btn ghost sm" data-act="sdel" data-id="'+x.id+'" aria-label="Remove '+qa(x.t)+'">&#10005;</button></div>'}).join("")+'</div>'+(S.shop.some(function(x){return x.d})?'<div class="acts"><button class="btn ghost" data-act="sclear">Clear ticked items</button></div>':''):'<p class="empty">Your shopping list is empty. Add items above, or send your meal plan here.</p>';
  $("billQ").innerHTML=BILLQ.map(function(t){return '<button class="pick" data-act="bq" data-t="'+qa(t)+'">'+esc(t)+'</button>'}).join("");
  if(!$("bDue").value)$("bDue").value=iso(today());
  var bs=S.bills.slice().sort(byDate),tot=0;bs.forEach(function(c){tot+=(c.amt||0)*30/(c.n*DAYS[c.u])});
  $("billList").innerHTML=bs.length?'<div class="card">'+bs.map(billRow).join("")+'</div>'+(tot>0?'<p class="note">Estimated monthly total: '+tot.toFixed(2)+'</p>':''):'<p class="empty">No bills yet. Tap a suggestion above, then set the amount and due date.</p>';
  var h0=new Date().getHours(),cur=h0<11?"b":h0<16?"l":"d",t=today(),pr=S.prefs,
  tm=SL.map(function(x){var m=S.meals[td+x[0]];return '<div class="slot'+(x[0]===cur?' now':'')+'"><span>'+x[1]+'</span><b>'+(m?esc(m):'<i class="meta">Not planned</i>')+'</b></div>'}).join(""),
  cook=S.meals[td+"c"]?'<div class="slot"><span>Cooks</span><b>'+esc(pname(S.meals[td+"c"]))+'</b></div>':'',
  none=!S.meals[td+"b"]&&!S.meals[td+"l"]&&!S.meals[td+"d"],
  soon=bs.filter(function(c){return diff(parse(c.next),t)<=7}),buy=S.shop.filter(function(x){return !x.d});
  $("vDue").insertAdjacentHTML("afterbegin",heroHtml()+'<h2 style="font-size:1.35rem;color:var(--ink);margin-top:4px"><span>'+t.toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long"})+'</span></h2><h2><span>Meals today</span></h2><div class="card" style="padding:10px 14px">'+tm+cook+(none?'<div class="acts"><button class="btn ghost sm" data-act="go" data-id="meals">Plan meals</button></div>':'')+'</div>');
  var wk=weekData(),rows=wk.map(function(w,i){var c3=w.ch.length>3?w.ch.slice(0,3).join(", ")+" +"+(w.ch.length-3):w.ch.join(", ");
    return '<div class="row" style="grid-template-columns:72px 1fr"><div><div class="name">'+(i===0?"Today":w.d.toLocaleDateString(undefined,{weekday:"short"}))+'</div><div class="meta">'+w.d.getDate()+' '+w.d.toLocaleDateString(undefined,{month:"short"})+'</div></div><div><div class="meta">Dinner: <b>'+(w.dn?esc(w.dn):'not planned')+'</b></div><div>'+(w.ch.length?'<span class="meta">'+w.ch.length+' chore'+(w.ch.length===1?'':'s')+': </span>'+esc(c3):'<span class="meta">No chores</span>')+'</div>'+(w.bl.length?'<div class="meta">Bills: '+esc(w.bl.join(", "))+'</div>':'')+'</div></div>'}).join("");
  $("vDue").insertAdjacentHTML("beforeend",'<h2><span>To buy</span><span>'+buy.length+'</span></h2>'+(buy.length?'<div class="card">'+buy.slice(0,8).map(function(x){return '<div class="tick"><input type="checkbox" data-act="stick" data-id="'+x.id+'" aria-label="Got '+qa(x.t)+'"><span>'+esc(x.t)+'</span></div>'}).join("")+'</div>'+(buy.length>8?'<p class="note">+ '+(buy.length-8)+' more in Shopping</p>':''):'<p class="empty">Nothing on the shopping list.</p>')+
    (soon.length?'<h2><span>Bills due soon</span><span>'+soon.length+'</span></h2><div class="card">'+soon.map(billRow).join("")+'</div>':'')+
    '<h2><span>Week ahead</span><button class="btn ghost sm" data-act="shareweek">Share week</button></h2><div class="card">'+rows+'</div>');
  $("pDaily").checked=!!pr.daily;$("pdT").value=pr.dTime;$("pWeekly").checked=!!pr.weekly;$("pwD").value=String(pr.wDay);$("pwT").value=pr.wTime;
  requestAnimationFrame(function(){requestAnimationFrame(function(){var r=$("ring");if(r)r.style.strokeDashoffset=r.getAttribute("data-off")})});
}
function weekData(){var t=today(),wk=[];for(var i=0;i<7;i++){var d=add(t,i,"d");wk.push({d:d,ch:[],bl:[],dn:S.meals[((d.getDay()+6)%7)+"d"]||""})}
  [[S.chores,"ch"],[S.bills,"bl"]].forEach(function(g){g[0].forEach(function(c){var x=parse(c.next),n=0;while(diff(x,t)<=6&&n<60){wk[Math.max(0,diff(x,t))][g[1]].push(c.name);x=add(x,c.n,c.u);n++}})});return wk}
function weekText(){return "Week ahead\n"+weekData().map(function(w){return w.d.toLocaleDateString(undefined,{weekday:"short",day:"numeric",month:"short"})+": "+(w.dn?"dinner "+w.dn+"; ":"")+(w.ch.length?w.ch.join(", "):"no chores")+(w.bl.length?"; bills: "+w.bl.join(", "):"")}).join("\n")}
function weekSum(){var w=weekData(),c=0,b=0,m=0;w.forEach(function(x){c+=x.ch.length;b+=x.bl.length;if(x.dn)m++});return c+" chores, "+b+" bills due, "+m+" dinners planned."}
function dayText(){var t=iso(today()),td=(new Date().getDay()+6)%7,due=S.chores.filter(function(c){return c.next<=t}).length,buy=S.shop.filter(function(x){return !x.d}).length,bl=S.bills.filter(function(c){return c.next<=t}).length,m=S.meals[td+"d"];
  return (m?"Dinner: "+m+". ":"")+due+" chore"+(due===1?"":"s")+" due"+(buy?", "+buy+" to buy":"")+(bl?", "+bl+" bill"+(bl===1?"":"s")+" due":"")+"."}
function countTo(id,v){var el=$(id),from=+el.textContent||0;if(RM||from===v){el.textContent=v;return}var t0=performance.now();(function f(n){var k=Math.min(1,(n-t0)/500);el.textContent=Math.round(from+(v-from)*k);if(k<1)requestAnimationFrame(f)})(t0)}
function streak(){var set={};S.log.forEach(function(d){set[d]=1});var d=today(),n=0;if(!set[iso(d)])d=add(d,-1,"d");while(set[iso(d)]){n++;d=add(d,-1,"d")}return n}
function heroHtml(){var t=iso(today()),due=S.chores.filter(function(c){return c.next<=t}).length,dn=S.log.filter(function(d){return d===t}).length,tot=due+dn,p=tot?dn/tot:0,h=new Date().getHours(),g=h<12?"Good morning":h<18?"Good afternoon":"Good evening",C=188.5,st=streak();
  return '<div class="hero"><svg class="ring" viewBox="0 0 72 72" width="72" height="72" aria-hidden="true"><circle cx="36" cy="36" r="30" fill="none" stroke="var(--line)" stroke-width="7"/><circle id="ring" cx="36" cy="36" r="30" fill="none" stroke="var(--ok)" stroke-width="7" stroke-linecap="round" stroke-dasharray="'+C+'" stroke-dashoffset="'+C+'" data-off="'+(C*(1-p))+'" transform="rotate(-90 36 36)"/><text x="36" y="41" text-anchor="middle" font-size="16" font-weight="700" fill="currentColor">'+Math.round(p*100)+'%</text></svg><div><div class="name" style="font-size:1.2rem">'+g+'</div><div class="meta">'+(tot?dn+' of '+tot+' chores done today':'No chores due today')+'</div>'+(st>1?'<div class="meta"><b>'+st+'-day streak</b></div>':'')+'</div></div>'}
function burst(x,y,n){if(RM)return;var C=["#e9a23b","#2f8f6b","#d9472b","#5aa9e6","#a06cd5"];for(var i=0;i<n;i++){var b=document.createElement("span"),a=Math.random()*6.28,d=40+Math.random()*(n>20?170:70);b.className="bit";b.style.cssText="left:"+x+"px;top:"+y+"px;background:"+C[i%5]+";--dx:"+Math.cos(a)*d+"px;--dy:"+Math.sin(a)*d+"px;--r:"+Math.round(Math.random()*360)+"deg";document.body.appendChild(b);setTimeout(function(e){e.remove()},800,b)}}
var tt;function toast(msg,undo){var t=$("toast");t.innerHTML="";var sp=document.createElement("span");sp.textContent=msg;t.appendChild(sp);if(undo){var u=document.createElement("button");u.textContent="Undo";u.onclick=function(){undo();t.classList.remove("show")};t.appendChild(u)}t.classList.add("show");clearTimeout(tt);tt=setTimeout(function(){t.classList.remove("show")},5000)}
function mail(p){var t=today(),due=S.chores.filter(function(c){return c.who===p.id&&diff(parse(c.next),t)<=0}).map(function(c){return "- "+c.name+" ("+every(c).toLowerCase()+")"});
  var body=due.length?"Hi "+p.name+", these chores are due:\n\n"+due.join("\n"):"Hi "+p.name+", nothing is due today. Thank you!";
  return "mailto:"+encodeURIComponent(p.mail)+"?subject="+encodeURIComponent("Chores due today")+"&body="+encodeURIComponent(body)}
function rrule(c){return "FREQ="+{d:"DAILY",w:"WEEKLY",m:"MONTHLY",y:"YEARLY"}[c.u]+";INTERVAL="+c.n}
function ymd(s){return s.replace(/-/g,"")}
function gcal(c){var e=iso(add(parse(c.next),1,"d"));return "https://calendar.google.com/calendar/render?action=TEMPLATE&text="+encodeURIComponent((c.kind||"Chore")+": "+c.name)+"&dates="+ymd(c.next)+"/"+ymd(e)+"&recur="+encodeURIComponent("RRULE:"+rrule(c))+"&details="+encodeURIComponent(c.who?"Assigned to "+pname(c.who):"Household chore")}
function ics(){var L=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Chore rota//EN"],st=new Date().toISOString().replace(/[-:]/g,"").slice(0,15)+"Z";
  S.chores.concat(S.bills).forEach(function(c){L.push("BEGIN:VEVENT","UID:"+c.id+"@chore-rota","DTSTAMP:"+st,"DTSTART;VALUE=DATE:"+ymd(c.next),"RRULE:"+rrule(c),"SUMMARY:"+(c.kind||"Chore")+": "+c.name+(c.who?" ("+pname(c.who)+")":""),"BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:Chore due","TRIGGER;RELATED=START:PT9H","END:VALARM","END:VEVENT")});
  var pr=S.prefs,t0=today(),wd=add(t0,(7+(+pr.wDay)-t0.getDay())%7,"d");
  [["daily-brief","Home hub: today’s briefing",ymd(iso(t0))+"T"+pr.dTime.replace(":","")+"00","FREQ=DAILY",pr.daily],["weekly-brief","Home hub: week ahead",ymd(iso(wd))+"T"+pr.wTime.replace(":","")+"00","FREQ=WEEKLY",pr.weekly]].filter(function(e){return e[4]}).forEach(function(e){L.push("BEGIN:VEVENT","UID:"+e[0]+"@chore-rota","DTSTAMP:"+st,"DTSTART:"+e[2],"DURATION:PT15M","RRULE:"+e[3],"SUMMARY:"+e[1],"BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:"+e[1],"TRIGGER:PT0S","END:VALARM","END:VEVENT")});
  L.push("END:VCALENDAR");return L.join("\r\n")}
function check(){
  if(!("Notification" in window)||Notification.permission!=="granted")return;
  var t=iso(today()),ch=false,now=new Date(),hm=String(now.getHours()).padStart(2,"0")+":"+String(now.getMinutes()).padStart(2,"0"),pr=S.prefs;
  if(pr.daily&&pr.lastD!==t&&hm>=pr.dTime){pr.lastD=t;ch=true;try{new Notification("Today at home",{body:dayText()})}catch(e){}}
  if(pr.weekly&&pr.lastW!==t&&now.getDay()===+pr.wDay&&hm>=pr.wTime){pr.lastW=t;ch=true;try{new Notification("Week ahead",{body:weekSum()})}catch(e){}}
  S.chores.concat(S.bills).forEach(function(c){if(c.next<=t&&c.notified!==t){c.notified=t;ch=true;try{new Notification((c.kind||"Chore")+" due: "+c.name,{body:(c.who?pname(c.who)+" · ":"")+label(c)})}catch(e){}}});
  if(ch)save();
}
function syncNotif(){var b=$("notif");if(!("Notification" in window)){b.disabled=true;b.textContent="Notifications not supported";return}
  if(Notification.permission==="granted"){b.textContent="Notifications on";b.disabled=true}else if(Notification.permission==="denied"){b.textContent="Notifications blocked";b.disabled=true;$("notifNote").textContent="Notifications are blocked in your browser settings for this page. Use calendar alerts or email reminders instead."}}

document.addEventListener("click",function(e){
  var T=e.target.closest(".tab");if(T){tab=T.dataset.tab;render();return}
  var b=e.target.closest("[data-act]");if(!b||b.tagName==="SELECT")return;var id=b.dataset.id,a=b.dataset.act;
  if(a==="done"||a==="bdone"){var isC=a==="done",c=(isC?S.chores:S.bills).filter(function(x){return x.id===id})[0];if(!c)return;var old=c.next,el=b.closest(".row"),r=b.getBoundingClientRect();burst(r.left+r.width/2,r.top+r.height/2,14);if(el)el.classList.add("leave");
    setTimeout(function(){var x=isC?add(today(),c.n,c.u):add(parse(c.next),c.n,c.u);while(!isC&&x<today())x=add(x,c.n,c.u);c.next=iso(x);if(isC){S.log.push(iso(today()));if(S.log.length>500)S.log=S.log.slice(-500)}save();render();
      var all=isC&&!S.chores.some(function(z){return z.next<=iso(today())});if(all)burst(innerWidth/2,innerHeight/3,45);
      toast(all?"All done for today!":(isC?"Done: ":"Paid: ")+c.name,function(){c.next=old;if(isC)S.log.pop();save();render()})},RM?0:320);return}
  if(a==="go"){tab=id;render();window.scrollTo(0,0);return}
  if(a==="shareweek"){var tx=weekText();if(navigator.share){navigator.share({title:"Week ahead",text:tx}).catch(function(){})}else{try{navigator.clipboard.writeText(tx);b.textContent="Copied"}catch(e){}}return}
  if(a==="bq"){$("bName").value=b.dataset.t;$("bName").focus();return}
  if(a==="sadd"){var si=$("sIn"),v=si.value.trim();if(!v){si.focus();return}S.shop.push({id:uid(),t:v,d:false});si.value="";save();render();$("sIn").focus();return}
  if(a==="sq")S.shop.push({id:uid(),t:b.dataset.t,d:false});
  if(a==="stick")S.shop.forEach(function(x){if(x.id===id)x.d=!x.d});
  if(a==="sdel")S.shop=S.shop.filter(function(x){return x.id!==id});
  if(a==="sclear")S.shop=S.shop.filter(function(x){return !x.d});
  if(a==="suggest"){var pool=IDEAS.slice().sort(function(){return Math.random()-.5}),j=0;for(var i=0;i<7;i++)if(!S.meals[i+"d"])S.meals[i+"d"]=pool[j++%pool.length]}
  if(a==="mealshop"){Object.keys(S.meals).forEach(function(k){var m=S.meals[k];if(!m||k.slice(-1)==="c")return;var t="Ingredients for "+m;if(!S.shop.some(function(x){return x.t===t}))S.shop.push({id:uid(),t:t,d:false})})}
  if(a==="clearmeals")S.meals={};
  if(a==="badd"){var bn=$("bName").value.trim();if(!bn){$("bName").focus();return}var f=$("bFreq").value;S.bills.push({id:uid(),name:bn,amt:parseFloat($("bAmt").value)||0,n:+f.slice(0,-1),u:f.slice(-1),next:$("bDue").value||iso(today()),kind:"Bill",who:"",notified:""});$("bName").value="";$("bAmt").value=""}
  if(a==="bdone")S.bills.forEach(function(c){if(c.id===id){var x=add(parse(c.next),c.n,c.u);while(x<today())x=add(x,c.n,c.u);c.next=iso(x)}});
  if(a==="bdel")S.bills=S.bills.filter(function(c){return c.id!==id});
  if(a==="done")S.chores.forEach(function(c){if(c.id===id)c.next=iso(add(today(),c.n,c.u))});
  if(a==="quick"||a==="quickall"){var have=S.chores.map(function(c){return c.name.toLowerCase()});STARTER.forEach(function(s,i){if(have.indexOf(s[0].toLowerCase())<0&&(a==="quickall"||i===+b.dataset.i))S.chores.push({id:uid(),name:s[0],n:s[1],u:s[2],next:iso(today()),who:"",notified:""})})}
  if(a==="del")S.chores=S.chores.filter(function(c){return c.id!==id});
  if(a==="delp"){S.partners=S.partners.filter(function(p){return p.id!==id});S.chores.forEach(function(c){if(c.who===id)c.who=""})}
  save();render();
});
document.addEventListener("change",function(e){var s=e.target;if(s.dataset&&s.dataset.act==="assign"){S.chores.forEach(function(c){if(c.id===s.dataset.id)c.who=s.value});save();render()}});
$("q").oninput=render;$("fWho").onchange=render;
$("open").onclick=function(){$("cStart").value=iso(today());$("dlg").showModal();if(!matchMedia("(pointer:coarse)").matches)$("cName").focus()};
$("cancel").onclick=function(){$("dlg").close()};
$("freq").onclick=function(e){var b=e.target.closest(".pick");if(!b)return;freq=b.dataset.f;document.querySelectorAll(".pick").forEach(function(p){p.setAttribute("aria-pressed",p===b)});$("customBox").hidden=freq!=="custom"};
$("addChore").onclick=function(){
  var name=$("cName").value.trim();if(!name){$("cName").focus();return}
  var n,u;if(freq==="custom"){n=Math.max(1,parseInt($("cN").value)||1);u=$("cU").value}else{n=+freq.slice(0,-1);u=freq.slice(-1)}
  S.chores.push({id:uid(),name:name,n:n,u:u,next:$("cStart").value||iso(today()),who:$("cWho").value,notified:""});
  $("cName").value="";$("dlg").close();tab="all";$("q").value="";save();render();check();
};
$("addPartner").onclick=function(){var n=$("pName").value.trim();if(!n){$("pName").focus();return}
  S.partners.push({id:uid(),name:n,mail:$("pMail").value.trim()});$("pName").value="";$("pMail").value="";save();render()};
$("notif").onclick=function(){Notification.requestPermission().then(function(){syncNotif();check()})};
$("ics").onclick=function(){$("icsText").value=ics();$("icsBox").hidden=false;$("icsText").select()};
$("copyIcs").onclick=function(){var t=$("icsText");t.select();try{navigator.clipboard.writeText(t.value)}catch(e){document.execCommand("copy")}this.textContent="Copied"};
document.addEventListener("change",function(e){var m=e.target.dataset&&e.target.dataset.meal;if(m!==undefined){S.meals[m]=e.target.value;save()}});
document.addEventListener("change",function(e){var pf=e.target.dataset&&e.target.dataset.pref;if(pf){S.prefs[pf]=e.target.type==="checkbox"?e.target.checked:e.target.value;save();check()}});
var sw=null;
document.addEventListener("touchstart",function(e){var r=e.target.closest(".row");if(!r||!r.querySelector('[data-act="done"],[data-act="bdone"]')||e.target.closest("select,a,input"))return;var t=e.touches[0];sw={r:r,x:t.clientX,y:t.clientY,dx:0}},{passive:true});
document.addEventListener("touchmove",function(e){if(!sw)return;var t=e.touches[0],dx=t.clientX-sw.x,dy=t.clientY-sw.y;if(dx>0&&Math.abs(dx)>Math.abs(dy)){sw.dx=dx;sw.r.style.transform="translateX("+Math.min(dx,140)+"px)";sw.r.style.background="linear-gradient(90deg,rgba(47,143,107,.22),transparent)"}},{passive:true});
document.addEventListener("touchend",function(){if(!sw)return;var r=sw.r,go=sw.dx>110;r.style.transform="";r.style.background="";sw=null;if(go){var b=r.querySelector('[data-act="done"],[data-act="bdone"]');if(b)b.click()}});
document.addEventListener("keydown",function(e){if(e.key==="Enter"&&e.target.id==="sIn")document.querySelector('[data-act="sadd"]').click()});
load();seed();render();syncNotif();check();setInterval(check,60000);
})();
