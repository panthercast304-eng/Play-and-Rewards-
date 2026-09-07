const KEY='playRewardsDemoV1';
let state=JSON.parse(localStorage.getItem(KEY)||'null')||{
 coins:0, ads:0, gamePoints:0, games:0, eligibleRefs:0, refBonusClaimed:0, history:[]
};
function save(){localStorage.setItem(KEY,JSON.stringify(state));render()}
function showPage(id){
 document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
 document.getElementById(id).classList.add('active');
 document.querySelectorAll('.bottom button').forEach(b=>b.classList.toggle('active',b.dataset.page===id));
 window.scrollTo(0,0); render();
}
function money(c){return Math.floor(c/10)}
function addHistory(label,coins){
 state.history.unshift({label,coins,time:new Date().toLocaleString()});
 state.history=state.history.slice(0,20);
}
function watchDemoAd(){
 if(state.ads>=100){alert('This ad cycle is complete.');return}
 if(state.ads>=25 && state.ads%25===0 && state.eligibleRefs<Math.floor(state.ads/25)){
   alert('Referral milestone required before the next 25-ad section.');
   showPage('profile'); return;
 }
 state.ads++; state.coins+=200; addHistory('Demo rewarded ad',200); save();
}
function referDemo(){
 // Demonstration only: production referral rewards must be verified server-side.
 state.eligibleRefs++; state.coins+=1200; addHistory('Demo verified referral',1200); save();
 alert('Demo: eligible referral verified and 1,200 coins credited.');
}
function playGame(name){ state.games++; state.gamePoints+=100; save(); alert(name+' complete! +100 Game Points. Game Points have no cash value.'); }
function startRewardedAd(){ alert('Real rewarded ads require an approved ad provider and secure backend verification. This button will not fake a reward.'); }
function openLudo(){ showPage('games'); const a=document.getElementById('gameArea'); if(!a)return; a.classList.remove('hidden'); a.innerHTML='<h2>🎲 Ludo vs Computer</h2><p class="muted">Non-wagering mini Ludo. First to 20 wins.</p><div id="ludoStatus" class="notice">Roll the die.</div><div class="board"><div class="cell" id="youPos">YOU<br>0/20</div><div class="cell">🎯</div><div class="cell" id="cpuPos">CPU<br>0/20</div></div><button class="primary" id="rollBtn">Roll 🎲</button>'; let you=0,cpu=0; document.getElementById('rollBtn').onclick=()=>{let d=1+Math.floor(Math.random()*6),cd=1+Math.floor(Math.random()*6);you=Math.min(20,you+d);cpu=Math.min(20,cpu+cd);document.getElementById('youPos').innerHTML='YOU<br>'+you+'/20';document.getElementById('cpuPos').innerHTML='CPU<br>'+cpu+'/20';if(you>=20){addGamePoints(100);document.getElementById('ludoStatus').textContent='You won! +100 Game Points.';document.getElementById('rollBtn').disabled=true}else if(cpu>=20){document.getElementById('ludoStatus').textContent='Computer won. Try again!';document.getElementById('rollBtn').disabled=true}else document.getElementById('ludoStatus').textContent='You rolled '+d+'. Computer rolled '+cd+'.'} }
function addGamePoints(n){state.gamePoints+=n;save();}
function withdraw(){
 if(state.coins<12000){alert('Withdrawal is locked until you have at least 12,000 eligible coins.');return}
 if(state.eligibleRefs<1){alert('Withdrawal requires the published referral condition to be verified.');return}
 alert('Demo withdrawal form: connect a secure backend/payment provider before accepting real withdrawals.');
}
function copyReferral(){
 navigator.clipboard?.writeText(document.getElementById('refCode').textContent);
 alert('Referral code copied.');
}
function render(){
 const c=state.coins;
 document.getElementById('homeBalance').textContent=c.toLocaleString();
 document.getElementById('homeRupees').textContent='≈ ₹'+money(c).toLocaleString();
 document.getElementById('profileBalance').textContent=c.toLocaleString();
 document.getElementById('profileRupees').textContent='≈ ₹'+money(c).toLocaleString();
 document.getElementById('adCount').textContent=state.ads+' / 100';
 document.getElementById('adProgress').style.width=(state.ads)+'%';
 document.getElementById('statAds').textContent=state.ads;
 document.getElementById('statRefs').textContent=state.eligibleRefs;
 document.getElementById('statGames').textContent=state.games;
 document.getElementById('gamePoints').textContent=state.gamePoints.toLocaleString();
 document.getElementById('refCode').textContent='PLAY-'+String(Math.abs((state.coins*7919+state.ads*101))%10000).padStart(4,'0');
 document.getElementById('refStatus').textContent=state.eligibleRefs+' eligible referrals verified.';
 const eligible=state.coins>=12000 && state.eligibleRefs>=1;
 document.getElementById('withdrawStatus').textContent=eligible
 ? 'Withdrawal unlocked for demo. Connect a secure backend and payment provider before real payouts.'
 : 'Withdrawal unlocks at 12,000 eligible coins and after the required referral is verified.';
}
render();
showPage('home');
