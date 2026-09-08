(() => {
  'use strict';
  const { createClient } = window.supabase || {};
  const cfg = window.APP_CONFIG || {};
  const configured = Boolean(createClient && cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_URL.startsWith('YOUR_') && !cfg.SUPABASE_ANON_KEY.startsWith('YOUR_'));
  const sb = configured ? createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
  const $ = id => document.getElementById(id);
  const main = $('main-content');
  const state = { page:'home', user:null, profile:null, activities:[], referralCode:'', authMode:'login', snake:null, ludo:null };
  const esc = s => String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const fmt = n => Number(n || 0).toLocaleString('en-IN');
  const toast = msg => { const el=$('toast'); el.textContent=msg; el.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove('show'),2600); };
  const setPage = page => { if(state.page==='snake' && page!=='snake') stopSnake(); if(state.ludo?.computerTimer && page!=='ludo') clearTimeout(state.ludo.computerTimer); state.page=page; document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===page)); $('page-title').textContent=page[0].toUpperCase()+page.slice(1); render(); };
  const requireAuth = () => { if(!state.user){openAuth('login');return false;} return true; };

  function openAuth(mode='login'){ state.authMode=mode; $('auth-modal').classList.remove('hidden'); $('login-tab').classList.toggle('active',mode==='login'); $('signup-tab').classList.toggle('active',mode==='signup'); $('auth-title').textContent=mode==='login'?'Welcome back':'Create your account'; $('auth-copy').textContent=mode==='login'?'Sign in to save rewards, referrals and games.':'Create an account to start playing and earning.'; $('referral-field').classList.toggle('hidden',mode!=='signup'); $('auth-submit').textContent=mode==='login'?'Login':'Sign up'; $('auth-message').textContent=''; }
  function closeAuth(){ $('auth-modal').classList.add('hidden'); }

  async function loadUser(){
    if(!sb){ state.user=null; render(); return; }
    const {data:{session}}=await sb.auth.getSession(); state.user=session?.user || null;
    if(state.user) await loadProfile();
    render();
  }
  async function loadProfile(){
    if(!state.user)return;
    const {data,error}=await sb.from('profiles').select('*').eq('id',state.user.id).single();
    if(error){toast(error.message);return;}
    state.profile=data; state.referralCode=data.referral_code;
    const {data:acts}=await sb.from('activities').select('id,type,description,coins,created_at').order('created_at',{ascending:false}).limit(8);
    state.activities=acts||[];
  }
  async function signIn(){
    if(!sb){$('auth-message').textContent='Add your Supabase URL and anon key in config.js first.';return;}
    const email=$('auth-email').value.trim(), password=$('auth-password').value;
    $('auth-message').textContent='Working…';
    const result=state.authMode==='login' ? await sb.auth.signInWithPassword({email,password}) : await sb.auth.signUp({email,password,options:{data:{referral_code_input:$('auth-referral').value.trim()||null}}});
    if(result.error){$('auth-message').textContent=result.error.message;return;}
    if(state.authMode==='signup' && !result.data.session){$('auth-message').textContent='Check your email to confirm your account, then log in.';return;}
    closeAuth(); await loadUser(); toast(state.authMode==='login'?'Logged in':'Account created');
  }
  async function logout(){ if(sb) await sb.auth.signOut(); state.user=null;state.profile=null;state.activities=[];setPage('home');toast('Logged out'); }

  function home(){
    const p=state.profile; const balance=p?.reward_coins||0; const gp=p?.game_points||0; const adCount=p?.ad_count||0; const section=Math.floor(adCount/25)+1; const within=adCount%25;
    return `<div class="grid"><section class="card balance"><div class="eyebrow">REWARD COINS</div><div class="balance-number">${fmt(balance)}</div><div class="muted">1,200 coins = ₹120 · Withdrawal starts at 12,000 coins</div><div class="grid two" style="margin-top:14px"><button class="primary-btn" data-action="ads">Watch eligible ads</button><button class="secondary-btn" data-action="withdraw">Withdraw</button></div></section><section class="grid two"><div class="card"><div class="muted">Game Points</div><h2>${fmt(gp)}</h2><button class="secondary-btn full" data-action="games">Play games</button></div><div class="card"><div class="muted">Ads cycle</div><h2>${within}/25</h2><div class="progress"><i style="width:${within/25*100}%"></i></div><small>Section ${Math.min(section,4)} of 4</small></div></section></div><div class="section-head"><h2>Referral</h2></div><section class="card"><div class="muted">Your code</div><h2>${p?esc(p.referral_code):'Sign in to get one'}</h2>${p?`<button class="primary-btn full" data-action="copy-ref">Copy referral link</button>`:''}<p class="muted" style="margin:12px 0 0">You receive 1,200 coins when a referred user completes 10 legitimate rewarded ads. Referral verification happens in secure database logic.</p></section><div class="section-head"><h2>Recent activity</h2></div><section class="card">${state.activities.length?state.activities.map(activityHtml).join(''):'<p class="muted">No activity yet.</p>'}</section>`;
  }
  function activityHtml(a){return `<div class="activity"><div><b>${esc(a.description||a.type)}</b><div class="muted">${new Date(a.created_at).toLocaleString()}</div></div><div class="${a.coins>=0?'positive':'negative'}">${a.coins>0?'+':''}${fmt(a.coins)} 🪙</div></div>`;}
  function ads(){
    if(!state.user)return authGate('Ads');
    const count=state.profile?.ad_count||0, within=count%25, nextLocked=count>=25&&within===0; const eligibleReferral=Boolean(state.profile?.qualified_referral_count);
    return `<section class="card balance"><div class="eyebrow">REWARDED ADS</div><h2>Earn 200 reward coins per legitimately completed ad</h2><p class="muted">There are 100 opportunities in a cycle. Coins are never awarded from a button click. Connect an approved rewarded-ad provider and have its trusted server callback call the secure Supabase RPC.</p><div class="progress"><i style="width:${count%100/100*100}%"></i></div><p><b>${count%100}/100</b> completed in this cycle</p></section><section class="card"><h3>Current 25-ad section</h3><p class="muted">${within}/25 completed. ${nextLocked?'A qualifying referral is required before the next section can unlock.':'Continue through the currently unlocked section.'}</p>${nextLocked&&!eligibleReferral?'<div class="pill">Referral unlock required</div>':'<div class="pill">Provider verification required</div>'}<button class="secondary-btn full" style="margin-top:14px" data-action="provider-info">Why can’t I credit a click?</button></section><section class="card"><h3>Provider integration</h3><p class="muted">This frontend intentionally has no fake “watch” reward. Your backend/ad-provider webhook should verify the completed ad event, then call <code>claim_verified_ad</code> with a unique provider event ID.</p></section>`;
  }
  function referrals(){ if(!requireAuth())return authGate('Referrals'); return `<section class="card"><div class="eyebrow">REFERRAL PROGRAM</div><h2>${esc(state.profile.referral_code)}</h2><p class="muted">${esc(location.origin+location.pathname)}?ref=${encodeURIComponent(state.profile.referral_code)}</p><button class="primary-btn full" data-action="copy-ref">Copy referral link</button></section><section class="card" style="margin-top:14px"><h3>How qualification works</h3><p class="muted">A referred account must complete at least 10 legitimate rewarded ads. The database checks the relationship and prevents self-referrals, duplicate rewards and client-side balance edits.</p></section>`; }
  function withdraw(){ if(!requireAuth())return authGate('Withdrawal'); const p=state.profile||{}; const can=p.reward_coins>=12000 && Number(p.qualified_referral_count||0)>0; return `<section class="card balance"><div class="eyebrow">WITHDRAWAL</div><h2>${fmt(p.reward_coins)} coins</h2><p class="muted">12,000 coins = ₹1,200. Minimum withdrawal: 12,000 coins.</p><div class="pill">${can?'Eligible to submit':'Locked'}</div></section><section class="card" style="margin-top:14px"><form id="withdraw-form"><label>UPI ID<input id="upi-id" inputmode="email" placeholder="yourname@upi" required></label><button class="primary-btn full" ${can?'':'disabled'} type="submit">Create withdrawal request</button></form><p class="muted" style="margin-top:12px">Submitting only creates a request in Supabase. It does not claim that payment has been sent.</p></section>`; }
  function games(){return `<div class="grid two"><section class="card game-card"><div><div class="eyebrow">GAME POINTS</div><h2>Ludo vs Computer</h2><p class="muted">4 tokens, dice, movement and win detection.</p></div><button class="primary-btn" data-action="ludo">Play</button></section><section class="card game-card"><div><div class="eyebrow">GAME POINTS</div><h2>Snake</h2><p class="muted">Touch controls and keyboard support.</p></div><button class="primary-btn" data-action="snake">Play</button></section></div><div class="section-head"><h2>Leaderboard</h2></div><section class="card" id="leaderboard"><p class="muted">Loading…</p></section>`; }
  async function leaderboard(){ if(!sb){$('leaderboard').innerHTML='<p class="muted">Connect Supabase to load scores.</p>';return;} const {data,error}=await sb.from('game_scores').select('user_id,game,score,created_at').order('score',{ascending:false}).limit(10); if(error){$('leaderboard').innerHTML='<p class="muted">Leaderboard unavailable.</p>';return;} $('leaderboard').innerHTML=(data||[]).map((r,i)=>`<div class="leader-row"><span>#${i+1} ${esc(r.game)}</span><b>${fmt(r.score)}</b></div>`).join('')||'<p class="muted">No scores yet.</p>'; }
  function profile(){ if(!state.user)return authGate('Profile'); return `<section class="card"><div class="eyebrow">PROFILE</div><h2>${esc(state.user.email)}</h2><p class="muted">Referral code: <b>${esc(state.profile?.referral_code)}</b></p><div class="grid two"><div><small>Reward coins</small><h2>${fmt(state.profile?.reward_coins)}</h2></div><div><small>Game Points</small><h2>${fmt(state.profile?.game_points)}</h2></div></div><button class="danger-btn full" data-action="logout">Logout</button></section>`; }
  function authGate(title){return `<section class="card"><div class="eyebrow">${title.toUpperCase()}</div><h2>Sign in to continue</h2><p class="muted">Your balances and activity are tied to your Supabase account.</p><button class="primary-btn full" data-action="login">Login / Sign up</button></section>`;}
  function render(){ let html=state.page==='home'?home():state.page==='ads'?ads():state.page==='games'?games():profile(); main.innerHTML=html; if(state.page==='games')leaderboard(); }

  function copyReferral(){ if(!state.profile)return; const link=`${location.origin}${location.pathname}?ref=${state.profile.referral_code}`; navigator.clipboard?.writeText(link).then(()=>toast('Referral link copied')).catch(()=>toast(link)); }
  async function createWithdrawal(e){e.preventDefault();if(!requireAuth()||!sb)return; const upi=$('upi-id').value.trim(); const {data,error}=await sb.rpc('create_withdrawal_request',{p_amount_coins:12000,p_upi_id:upi}); if(error){toast(error.message);return;} toast('Withdrawal request created'); await loadProfile();render(); }
  function providerInfo(){toast('Only a verified provider callback can award coins.');}

  function startSnake(){
    if(!requireAuth())return;
    stopSnake();
    state.page='snake';
    $('page-title').textContent='Snake';
    document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));
    main.innerHTML=`<section class="card game-screen">
      <div class="game-head"><div><div class="eyebrow">GAME POINTS</div><h2>Snake</h2></div><span class="pill">Score: <b id="snake-score">0</b></span></div>
      <div class="canvas-wrap"><canvas id="snake-canvas" class="game-canvas" width="320" height="320" aria-label="Snake game"></canvas></div>
      <p id="snake-status" class="game-status">Use the controls to start moving.</p>
      <div class="controls" aria-label="Snake controls">
        <span class="empty"></span><button type="button" data-dir="up" aria-label="Up">↑</button><span class="empty"></span>
        <button type="button" data-dir="left" aria-label="Left">←</button><button type="button" data-dir="down" aria-label="Down">↓</button><button type="button" data-dir="right" aria-label="Right">→</button>
      </div>
      <button class="primary-btn full" style="margin-top:12px" data-action="snake-new">New Game</button>
    </section>`;
    state.snake={snake:[{x:7,y:8},{x:6,y:8},{x:5,y:8}],dir:{x:1,y:0},next:{x:1,y:0},food:null,score:0,running:true,started:false,timer:null,gameOverSaved:false};
    spawnSnakeFood();
    drawSnake();
    state.snake.timer=setInterval(tickSnake,140);
  }

  function stopSnake(){if(state.snake?.timer)clearInterval(state.snake.timer);state.snake=null;}

  function spawnSnakeFood(){
    const s=state.snake;if(!s)return;
    const free=[];
    for(let y=0;y<16;y++)for(let x=0;x<16;x++)if(!s.snake.some(p=>p.x===x&&p.y===y))free.push({x,y});
    s.food=free.length?free[Math.floor(Math.random()*free.length)]:null;
  }

  function drawSnake(){
    const s=state.snake,c=$('snake-canvas');if(!s||!c)return;
    const ctx=c.getContext('2d'),cell=20;
    ctx.clearRect(0,0,320,320);
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,320,320);
    ctx.strokeStyle='#eef2f2';ctx.lineWidth=1;
    for(let i=0;i<=16;i++){ctx.beginPath();ctx.moveTo(i*cell,0);ctx.lineTo(i*cell,320);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i*cell);ctx.lineTo(320,i*cell);ctx.stroke();}
    if(s.food){ctx.fillStyle='#69dff2';ctx.beginPath();ctx.arc(s.food.x*cell+10,s.food.y*cell+10,7,0,Math.PI*2);ctx.fill();}
    s.snake.forEach((p,i)=>{ctx.fillStyle=i===0?'#087f98':'#36b8cf';ctx.fillRect(p.x*cell+2,p.y*cell+2,cell-4,cell-4);});
    if($('snake-score'))$('snake-score').textContent=s.score;
  }

  async function finishSnake(message){
    const s=state.snake;if(!s||!s.running)return;
    s.running=false;clearInterval(s.timer);s.timer=null;
    if($('snake-status'))$('snake-status').textContent=message+` Final score: ${s.score}.`;
    if(s.score>0&&!s.gameOverSaved){s.gameOverSaved=true;await saveGameScore('snake',s.score);}
  }

  function tickSnake(){
    const s=state.snake;if(!s?.running)return;
    s.dir=s.next;
    const head=s.snake[0],nextHead={x:head.x+s.dir.x,y:head.y+s.dir.y};
    const wall=nextHead.x<0||nextHead.x>=16||nextHead.y<0||nextHead.y>=16;
    const ate=s.food&&nextHead.x===s.food.x&&nextHead.y===s.food.y;
    const bodyToCheck=ate?s.snake:s.snake.slice(0,-1);
    const self=bodyToCheck.some(p=>p.x===nextHead.x&&p.y===nextHead.y);
    if(wall||self){finishSnake('Game over.');return;}
    s.snake.unshift(nextHead);
    if(ate){s.score++;spawnSnakeFood();if(!s.food){finishSnake('You filled the board!');return;}}
    else s.snake.pop();
    drawSnake();
  }

  function setSnakeDir(d){
    const s=state.snake;if(!s||!s.running)return;
    const map={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
    const n=map[d];if(!n||((n.x===-s.dir.x)&&(n.y===-s.dir.y)))return;
    s.next=n;
    if($('snake-status'))$('snake-status').textContent='Keep going!';
  }

  async function saveGameScore(game,score){
    if(!sb||!state.user||score<=0)return;
    const safeScore=Math.max(0,Math.min(100000,Math.floor(Number(score)||0)));
    const {error}=await sb.rpc('record_game_score',{p_game:game,p_score:safeScore});
    if(error)toast(error.message);else toast(`+${safeScore} Game Points`);
    await loadProfile();
  }

  function startLudo(){
    if(!requireAuth())return;
    stopSnake();
    state.page='ludo';
    $('page-title').textContent='Ludo';
    document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));
    main.innerHTML=`<section class="card game-screen">
      <div class="game-head"><div><div class="eyebrow">GAME POINTS</div><h2>Ludo vs Computer</h2></div><span class="pill">You: <b id="ludo-you">0/40</b></span></div>
      <div class="ludo-track" id="ludo-track"></div>
      <div class="ludo-panels">
        <div class="ludo-player human"><b>You</b><div id="ludo-human-tokens" class="token-row"></div></div>
        <div class="ludo-player cpu"><b>Computer</b><div id="ludo-cpu-tokens" class="token-row"></div></div>
      </div>
      <div class="ludo-dice"><div class="dice-face" id="ludo-die">—</div><p id="ludo-status" class="game-status">Roll the dice.</p></div>
      <button class="primary-btn full" data-action="ludo-roll">Roll Dice</button>
      <button class="secondary-btn full" style="margin-top:8px" data-action="ludo-new">New Game</button>
    </section>`;
    state.ludo={tokens:[0,0,0,0],computer:[0,0,0,0],pending:0,finished:false,computerTimer:null};
    renderLudo();
  }

  function renderLudo(){
    const g=state.ludo;if(!g)return;
    const track=$('ludo-track');if(track){track.innerHTML=Array.from({length:41},(_,i)=>`<span class="track-cell ${i===40?'finish':''}" data-pos="${i}">${i===0?'START':i===40?'🏁':i}</span>`).join('');}
    ['human','cpu'].forEach(side=>{const el=$(side==='human'?'ludo-human-tokens':'ludo-cpu-tokens');if(!el)return;const arr=side==='human'?g.tokens:g.computer;el.innerHTML=arr.map((v,i)=>`<button type="button" class="token ${g.pending&&side==='human'?'selectable':''}" data-token="${i}">${side==='human'?'🔴':'⚫'} ${i+1}: ${v===40?'FINISH':v}</button>`).join('');});
    if($('ludo-you'))$('ludo-you').textContent=`${g.tokens.filter(v=>v===40).length}/4 finished`;
  }

  function ludoRoll(){
    const g=state.ludo;if(!g||g.finished||g.pending)return;
    const roll=1+Math.floor(Math.random()*6);g.pending=roll;
    if($('ludo-die'))$('ludo-die').textContent=String(roll);
    const movable=g.tokens.map((v,i)=>v<40?i:-1).filter(i=>i>=0);
    if(!movable.length){endLudo(true);return;}
    if($('ludo-status'))$('ludo-status').textContent=`You rolled ${roll}. Choose a token.`;
    renderLudo();
  }

  function moveLudo(i){
    const g=state.ludo;if(!g||g.finished||!g.pending)return;
    if(i<0||i>3||g.tokens[i]>=40)return;
    const roll=g.pending;g.pending=0;g.tokens[i]=Math.min(40,g.tokens[i]+roll);
    if($('ludo-die'))$('ludo-die').textContent=String(roll);
    renderLudo();
    if(g.tokens.every(v=>v===40)){endLudo(true);return;}
    if($('ludo-status'))$('ludo-status').textContent='Computer is thinking…';
    g.computerTimer=setTimeout(computerLudoMove,500);
  }

  function computerLudoMove(){
    const g=state.ludo;if(!g||g.finished)return;
    const available=g.computer.map((v,i)=>v<40?i:-1).filter(i=>i>=0);
    if(!available.length){endLudo(false);return;}
    const i=available[Math.floor(Math.random()*available.length)];
    const roll=1+Math.floor(Math.random()*6);g.computer[i]=Math.min(40,g.computer[i]+roll);
    renderLudo();
    if(g.computer.every(v=>v===40)){endLudo(false);return;}
    if($('ludo-status'))$('ludo-status').textContent=`Computer moved token ${i+1} by ${roll}. Your turn.`;
  }

  async function endLudo(won){
    const g=state.ludo;if(!g||g.finished)return;
    g.finished=true;g.pending=0;if(g.computerTimer)clearTimeout(g.computerTimer);
    renderLudo();
    if($('ludo-status'))$('ludo-status').textContent=won?'🎉 You win! +100 Game Points':'Computer wins. Try again!';
    if(won)await saveGameScore('ludo',100);
  }

  document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return; if(b.classList.contains('nav-item'))return setPage(b.dataset.page);const a=b.dataset.action;if(a==='login')openAuth('login');else if(a==='logout')logout();else if(a==='ads')setPage('ads');else if(a==='games')setPage('games');else if(a==='withdraw'){state.page='withdraw';$('page-title').textContent='Withdrawal';main.innerHTML=withdraw();}else if(a==='copy-ref')copyReferral();else if(a==='provider-info')providerInfo();else if(a==='snake')startSnake();else if(a==='snake-new')startSnake();else if(a==='ludo')startLudo();else if(a==='ludo-new')startLudo();else if(a==='ludo-roll')ludoRoll();else if(a==='withdraw-submit'){}else if(b.dataset.dir)setSnakeDir(b.dataset.dir);else if(b.dataset.token)moveLudo(Number(b.dataset.token));});
  document.addEventListener('keydown',e=>{if(state.page!=='snake')return;const m={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'};if(m[e.key]){e.preventDefault();setSnakeDir(m[e.key]);}});
  document.addEventListener('touchstart',e=>{if(state.page!=='snake'||!e.changedTouches[0])return;const t=e.changedTouches[0];state.snake&&(state.snake.touchStart={x:t.clientX,y:t.clientY});},{passive:true});
  document.addEventListener('touchend',e=>{if(state.page!=='snake'||!state.snake?.touchStart||!e.changedTouches[0])return;const t=e.changedTouches[0],s=state.snake.touchStart,dx=t.clientX-s.x,dy=t.clientY-s.y;state.snake.touchStart=null;if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;if(Math.abs(dx)>Math.abs(dy))setSnakeDir(dx>0?'right':'left');else setSnakeDir(dy>0?'down':'up');},{passive:true});
  $('auth-top-btn').addEventListener('click',()=>state.user?setPage('profile'):openAuth('login')); $('auth-close').addEventListener('click',closeAuth); $('login-tab').addEventListener('click',()=>openAuth('login')); $('signup-tab').addEventListener('click',()=>openAuth('signup')); $('auth-form').addEventListener('submit',e=>{e.preventDefault();signIn();});
  main.addEventListener('submit',e=>{if(e.target.id==='withdraw-form')createWithdrawal(e);});
  if(sb)sb.auth.onAuthStateChange((_event,session)=>{state.user=session?.user||null; if(state.user)loadProfile().then(render);else render();});
  const urlRef=new URLSearchParams(location.search).get('ref'); if(urlRef){$('auth-referral').value=urlRef;openAuth('signup');}
  render();loadUser();
})();
