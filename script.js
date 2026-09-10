(()=>{"use strict";
const $=id=>document.getElementById(id);
let user=null,coins=0,ads=0,refs=0,gamePoints=0;
function save(){localStorage.plusRewards=JSON.stringify({coins,ads,refs,email:user?.email||"",gamePoints})}
function load(){try{const s=JSON.parse(localStorage.plusRewards||"{}");coins=+s.coins||0;ads=+s.ads||0;refs=+s.refs||0;gamePoints=+s.gamePoints||0;if(s.email)user={email:s.email}}catch(e){}}
function page(p){
 document.querySelectorAll(".page").forEach(x=>x.hidden=x.id!==p);
 document.querySelectorAll("nav [data-page]").forEach(x=>x.classList.toggle("active",x.dataset.page===p));
 const titles={home:"Welcome back",ads:"Watch Ads",games:"Games",referral:"Referral",profile:"Profile"};
 $("headerTitle").textContent=titles[p]||"Welcome back";
}
function update(){
 $("coins").textContent=coins.toLocaleString(); $("inr").textContent="₹"+(coins/10).toFixed(2);
 $("adcount").textContent=ads; $("progress")?.replaceChildren(document.createTextNode(ads+"/100"));
 $("bar").style.width=Math.min(ads,100)+"%";
 $("refs").textContent=refs; $("refPercent").textContent=Math.min(refs*50,100)+"%"; $("refBar").style.width=Math.min(refs*50,100)+"%";
 $("gamePoints").textContent=gamePoints.toLocaleString(); $("yourRankPoints").textContent=gamePoints.toLocaleString();
 const ready=ads>=50&&refs>=2&&coins>=12000;
 $("wstatus").textContent=ready?"Eligible":"Locked"; $("wstatus").className="status-pill "+(ready?"ok":"locked");
 $("wbadge").textContent=ready?"Eligible":"Locked"; $("wbadge").className="status-pill "+(ready?"ok":"locked");
 $("withdraw").disabled=!ready;
 const checks=[["checkAds",ads>=50],["checkRefs",refs>=2],["checkCoins",coins>=12000],["pcheckAds",ads>=50],["pcheckRefs",refs>=2],["pcheckCoins",coins>=12000]];
 checks.forEach(([id,ok])=>{const el=$(id);if(el)el.firstElementChild.textContent=ok?"✓":"🔒";if(el&&ok)el.firstElementChild.style.color="#4ade80"});
 renderAds();save();
}
function enter(){
 const e=$("email").value.trim(),p=$("password").value;
 if(!e||!p){$("msg").textContent="Enter email and password.";return}
 user={email:e};load();user={email:e};$("auth").hidden=true;$("app").hidden=false;$("nav").hidden=false;
 $("user")?.replaceChildren();$("mail").textContent=e;
 $("refcode").textContent=(e.split("@")[0]+"-"+Math.random().toString(36).slice(2,7)).toUpperCase();
 page("home");update();
}
function renderAds(){
 const box=$("adButtons");if(!box)return;box.innerHTML="";
 for(let i=1;i<=100;i++){const b=document.createElement("button");b.className="adbtn"+(i>25?" locked":"");b.textContent=i<=25?`📺 Watch Ad ${i} — +200 Coins after verified completion`:`🔒 Ad ${i} — Unlock after referral requirement`;b.disabled=i>25;b.onclick=()=>startAd(i);box.appendChild(b)}
}
function startAd(i){$("admsg").textContent=`Ad ${i}: waiting for approved provider confirmation. No coins are added by this demo button.`;alert("Connect your approved rewarded-ad provider and secure server callback before granting the 200-coin reward.")}
function referralLink(){return location.origin+location.pathname+"?ref="+encodeURIComponent($("refcode").textContent)}
function doShare(){const u=referralLink();try{navigator.share({title:"PLUS FOR YOU",text:"Join using my referral link",url:u})}catch(e){navigator.clipboard?.writeText(u);alert("Referral link copied.")}}
$("login").onclick=enter;$("signup").onclick=()=>{coins=ads=refs=gamePoints=0;enter()};
$("logout").onclick=()=>{localStorage.removeItem("plusRewards");location.reload()};
document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>page(b.dataset.page));
$("avatarBtn").onclick=()=>page("profile");$("referNow").onclick=doShare;$("copy").onclick=()=>{navigator.clipboard?.writeText(referralLink());alert("Referral link copied.")};
$("share").onclick=doShare;$("claim").onclick=()=>alert("Claim is enabled only after backend verification.");$("withdraw").onclick=()=>alert("Withdrawal is demo-only.");
document.querySelectorAll("[data-profile]").forEach(b=>b.onclick=()=>{document.querySelectorAll(".subnav button").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.querySelectorAll(".profile-pane").forEach(x=>x.hidden=true);$("profile"+b.dataset.profile[0].toUpperCase()+b.dataset.profile.slice(1)).hidden=false});
function gp(n){gamePoints+=n;update();alert("You earned "+n+" Game Points. They have no cash value.")}
function ludo(){let cells="";for(let i=0;i<25;i++)cells+=`<div class="cell" style="background:${i===0?"#4c2a79":i===4?"#553d27":i===20?"#552735":i===24?"#54451f":"#251b32"} id="lc${i}"></div>`;$("game").innerHTML=`<div class="card"><h3>🎲 Ludo</h3><p class="muted">4-colour style • Player vs Computer • Game Points only</p><div class="ludo">${cells}</div><p id="ls">Your turn</p><button id="lr" class="primary">🎲 Roll Dice</button> <button id="ln" class="secondary">🔄 New Game</button></div>`;let p=0,c=0,done=false;function draw(){document.querySelectorAll(".cell").forEach(e=>e.innerHTML="");$("lc"+Math.min(p,24)).innerHTML='<span class="token">B</span>';$("lc"+Math.min(c,24)).innerHTML+='<span class="token">C</span>'}$("lr").onclick=()=>{if(done)return;let d=1+Math.floor(Math.random()*6);p=Math.min(24,p+d);$("ls").textContent="You rolled "+d;draw();if(p===24){done=true;gp(100);$("ls").textContent="You won! +100 Game Points";return}setTimeout(()=>{c=Math.min(24,c+1+Math.floor(Math.random()*6));draw();if(c===24){done=true;$("ls").textContent="Computer won."}},500)};$("ln").onclick=ludo;draw()}
function snake(){ $("game").innerHTML='<div class="card"><h3>🐍 Snake</h3><canvas id="sc" class="snake" width="320" height="320"></canvas><button id="ss" class="primary">Start / Restart</button><p id="st" class="muted">Press Start</p></div>';let c=$("sc"),x=c.getContext("2d"),n=16,s=20,a,t,f,score,d;function food(){do{f={x:Math.floor(Math.random()*n),y:Math.floor(Math.random()*n)}}while(a.some(p=>p.x===f.x&&p.y===f.y))}function draw(){x.clearRect(0,0,320,320);a.forEach(p=>x.fillRect(p.x*s+2,p.y*s+2,s-4,s-4));x.fillRect(f.x*s+4,f.y*s+4,12,12)}function reset(){a=[{x:8,y:8},{x:7,y:8},{x:6,y:8}];d={x:1,y:0};score=0;food();draw()}function step(){let h={x:a[0].x+d.x,y:a[0].y+d.y};if(h.x<0||h.y<0||h.x>=n||h.y>=n||a.some(p=>p.x===h.x&&p.y===h.y)){clearInterval(t);$("st").textContent="Game over. Score "+score;return}a.unshift(h);if(h.x===f.x&&h.y===f.y){score++;food()}else a.pop();draw()}$("ss").onclick=()=>{clearInterval(t);reset();t=setInterval(step,130)};reset()}
$("ludo").onclick=ludo;$("quiz").onclick=()=>gp(50);$("tap").onclick=()=>gp(25);$("memory").onclick=()=>gp(75);$("daily").onclick=()=>gp(100);
load();if(user&&user.email){$("auth").hidden=true;$("app").hidden=false;$("nav").hidden=false;$("mail").textContent=user.email;page("home");update()}
})()