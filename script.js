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
function openLudo() {
  showPage('games');

  const a = document.getElementById('gameArea');
  if (!a) return;

  a.classList.remove('hidden');

  a.innerHTML = `
    <h2>🎲 Ludo vs Computer</h2>
    <p class="muted">Game Points only • No wagering • First player to get all 4 tokens home wins.</p>

    <div id="ludoStatus" class="notice">Your turn — roll the dice!</div>

    <div class="ludo-board">
      <div class="ludo-home blue-home">
        <b>YOU</b>
        <div class="tokens" id="youHome">
          <button class="token" data-token="0">🔵</button>
          <button class="token" data-token="1">🔵</button>
          <button class="token" data-token="2">🔵</button>
          <button class="token" data-token="3">🔵</button>
        </div>
      </div>

      <div class="ludo-track">
        ${Array.from({length: 40}, (_, i) =>
          `<div class="track-cell" id="track-${i}">${i + 1}</div>`
        ).join('')}
      </div>

      <div class="ludo-home red-home">
        <b>CPU</b>
        <div class="tokens" id="cpuHome">
          <span class="token">🔴</span>
          <span class="token">🔴</span>
          <span class="token">🔴</span>
          <span class="token">🔴</span>
        </div>
      </div>
    </div>

    <div class="ludo-controls">
      <div id="diceDisplay" class="dice">🎲</div>
      <button class="primary" id="rollBtn">Roll Dice</button>
    </div>

    <p id="ludoScore">You: 0/4 home • CPU: 0/4 home</p>
    <button class="secondary" id="newLudoBtn">New Game</button>
  `;

  let you = [0, 0, 0, 0];
  let cpu = [0, 0, 0, 0];
  let dice = 0;
  let waitingForToken = false;
  let gameOver = false;

  const status = document.getElementById('ludoStatus');
  const rollBtn = document.getElementById('rollBtn');
  const diceDisplay = document.getElementById('diceDisplay');
  const score = document.getElementById('ludoScore');

  function updateBoard() {
    document.querySelectorAll('.track-cell').forEach(cell => {
      cell.classList.remove('you-token', 'cpu-token');
      cell.textContent = cell.id.replace('track-', '');
    });

    you.forEach((pos, i) => {
      if (pos > 0 && pos <= 40) {
        const cell = document.getElementById('track-' + (pos - 1));
        if (cell) {
          cell.classList.add('you-token');
          cell.textContent = '🔵';
        }
      }
    });

    cpu.forEach(pos => {
      if (pos > 0 && pos <= 40) {
        const cell = document.getElementById('track-' + (pos - 1));
        if (cell) {
          cell.classList.add('cpu-token');
          cell.textContent = '🔴';
        }
      }
    });

    score.textContent =
      `You: ${you.filter(x => x >= 40).length}/4 home • ` +
      `CPU: ${cpu.filter(x => x >= 40).length}/4 home`;

    document.querySelectorAll('.token').forEach(btn => {
      btn.classList.remove('movable');

      const i = Number(btn.dataset.token);

      if (
        !gameOver &&
        waitingForToken &&
        you[i] < 40 &&
        you[i] + dice <= 40
      ) {
        btn.classList.add('movable');
      }
    });
  }

  function checkWinner() {
    if (you.every(x => x >= 40)) {
      gameOver = true;
      waitingForToken = false;
      status.textContent = '🎉 You won! +100 Game Points!';
      rollBtn.disabled = true;

      if (typeof addGamePoints === 'function') {
        addGamePoints(100);
      }

      updateBoard();
      return true;
    }

    if (cpu.every(x => x >= 40)) {
      gameOver = true;
      waitingForToken = false;
      status.textContent = '🤖 Computer won. Try again!';
      rollBtn.disabled = true;
      updateBoard();
      return true;
    }

    return false;
  }

  function computerTurn() {
    if (gameOver) return;

    setTimeout(() => {
      const cd = 1 + Math.floor(Math.random() * 6);
      diceDisplay.textContent = ['⚀','⚁','⚂','⚃','⚄','⚅'][cd - 1];

      const movable = cpu
        .map((pos, i) => ({pos, i}))
        .filter(x => x.pos < 40 && x.pos + cd <= 40);

      if (movable.length) {
        const choice = movable[Math.floor(Math.random() * movable.length)];
        cpu[choice.i] += cd;
      }

      updateBoard();

      if (!checkWinner()) {
        status.textContent = 'Your turn — roll the dice!';
        rollBtn.disabled = false;
      }
    }, 700);
  }

  rollBtn.onclick = () => {
    if (gameOver || waitingForToken) return;

    dice = 1 + Math.floor(Math.random() * 6);
    diceDisplay.textContent = ['⚀','⚁','⚂','⚃','⚄','⚅'][dice - 1];

    const movable = you
      .map((pos, i) => ({pos, i}))
      .filter(x => x.pos < 40 && x.pos + dice <= 40);

    if (!movable.length) {
      status.textContent = `You rolled ${dice}. No token can move.`;
      rollBtn.disabled = true;

      setTimeout(() => {
        if (!gameOver) {
          status.textContent = 'Computer is thinking...';
          computerTurn();
        }
      }, 600);

      return;
    }

    waitingForToken = true;
    rollBtn.disabled = true;

    status.textContent =
      `You rolled ${dice}. Tap a 🔵 token to move it.`;

    updateBoard();
  };

  document.querySelectorAll('.token').forEach(btn => {
    btn.onclick = () => {
      if (!waitingForToken || gameOver) return;

      const i = Number(btn.dataset.token);

      if (you[i] >= 40 || you[i] + dice > 40) return;

      you[i] += dice;
      waitingForToken = false;

      updateBoard();

      if (checkWinner()) return;

      status.textContent = 'Computer is thinking...';
      computerTurn();
    };
  });

  document.getElementById('newLudoBtn').onclick = () => {
    openLudo();
  };

  updateBoard();
  }
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
// Supabase connection
const supabaseClient = window.supabase.createClient(
  window.APP_CONFIG.SUPABASE_URL,
  window.APP_CONFIG.SUPABASE_ANON_KEY
);
