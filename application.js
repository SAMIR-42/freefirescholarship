
const QUESTIONS = [
    { image: "./assets/QN-1.png", question: "What was the name of the first Elite Pass in Free Fire?", options: ["Kitsune", "Hip Hop", "Doomsday Madness", "Sakura Blossom"],
correct: 0 },
    { image: "./assets/qn-2.jpg", question: "Who was Free Fire's first major collaboration partner?", options: ["DJ Alok", "One Punch Man", "Cristiano Ronaldo", "Money Heist"],
correct: 0 },
    { image: "./assets/qn-10.jpg", question: "What was the first default map in Free Fire?", options: ["Purgatory", "Bermuda", "Kalahari", "Alpine"],
correct: 1 },
    { image: "./assets/FF-RANK-IMG.PNG", question: "What was the old Free Fire rank sequence?", options: ["1", "2", "3", "4"], correct: 0 },
    { image: "./assets/qn-3.jpg", question: "Which character was featured on the old Free Fire login screen?", options: ["DJ Alok & Chrono", "Hayato & Kelly", "Kla & Maxim", " Primis & Nulla"], correct: 3 },
    { image: "./assets/qn-6.jpg", question: "Which map introduced the snowy environment?", options: ["Bermuda", "Purgatory", "Alpine", "Kalahari"],
  correct: 2 },
    { image: "./assets/qn-5.jpg", question: "Which item was required to revive teammates in early Battle Royale?", options: ["Dog Tag", "Revival Card", "Med Kit", "Token"],
  correct: 0 },
    { image: "./assets/qn-4.jpg", question: "Which item repairs armor durability?", options: ["Repair Kit", "Upgrade Chip", "Tool Box", "Armor Plate"],
  correct: 0 }, 
    { image: "./assets/qn-9.jpg", question: "Which was the original default profile avatar in early Free Fire?", options: ["3", "1", "2", "4"], correct: 1 },
    { image: "./assets/qn-8.jpg", question: "In which year was the original Free Fire banned in India, leading players to switch to Free Fire MAX?", options: ["2020", "2021", "2022", "2023"],
  correct: 2 },
];

/* ↓↓ PASS THRESHOLD — kitne sahi chahiye 10 mein se ↓↓ */
const PASS_THRESHOLD = 8;

/* ----------------------------------------------------------
   STATE
---------------------------------------------------------- */
let currentQuestionIndex = 0;
let score = 0;
let ffUid = "";
let ffUsername = "";

/* ----------------------------------------------------------
   ELEMENT REFERENCES
---------------------------------------------------------- */
const steps = document.querySelectorAll(".step");

const uidInput = document.getElementById("ff-uid");

/* ↓↓ TYPING-SPEED TRACKING ↓↓
   Har genuine keystroke ka timestamp record karta hai (paste ya
   programmatic value-set ignore karta hai — sirf real typing). */
let uidKeyTimestamps = [];

/* ↓↓ UID INPUT — sirf numbers type hone denge, letters/symbols block ↓↓ */
uidInput.addEventListener("input", (e) => {
    uidInput.value = uidInput.value.replace(/[^0-9]/g, "");

    if (uidInput.value.length === 0) {
        uidKeyTimestamps = []; // field clear hui to timing bhi reset
    } else if (e.inputType && e.inputType.startsWith("insert") && e.inputType !== "insertFromPaste") {
        uidKeyTimestamps.push(Date.now());
    }
});

/* ↓↓ Check karta hai ki last N keystrokes (jitni UID ki length hai)
   insaan-jaisi speed se type hui ya bahut fast (random-mash jaisi).
   Agar paste/autofill hui hai (timestamps kam hain) to check skip
   karta hai — false-positive avoid karne ke liye. ↓↓ */
function isSuspiciouslyFastTyping(uidLength) {
    if (uidKeyTimestamps.length < uidLength) return false;

    const relevant = uidKeyTimestamps.slice(-uidLength);
    const intervals = [];
    for (let i = 1; i < relevant.length; i++) {
        intervals.push(relevant[i] - relevant[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    /* ↓↓ THRESHOLD (ms) — isse kam average ka matlab bahut fast/
       random typing. Zyada strict karna ho to number badha de,
       loose karna ho to ghata de. ↓↓ */
    return avgInterval < 45;
}
const usernameInput = document.getElementById("ff-username");
const startQuizBtn = document.getElementById("start-quiz-btn");

const quizProgressText = document.getElementById("quiz-progress-text");
const quizProgressFill = document.getElementById("quiz-progress-fill");
const quizImage = document.getElementById("quiz-image");
const quizQuestionText = document.getElementById("quiz-question-text");
const quizOptions = document.getElementById("quiz-options");

const uploadBox = document.getElementById("upload-box");
const screenshotInput = document.getElementById("screenshot-input");
const uploadPreview = document.getElementById("upload-preview");
const uploadPlaceholder = document.getElementById("upload-placeholder");
const finishUploadBtn = document.getElementById("finish-upload-btn");

const failScoreText = document.getElementById("fail-score-text");
const retryBtn = document.getElementById("retry-btn");

const certCanvas = document.getElementById("certificate-canvas");
const downloadCertBtn = document.getElementById("download-cert-btn");
const shareWhatsappBtn = document.getElementById("share-whatsapp-btn");
const shareInstaBtn = document.getElementById("share-insta-btn");

/* ----------------------------------------------------------
   STEP NAVIGATION
---------------------------------------------------------- */
function goToStep(stepName) {
    steps.forEach((step) => {
        step.classList.toggle("active", step.dataset.step === stepName);
    });
}


const STORAGE_KEY = "ffScholarAppliedList";

function getAppliedList() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

function isDuplicate(uid, username) {
    const list = getAppliedList();
    return list.some(
        (entry) => entry.uid === uid || entry.username.toLowerCase() === username.toLowerCase()
    );
}

function saveApplied(uid, username) {
    const list = getAppliedList();
    list.push({ uid, username });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

const typingSpeedError = document.getElementById("typing-speed-error");
const duplicateError = document.getElementById("duplicate-error");

startQuizBtn.addEventListener("click", () => {
    const uidVal = uidInput.value.trim();
    const nameVal = usernameInput.value.trim();

    duplicateError.hidden = true;
    typingSpeedError.hidden = true;

    /* ↓↓ UID LENGTH CHECK — sirf 10, 11, ya 12 digit allowed ↓↓ */
    const isUidValid = /^(?!0+$)[0-9]{10,12}$/.test(uidVal);

    uidInput.style.borderColor = isUidValid ? "" : "#e74c3c";
    usernameInput.style.borderColor = nameVal ? "" : "#e74c3c";

    if (!isUidValid || !nameVal) {
        return;
    }

    /* ↓↓ TYPING-SPEED CHECK ↓↓ */
    if (isSuspiciouslyFastTyping(uidVal.length)) {
        uidInput.style.borderColor = "#e74c3c";

        typingSpeedError.hidden = false;
        typingSpeedError.style.animation = "none";
        void typingSpeedError.offsetWidth;
        typingSpeedError.style.animation = "errorShake 0.4s ease";

        return;
    }

    /* ↓↓ DUPLICATE CHECK ↓↓ */
    if (isDuplicate(uidVal, nameVal)) {
        uidInput.style.borderColor = "#e74c3c";
        usernameInput.style.borderColor = "#e74c3c";

        // Re-trigger shake animation even if error was already visible
        duplicateError.hidden = false;
        duplicateError.style.animation = "none";
        void duplicateError.offsetWidth; // force reflow to restart animation
        duplicateError.style.animation = "errorShake 0.4s ease";

        return;
    }

    ffUid = uidVal;
    ffUsername = nameVal;

    saveApplied(ffUid, ffUsername);

    currentQuestionIndex = 0;
    score = 0;

    renderQuestion();
    goToStep("quiz");
});

/* ----------------------------------------------------------
   STEP 2 — QUIZ RENDERING
---------------------------------------------------------- */
function renderQuestion() {
    const q = QUESTIONS[currentQuestionIndex];

    quizProgressText.textContent = `Question ${currentQuestionIndex + 1}/${QUESTIONS.length}`;
    quizProgressFill.style.width = `${((currentQuestionIndex + 1) / QUESTIONS.length) * 100}%`;

    quizImage.src = q.image;
    quizQuestionText.textContent = q.question;

    quizOptions.innerHTML = "";

    q.options.forEach((optionText, index) => {
        const btn = document.createElement("button");
        btn.className = "quiz-option";
        btn.textContent = optionText;
        btn.addEventListener("click", () => handleAnswer(index, btn));
        quizOptions.appendChild(btn);
    });
}

function handleAnswer(selectedIndex, selectedBtn) {
    // Prevent double-clicking once an answer is locked in
    const allOptions = quizOptions.querySelectorAll(".quiz-option");
    allOptions.forEach((opt) => (opt.style.pointerEvents = "none"));

    const q = QUESTIONS[currentQuestionIndex];
    const isCorrect = selectedIndex === q.correct;

    selectedBtn.classList.add(isCorrect ? "correct" : "wrong");
    if (!isCorrect) {
        allOptions[q.correct].classList.add("correct");
    }

    if (isCorrect) score++;

    // Short delay so the user sees the correct/wrong highlight, then advance
    setTimeout(() => {
        currentQuestionIndex++;

        if (currentQuestionIndex < QUESTIONS.length) {
            renderQuestion();
        } else {
            goToStep("upload");
        }
    }, 700);
}

/* ----------------------------------------------------------
   STEP 3 — SCREENSHOT UPLOAD (preview only, stays in-memory)
---------------------------------------------------------- */

const removeUploadBtn = document.getElementById("remove-upload-btn");
const faceRejectError = document.getElementById("face-reject-error");

/* ↓↓ FACE DETECTION (face-api.js — real ML model) ↓↓
   TinyFaceDetector real human face anatomy (eyes/nose/jaw
   structure) pe trained hai — Free Fire jaisa stylized 3D game
   character isse naturally MISS ho jata hai (galat reject nahi
   hoga), sirf asli insaan ka chehra detect hoga. Models CDN se
   background mein load hote hain jaise hi page khulta hai. */
const faceModelsReady = faceapi.nets.tinyFaceDetector.loadFromUri(
    "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights"
).catch((err) => {
    console.warn("Face model load failed:", err);
});

async function detectHumanFace(imgElement) {
    try {
        await faceModelsReady;

        /* ↓↓ inputSize/scoreThreshold — jitna zyada threshold, utna
           strict/strong detection (false-positive kam honge) ↓↓ */
        const options = new faceapi.TinyFaceDetectorOptions({
            inputSize: 320,
            scoreThreshold: 0.5,
        });

        const detections = await faceapi.detectAllFaces(imgElement, options);
        return detections.length > 0;
    } catch (err) {
        console.warn("Face detection failed:", err);
        return false; // model load na ho paye to bhi user stuck nahi hoga
    }
}
screenshotInput.addEventListener("change", () => {
    const file = screenshotInput.files[0];
    if (!file) return;

    faceRejectError.hidden = true;

    const reader = new FileReader();
    reader.onload = (e) => {
        const tempImg = new Image();

        tempImg.onload = async () => {
            const hasFace = await detectHumanFace(tempImg);

            if (hasFace) {
                faceRejectError.hidden = false;
                faceRejectError.style.animation = "none";
                void faceRejectError.offsetWidth;
                faceRejectError.style.animation = "errorShake 0.4s ease";

                screenshotInput.value = "";
                return;
            }

            uploadPreview.src = e.target.result;
            uploadPreview.hidden = false;
            uploadPlaceholder.hidden = true;
            removeUploadBtn.hidden = false;
            finishUploadBtn.disabled = false; // ← screenshot valid, ab submit enable
        };

        tempImg.src = e.target.result;
    };
    reader.readAsDataURL(file);
});

/* ↓↓ REMOVE BUTTON — image hataye, dubara select karne ke liye
   ready ho jaye, aur submit button wapas disable ho jaye. ↓↓ */
removeUploadBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    screenshotInput.value = "";
    uploadPreview.src = "";
    uploadPreview.hidden = true;
    uploadPlaceholder.hidden = false;
    removeUploadBtn.hidden = true;
    finishUploadBtn.disabled = true; // ← image hati, submit wapas disable
});

const OCR_BONUS_POINTS = 2;
const AGE_BADGE_REGEX = /\b([5-8])\s*YEARS?\s*OLD\b/i;


const LEVEL_REGEX = /(?:LV|LEVEL)\s*[.:]?\s*(\d{1,3})/i;
const LIKES_REGEX = /([\d,]{3,})\s*LIKES?/i;

const ocrStatus = document.getElementById("ocr-status");
const failScanInsight = document.getElementById("fail-scan-insight");
const certScanInsight = document.getElementById("cert-scan-insight");


function preprocessScreenshot(imgSrc) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            /* ↓↓ CROP WIDTH % — right-side info area ↓↓ */
            const cropWidthPercent = 0.4;
            const cropX = img.naturalWidth * (1 - cropWidthPercent);
            const cropWidth = img.naturalWidth * cropWidthPercent;
            const cropHeight = img.naturalHeight;

            /* ↓↓ UPSCALE FACTOR — bada karega to text aur clear hoga ↓↓ */
            const upscale = 2;

            const canvas = document.createElement("canvas");
            canvas.width = cropWidth * upscale;
            canvas.height = cropHeight * upscale;

            const ctx = canvas.getContext("2d");
            ctx.imageSmoothingEnabled = true;
            ctx.drawImage(
                img,
                cropX, 0, cropWidth, cropHeight,   // source: right 40% crop
                0, 0, canvas.width, canvas.height   // destination: upscaled
            );

            // Grayscale + contrast threshold — text pure black/white
            // ban jata hai, jo Tesseract sabse accurately padhta hai.
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            /* ↓↓ CONTRAST THRESHOLD — 0-255, jitna zyada utna strict cutoff ↓↓ */
            const threshold = 150;

            for (let i = 0; i < data.length; i += 4) {
                const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                const value = gray > threshold ? 255 : 0;
                data[i] = data[i + 1] = data[i + 2] = value;
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas);
        };
        img.src = imgSrc;
    });
}


function buildInsightHTML(detectedText, ageDetected) {
    const lines = [];

    if (ageDetected) {
        lines.push(`<p><i class="fa-solid fa-clock-rotate-left"></i> You're a verified <strong>OG player</strong> — your account has real history!</p>`);
    }

    const levelMatch = detectedText.match(LEVEL_REGEX);
    if (levelMatch) {
        const level = parseInt(levelMatch[1], 10);
        if (level >= 60) {
            lines.push(`<p><i class="fa-solid fa-fire"></i> Level ${level} — absolute legend status!</p>`);
        } else if (level >= 40) {
            lines.push(`<p><i class="fa-solid fa-fire"></i> Level ${level} — solid grinder, keep going!</p>`);
        } else if (level > 0) {
            lines.push(`<p><i class="fa-solid fa-seedling"></i> Level ${level} — every legend starts somewhere!</p>`);
        }
    }

    const likesMatch = detectedText.match(LIKES_REGEX);
    if (likesMatch) {
        lines.push(`<p><i class="fa-solid fa-heart"></i> ${likesMatch[1]} likes — the community loves you!</p>`);
    }

    if (lines.length === 0) {
        lines.push(`<p><i class="fa-solid fa-circle-check"></i> Thanks for verifying your profile!</p>`);
    }

    return lines.join("");
}

finishUploadBtn.addEventListener("click", async () => {

    let finalScore = score;
    let insightHTML = "";

    // Sirf tab OCR chalega jab user ne actually screenshot upload ki ho
    if (screenshotInput.files[0]) {
        finishUploadBtn.disabled = true;
        ocrStatus.hidden = false;

        try {
            const processedCanvas = await preprocessScreenshot(uploadPreview.src);
            const result = await Tesseract.recognize(processedCanvas, "eng");
            const detectedText = result.data.text;

            const ageDetected = AGE_BADGE_REGEX.test(detectedText);
            if (ageDetected) {
                finalScore = Math.min(finalScore + OCR_BONUS_POINTS, QUESTIONS.length);
            }

            insightHTML = buildInsightHTML(detectedText, ageDetected);
        } catch (err) {
            // OCR fail ho jaye to bhi user stuck nahi hoga — sirf
            // bonus/insight nahi milega, quiz score wahi rahega
            console.warn("OCR scan failed:", err);
        }

        ocrStatus.hidden = true;
        finishUploadBtn.disabled = false;
    }

    if (finalScore >= PASS_THRESHOLD) {
        if (insightHTML) {
            certScanInsight.innerHTML = insightHTML;
            certScanInsight.hidden = false;
        }
        generateCertificate();
        goToStep("certificate");
    } else {
        failScoreText.textContent = `You scored ${finalScore}/${QUESTIONS.length}. A minimum of ${PASS_THRESHOLD}/${QUESTIONS.length} is required to qualify for the scholarship.`;

        if (insightHTML) {
            failScanInsight.innerHTML = insightHTML;
            failScanInsight.hidden = false;
        }

        goToStep("fail");
    }
});



const CERT_IMAGE_PATH = "./assets/ff-certificate.png"; // ← rename here if your file name differs

const CERT_NAME_Y = 440;          // vertical position (within 420–460 range given)
const CERT_NAME_MAX_WIDTH = 960;  // 50% of 1920 — text won't cross this width
const CERT_FONT_SIZE = 42;
const CERT_FONT_FAMILY = "Playfair Display";
const CERT_FONT_COLOR = "#2B2319";

function generateCertificate() {
    const ctx = certCanvas.getContext("2d");
    const certImg = new Image();

    certImg.onload = () => {
        certCanvas.width = certImg.naturalWidth;
        certCanvas.height = certImg.naturalHeight;

        // Wait for the custom font to be ready before drawing text,
        // otherwise canvas may fall back to a default font on first load.
        document.fonts.load(`${CERT_FONT_SIZE}px "${CERT_FONT_FAMILY}"`).then(() => {
            ctx.drawImage(certImg, 0, 0);

            ctx.font = `700 ${CERT_FONT_SIZE}px "${CERT_FONT_FAMILY}", serif`;
            ctx.fillStyle = CERT_FONT_COLOR;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            // Auto-shrink font size slightly if the username is too long
            // to fit within CERT_NAME_MAX_WIDTH.
            let fontSize = CERT_FONT_SIZE;
            ctx.font = `700 ${fontSize}px "${CERT_FONT_FAMILY}", serif`;
            while (ctx.measureText(ffUsername).width > CERT_NAME_MAX_WIDTH && fontSize > 20) {
                fontSize -= 2;
                ctx.font = `700 ${fontSize}px "${CERT_FONT_FAMILY}", serif`;
            }

            ctx.fillText(ffUsername, certCanvas.width / 2, CERT_NAME_Y);
        });
    };

    certImg.src = CERT_IMAGE_PATH;
}

/* ----------------------------------------------------------
   DOWNLOAD CERTIFICATE
---------------------------------------------------------- */
downloadCertBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = `FF-Scholar-Certificate-${ffUsername}.png`;
    link.href = certCanvas.toDataURL("image/png");
    link.click();
});


function shareCertificate(platformUrl) {
    certCanvas.toBlob((blob) => {
        const file = new File([blob], "certificate.png", { type: "image/png" });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({
                files: [file],
                title: "Free Fire Scholar Certificate",
                text: "I just qualified for the Free Fire Scholarship!",
            }).catch(() => {});
        } else {
            window.open(platformUrl, "_blank");
        }
    });
}

shareWhatsappBtn.addEventListener("click", () => {
    const message = encodeURIComponent("I just qualified for the Free Fire Scholarship! 🎉");
    shareCertificate(`https://api.whatsapp.com/send?text=${message}`);
});

shareInstaBtn.addEventListener("click", () => {
    shareCertificate("https://www.instagram.com/");
});