document.addEventListener("DOMContentLoaded", () => {

    const chatContainer = document.getElementById("chat-container");
    const userInput = document.getElementById("user-input");
    const sendBtn = document.getElementById("send-btn");

    /* =====================
       حافظه کوتاه
    ===================== */
    let memory = [];

    /* =====================
       نرمال‌سازی متن
    ===================== */
    function normalize(text) {
        return text
            .toLowerCase()
            .replace(/[؟!.,]/g, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    /* =====================
       افزودن پیام
    ===================== */
    function addMessage(sender, text, typing = false) {
        const msg = document.createElement("div");
        msg.className = `message ${sender}`;
        chatContainer.appendChild(msg);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        if (typing) {
            typeText(msg, text);
        } else {
            msg.textContent = text;
        }
    }

    /* =====================
       تایپ زنده (حس ChatGPT)
    ===================== */
    function typeText(element, text) {
        element.textContent = "‎";
        let i = 0;
        const speed = Math.max(15, 40 - text.length / 3);

        const interval = setInterval(() => {
            element.textContent += text[i];
            chatContainer.scrollTop = chatContainer.scrollHeight;
            i++;
            if (i >= text.length) clearInterval(interval);
        }, speed);
    }

    /* =====================
       دیتابیس پاسخ‌ها
    ===================== */
    const brain = [
        {
            intents: ["سلام", "hi", "hello"],
            reply: () => "سلام 😊 خوش اومدی. چطور می‌تونم کمکت کنم؟"
        },
        {
            intents: ["اسمت", "تو کی هستی", "name"],
            reply: () => "من یه باتم که توسط تیم نبریکس ساخته شدم🤖\nو میتونم به سوال هایی درباریه سرور نبریکس پاسخ بدم\nالبته که چت های من از قبل برنامه ریزی شده\nو در  اون حد پیشرفته نیستم"
        },
        {
            intents: ["امیرطاها", "امیرطاها کیه؟"],
            reply: () => "امیرطاها اونر سرور نبریکسه👑\nسرور نبریکس رو با صدرا ساختن که میتونی بری توش بازی کنی"
        },
        {
            intents: ["چطوری", "حالت خوبه"],
            reply: () => "مرسی 😊 من خوبم، آماده کمک."
        },
        {
            intents: ["html"],
            reply: () => "HTML برای ساختار صفحات وب استفاده میشه."
        },
        {
            intents: ["css"],
            reply: () => "CSS برای طراحی و زیبایی سایت استفاده میشه 🎨"
        },
        {
            intents: ["js", "javascript"],
            reply: () => "JavaScript منطق و رفتار سایت رو کنترل می‌کنه 🧠"
        },
        {
            intents: ["کمک", "help"],
            reply: () => "سوالتو بپرس، سعی می‌کنم راهنمایی‌ت کنم 🙂"
        }
    ];

    /* =====================
       ترجمه آفلاین
    ===================== */

    const faToEn = {
        "سلام": "hello",
        "خوبی": "how are you",
        "اسم": "name",
        "تو": "you",
        "من": "me",
        "خوب": "good",
        "بد": "bad",
        "این": "this",
        "چیه": "what is"
    };

    const enToFa = {
        "hello": "سلام",
        "hi": "سلام",
        "how": "چطور",
        "are": "هستی",
        "you": "تو",
        "good": "خوب",
        "bad": "بد",
        "this": "این",
        "is": "است",
        "name": "اسم"
    };

    const fullTranslations = {
        "how are you": "چطوری؟",
        "what is your name": "اسمت چیه؟",
        "this is good": "این خوبه",
        "hello how are you": "سلام، چطوری؟"
    };

    function detectTranslateCommand(text) {
        text = text.toLowerCase();
        if (text.includes("به فارسی ترجمه")) return "to-fa";
        if (text.includes("به انگلیسی ترجمه")) return "to-en";
        if (text.includes("translate to persian")) return "to-fa";
        if (text.includes("translate to english")) return "to-en";
        return null;
    }

    function extractSentence(text) {
        return text
            .replace("به فارسی ترجمه کن", "")
            .replace("به انگلیسی ترجمه کن", "")
            .replace("translate to persian", "")
            .replace("translate to english", "")
            .trim();
    }

    function wordTranslate(text, dict) {
        return text
            .split(" ")
            .map(w => dict[w] || w)
            .join(" ");
    }

    function offlineTranslate(input) {
        const cmd = detectTranslateCommand(input);
        if (!cmd) return null;

        const sentence = normalize(extractSentence(input));

        if (fullTranslations[sentence]) {
            return "ترجمه:\n" + fullTranslations[sentence];
        }

        if (cmd === "to-fa") {
            return "ترجمه:\n" + wordTranslate(sentence, enToFa);
        }

        if (cmd === "to-en") {
            return "Translation:\n" + wordTranslate(sentence, faToEn);
        }
    }

    /* =====================
       پاسخ جایگزین هوشمند
    ===================== */
    function smartFallback(text) {
        if (text.length < 4) return "می‌تونی یکم بیشتر توضیح بدی؟ 🤔";
        if (text.includes("چرا")) return "سوال خوبیه، بستگی به شرایط داره.";
        if (text.includes("چطور") || text.includes("چجوری"))
            return "می‌تونم راهنمایی‌ت کنم، دقیق‌تر بگو.";
        if (memory.length > 0)
            return `منظورت درباره «${memory[memory.length - 1]}» هست؟`;
        return "در موردش اطلاعات دقیقی ندارم، ولی می‌تونیم بررسیش کنیم 🙂";
    }

    /* =====================
       انتخاب پاسخ نهایی
    ===================== */
    function getBotReply(userText) {
        const text = normalize(userText);

        const translation = offlineTranslate(userText);
        if (translation) return translation;

        for (let item of brain) {
            for (let intent of item.intents) {
                if (text.includes(intent)) {
                    return item.reply();
                }
            }
        }

        return smartFallback(text);
    }

    /* =====================
       ارسال پیام
    ===================== */
    function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        addMessage("user", text);
        memory.push(text);
        if (memory.length > 5) memory.shift();

        userInput.value = "";

        setTimeout(() => {
            const reply = getBotReply(text);
            addMessage("bot", reply, true);
        }, 500);
    }

    /* =====================
       رویدادها
    ===================== */
    sendBtn.addEventListener("click", sendMessage);
    userInput.addEventListener("keydown", e => {
        if (e.key === "Enter") sendMessage();
    });

});
