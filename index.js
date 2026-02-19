import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "elegant-cat-chatbox";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const defaultSettings = {
    enabled: false,
    apiKey: "",
    chuteUrl: "",
    catImageLeft: "",
    catImageRight: "",
    decorImageLeft: "",
    decorImageRight: "",
    selectedPromptIndex: 0,
    bgMode: "black",
    removebgKey: "",
    titleText: "",
    titleEnabled: false
};

// ─── Cat Prompt Themes ─────────────────────────────────────────────────────────
const CAT_THEMES = [
    { label: "🎲 Random!", left_black: null, right_black: null, left_white: null, right_white: null },
    {
        label: "🌸 Botanical Garden",
        left_black:  "a small fluffy chibi cat nestled among delicate wildflowers, soft watercolor illustration, pastel pink and green, pure solid black background, no text, no watermark, facing right",
        right_black: "a small fluffy chibi cat peeking through botanical sprigs and blossoms, soft watercolor style, warm pastel tones, pure solid black background, no text, no watermark",
        left_white:  "a small fluffy chibi cat nestled among delicate wildflowers, soft watercolor illustration, pastel pink and green, pure solid white background, no text, no watermark, facing right",
        right_white: "a small fluffy chibi cat peeking through botanical sprigs and blossoms, soft watercolor style, warm pastel tones, pure solid white background, no text, no watermark"
    },
    {
        label: "📚 Cozy Library",
        left_black:  "a chubby chibi cat curled up on a stack of old books with a tiny teacup, soft illustrated style, warm amber tones, pure solid black background, no text, no watermark",
        right_black: "a fluffy chibi cat wearing a tiny scarf beside colorful book spines, soft illustrated style, warm cozy colors, pure solid black background, hearts floating, no text, no watermark",
        left_white:  "a chubby chibi cat curled up on a stack of old books with a tiny teacup, soft illustrated style, warm amber tones, pure solid white background, no text, no watermark",
        right_white: "a fluffy chibi cat wearing a tiny scarf beside colorful book spines, soft illustrated style, warm cozy colors, pure solid white background, hearts floating, no text, no watermark"
    },
    {
        label: "✨ Magical & Sparkly",
        left_black:  "a magical glowing chibi cat with tiny stars and sparkles floating around it, fantasy art style, soft purple and gold tones, pure solid black background, crescent moon nearby, no text, no watermark",
        right_black: "a mystical chibi cat with a star wand and swirling magical particles, fantasy style, rose gold and lavender palette, pure solid black background, no text, no watermark",
        left_white:  "a magical glowing chibi cat with tiny stars and sparkles floating around it, fantasy art style, soft purple and gold tones, pure solid white background, crescent moon nearby, no text, no watermark",
        right_white: "a mystical chibi cat with a star wand and swirling magical particles, fantasy style, rose gold and lavender palette, pure solid white background, no text, no watermark"
    },
    {
        label: "😴 Sleepy Loaf",
        left_black:  "a perfectly loaf-shaped sleeping chibi cat with closed eyes and rosy cheeks, adorable illustration, soft neutral tones, pure solid black background, zzz bubbles, ultra fluffy, no text, no watermark",
        right_black: "a round sleepy chibi cat mid-yawn with tiny paws tucked in, cute style, pastel cream and grey, pure solid black background, small pillow nearby, no text, no watermark",
        left_white:  "a perfectly loaf-shaped sleeping chibi cat with closed eyes and rosy cheeks, adorable illustration, soft neutral tones, pure solid white background, zzz bubbles, ultra fluffy, no text, no watermark",
        right_white: "a round sleepy chibi cat mid-yawn with tiny paws tucked in, cute style, pastel cream and grey, pure solid white background, small pillow nearby, no text, no watermark"
    },
    {
        label: "🌙 Midnight Dreamer",
        left_black:  "a dark fluffy chibi cat glowing softly at the edges, dreamy illustration, deep blue and silver palette, pure solid black background, moon and tiny stars around it, no text, no watermark",
        right_black: "a chibi cat gazing up at floating lanterns and paper stars, nocturnal soft illustration, navy and gold tones, pure solid black background, no text, no watermark",
        left_white:  "a dark fluffy chibi cat glowing softly at the edges, dreamy illustration, deep blue and silver palette, pure solid white background, moon and tiny stars around it, no text, no watermark",
        right_white: "a chibi cat gazing up at floating lanterns and paper stars, nocturnal soft illustration, navy and gold tones, pure solid white background, no text, no watermark"
    },
    {
        label: "🍓 Cottagecore",
        left_black:  "a chubby chibi cat wearing a tiny flower crown in dewy grass, cottagecore style, strawberry red and sage green, pure solid black background, mushroom nearby, no text, no watermark",
        right_black: "a fluffy chibi cat in a woven basket surrounded by berries and daisies, cottagecore illustration, warm earthy pastels, pure solid black background, butterfly nearby, no text, no watermark",
        left_white:  "a chubby chibi cat wearing a tiny flower crown in dewy grass, cottagecore style, strawberry red and sage green, pure solid white background, mushroom nearby, no text, no watermark",
        right_white: "a fluffy chibi cat in a woven basket surrounded by berries and daisies, cottagecore illustration, warm earthy pastels, pure solid white background, butterfly nearby, no text, no watermark"
    },
    {
        label: "🍂 Autumn Vibes",
        left_black:  "a cozy chibi cat wrapped in a tiny knitted scarf among falling autumn leaves, soft illustrated style, burnt orange and golden yellow, pure solid black background, acorn nearby, no text, no watermark",
        right_black: "a fluffy chibi cat peeking out of a pile of colorful fallen leaves, warm russet and amber, pure solid black background, playful mood, no text, no watermark",
        left_white:  "a cozy chibi cat wrapped in a tiny knitted scarf among falling autumn leaves, soft illustrated style, burnt orange and golden yellow, pure solid white background, acorn nearby, no text, no watermark",
        right_white: "a fluffy chibi cat peeking out of a pile of colorful fallen leaves, warm russet and amber, pure solid white background, playful mood, no text, no watermark"
    },
    {
        label: "🎀 Fancy & Elegant",
        left_black:  "a sophisticated chibi cat wearing a tiny bow tie and top hat, elegant illustration, cream and gold palette, pure solid black background, ornate swirls, dignified yet cute, no text, no watermark",
        right_black: "a regal fluffy chibi cat draped in tiny ribbons and pearls, elegant soft illustration, rose gold and ivory tones, pure solid black background, small crown, no text, no watermark",
        left_white:  "a sophisticated chibi cat wearing a tiny bow tie and top hat, elegant illustration, cream and gold palette, pure solid white background, ornate swirls, dignified yet cute, no text, no watermark",
        right_white: "a regal fluffy chibi cat draped in tiny ribbons and pearls, elegant soft illustration, rose gold and ivory tones, pure solid white background, small crown, no text, no watermark"
    },
    {
        label: "🎪 Silly & Dramatic",
        left_black:  "a chibi cat with a hilariously shocked expression, tiny lightning bolts, expressive comic style, bright colors, pure solid black background, dramatic pose, no text, no watermark",
        right_black: "a chibi cat in a tiny superhero cape striking a heroic pose, bold comic illustration, vibrant primary colors, pure solid black background, action stars, no text, no watermark",
        left_white:  "a chibi cat with a hilariously shocked expression, tiny lightning bolts, expressive comic style, bright colors, pure solid white background, dramatic pose, no text, no watermark",
        right_white: "a chibi cat in a tiny superhero cape striking a heroic pose, bold comic illustration, vibrant primary colors, pure solid white background, action stars, no text, no watermark"
    }
];

// ─── Corner Decoration Prompt Themes ──────────────────────────────────────────
const DECOR_THEMES = [
    { label: "🎲 Random!" },
    {
        label: "🌿 Botanical Ink",
        black: "ornamental botanical corner flourish for a book page, delicate hand-drawn ink line art style, thin curling stems with tiny leaves and small flowers radiating from corner, pure solid black background, white ink lines, no fill, elegant doodle style, no text, no watermark",
        white: "ornamental botanical corner flourish for a book page, delicate hand-drawn ink line art style, thin curling stems with tiny leaves and small flowers radiating from corner, pure solid white background, black ink lines, no fill, elegant doodle style, no text, no watermark"
    },
    {
        label: "🌀 Baroque Scrollwork",
        black: "baroque ornamental corner decoration, elegant swirling acanthus leaf scrollwork radiating outward from a corner, classical manuscript style, pure solid black background, white fine lines, no text, no watermark",
        white: "baroque ornamental corner decoration, elegant swirling acanthus leaf scrollwork radiating outward from a corner, classical manuscript style, pure solid white background, black fine lines, no text, no watermark"
    },
    {
        label: "✨ Magic & Stars",
        black: "ornate magical corner flourish, delicate swirling vines with tiny stars and sparkle dots, fantasy notebook doodle style, pure solid black background, glowing white ink lines, no text, no watermark",
        white: "ornate magical corner flourish, delicate swirling vines with tiny stars and sparkle dots, fantasy notebook doodle style, pure solid white background, black ink lines, no text, no watermark"
    },
    {
        label: "🌸 Floral Wreath Corner",
        black: "delicate floral corner border decoration, tiny roses and wildflowers with thin curling stems forming an L-shape corner ornament, watercolor sketch style, pure solid black background, white lines, no text, no watermark",
        white: "delicate floral corner border decoration, tiny roses and wildflowers with thin curling stems forming an L-shape corner ornament, watercolor sketch style, pure solid white background, black lines, no text, no watermark"
    },
    {
        label: "🍃 Minimalist Leaves",
        black: "minimalist corner decoration, thin elegant vine with delicate leaves and tiny berries forming a gentle L-shape, clean botanical line art, pure solid black background, white ink lines, simple and refined, no text, no watermark",
        white: "minimalist corner decoration, thin elegant vine with delicate leaves and tiny berries forming a gentle L-shape, clean botanical line art, pure solid white background, black ink lines, simple and refined, no text, no watermark"
    },
    {
        label: "⚜️ Gothic Filigree",
        black: "gothic filigree corner ornament, intricate interlacing fine lines with diamond shapes and pointed arches, medieval manuscript border style, pure solid black background, white metallic lines, ornate and detailed, no text, no watermark",
        white: "gothic filigree corner ornament, intricate interlacing fine lines with diamond shapes and pointed arches, medieval manuscript border style, pure solid white background, black fine lines, ornate and detailed, no text, no watermark"
    }
];

// ─── Get prompts ───────────────────────────────────────────────────────────────
function getCatPrompts() {
    let idx = extension_settings[extensionName].selectedCatTheme ?? 0;
    const suffix = (extension_settings[extensionName].bgMode ?? "black") === "black" ? "_black" : "_white";
    if (idx <= 0) {
        idx = Math.floor(Math.random() * (CAT_THEMES.length - 1)) + 1;
        console.log(`[${extensionName}] 🎲 Random cat theme: "${CAT_THEMES[idx].label}"`);
    }
    return { left: CAT_THEMES[idx][`left${suffix}`], right: CAT_THEMES[idx][`right${suffix}`], label: CAT_THEMES[idx].label };
}

function getDecorPrompts() {
    let idx = extension_settings[extensionName].selectedDecorTheme ?? 0;
    const bgKey = (extension_settings[extensionName].bgMode ?? "black") === "black" ? "black" : "white";
    if (idx <= 0) {
        idx = Math.floor(Math.random() * (DECOR_THEMES.length - 1)) + 1;
        console.log(`[${extensionName}] 🎲 Random decor theme: "${DECOR_THEMES[idx].label}"`);
    }
    return { prompt: DECOR_THEMES[idx][bgKey], label: DECOR_THEMES[idx].label };
}

// ─── Status helper ─────────────────────────────────────────────────────────────
function setStatus(msg, type = "loading", target = "#ecc_status") {
    $(target).text(msg).attr("class", `ecc-status ${type}`).show();
}

// ─── Generate image ─────────────────────────────────────────────────────────────
async function generateImage(apiKey, chuteUrl, prompt) {
    const res = await fetch(chuteUrl, {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
    });
    if (!res.ok) { const e = await res.text(); throw new Error(`API error ${res.status}: ${e}`); }
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("image/")) {
        const blob = await res.blob();
        return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(new Error("Read failed")); r.readAsDataURL(blob); });
    }
    const data = await res.json();
    if (data.images?.length > 0)  return `data:image/png;base64,${data.images[0]}`;
    if (data.data?.[0]?.b64_json) return `data:image/png;base64,${data.data[0].b64_json}`;
    if (data.data?.[0]?.url)      return data.data[0].url;
    throw new Error("Unrecognised response format!");
}

// ─── remove.bg ────────────────────────────────────────────────────────────────
async function removeBackground(imageDataUrl, key) {
    const blob = await (await fetch(imageDataUrl)).blob();
    const fd = new FormData();
    fd.append("image_file", blob, "img.png");
    fd.append("size", "auto");
    const res = await fetch("https://api.remove.bg/v1.0/removebg", { method: "POST", headers: { "X-Api-Key": key }, body: fd });
    if (!res.ok) { const e = await res.text(); throw new Error(`remove.bg ${res.status}: ${e}`); }
    const rb = await res.blob();
    return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(new Error("Read failed")); r.readAsDataURL(rb); });
}

// ─── Positioning ──────────────────────────────────────────────────────────────
// All overlays are positioned relative to the #chat bounding rect.
// Cats sit on TOP of the chat: bottoms touch the top edge of #chat.
// Corner decorations sit at the top-left and top-right corners of #chat.
// Title bar sits just above the cats.
function positionAll() {
    const chat = document.getElementById("chat");
    if (!chat) return;
    const r = chat.getBoundingClientRect();
    const s = extension_settings[extensionName];
    const CAT   = 110;  // cat image size px
    const DECOR = 90;   // corner decor size px
    const GAP   = 4;    // small gap between cat bottom and chat top

    // Cats: bottom edge sits right on the top of the chat
    $("#ecc_cat_left").css({
        left: r.left + "px",
        top:  (r.top - CAT + GAP) + "px",
        width: CAT + "px", height: CAT + "px"
    });
    $("#ecc_cat_right").css({
        left: (r.right - CAT) + "px",
        top:  (r.top - CAT + GAP) + "px",
        width: CAT + "px", height: CAT + "px"
    });

    // Corner decorations: overlay the top corners of the chat
    $("#ecc_decor_tl").css({
        left: r.left + "px",
        top:  r.top + "px",
        width: DECOR + "px", height: DECOR + "px"
    });
    $("#ecc_decor_tr").css({
        left: (r.right - DECOR) + "px",
        top:  r.top + "px",
        width: DECOR + "px", height: DECOR + "px"
    });

    // Title bar: sits above the cats
    const titleHeight = 38;
    const titleTop    = r.top - CAT - titleHeight + GAP;
    $("#ecc_title_bar").css({
        left:   r.left + "px",
        top:    titleTop + "px",
        width:  r.width + "px",
        height: titleHeight + "px"
    });
}

// ─── Apply / Remove ────────────────────────────────────────────────────────────
function applyDecorations() {
    const s = extension_settings[extensionName];
    if (!s.catImageLeft) { setStatus("⚠️ No cats yet — generate some first!", "error"); return; }

    removeDecorations();

    const blend = s.bgMode === "black" ? "ecc-blend-screen" : "";

    // Cats
    $("body").append(`
        <img class="ecc-overlay ecc-cat ${blend}" id="ecc_cat_left"  src="${s.catImageLeft}"                    alt="cat left"/>
        <img class="ecc-overlay ecc-cat ecc-flip ${blend}" id="ecc_cat_right" src="${s.catImageRight || s.catImageLeft}" alt="cat right"/>
    `);

    // Corner decorations (only if generated)
    if (s.decorImageLeft) {
        $("body").append(`
            <img class="ecc-overlay ecc-decor ${blend}" id="ecc_decor_tl" src="${s.decorImageLeft}" alt="decor top-left"/>
            <img class="ecc-overlay ecc-decor ecc-decor-flip ${blend}" id="ecc_decor_tr" src="${s.decorImageLeft}" alt="decor top-right"/>
        `);
    }

    positionAll();
    $(window).on("resize.ecc scroll.ecc", positionAll);
}

function applyTitleBar() {
    const s = extension_settings[extensionName];
    $("#ecc_title_bar").remove();

    if (!s.titleEnabled) return;

    $("body").append(`
        <div id="ecc_title_bar" class="ecc-title-bar">
            <span class="ecc-title-ornament">⸻✦⸻</span>
            <span class="ecc-title-text">${s.titleText || "Your Story Title"}</span>
            <span class="ecc-title-ornament">⸻✦⸻</span>
        </div>
    `);

    positionAll();
}

function removeDecorations() {
    $("#ecc_cat_left, #ecc_cat_right, #ecc_decor_tl, #ecc_decor_tr").remove();
    $(window).off("resize.ecc scroll.ecc");
}

function removeAll() {
    removeDecorations();
    $("#ecc_title_bar").remove();
}

// ─── UI helpers ───────────────────────────────────────────────────────────────
function updateBgModeUI() {
    const mode = extension_settings[extensionName].bgMode ?? "black";
    if (mode === "removebg") {
        $("#ecc_removebg_row").show();
        $("#ecc_bg_hint").text("remove.bg gives real PNG transparency — crisp on any background.");
    } else {
        $("#ecc_removebg_row").hide();
        $("#ecc_bg_hint").text("Black bg + screen blend: black turns transparent. Great for dark UIs!");
    }
}

function populateDropdowns() {
    const $cats   = $("#ecc_cat_theme");
    const $decors = $("#ecc_decor_theme");
    $cats.empty();   CAT_THEMES.forEach((t, i)   => $cats.append(`<option value="${i}">${t.label}</option>`));
    $decors.empty(); DECOR_THEMES.forEach((t, i) => $decors.append(`<option value="${i}">${t.label}</option>`));
    const s = extension_settings[extensionName];
    $cats.val(Math.max(0, s.selectedCatTheme ?? 0));
    $decors.val(Math.max(0, s.selectedDecorTheme ?? 0));
}

// ─── Event Handlers ────────────────────────────────────────────────────────────
function onToggleChange(e) {
    const v = Boolean($(e.target).prop("checked"));
    extension_settings[extensionName].enabled = v;
    saveSettingsDebounced();
    if (v) { applyDecorations(); applyTitleBar(); } else { removeAll(); }
}

function onApiKeyChange()     { extension_settings[extensionName].apiKey    = $("#ecc_api_key").val().trim();    saveSettingsDebounced(); }
function onChuteUrlChange()   { extension_settings[extensionName].chuteUrl  = $("#ecc_chute_url").val().trim();  saveSettingsDebounced(); }
function onRemoveBgKeyChange(){ extension_settings[extensionName].removebgKey = $("#ecc_removebg_key").val().trim(); saveSettingsDebounced(); }
function onCatThemeChange()   { extension_settings[extensionName].selectedCatTheme   = parseInt($("#ecc_cat_theme").val(), 10);   saveSettingsDebounced(); }
function onDecorThemeChange() { extension_settings[extensionName].selectedDecorTheme = parseInt($("#ecc_decor_theme").val(), 10); saveSettingsDebounced(); }

function onBgModeChange() {
    extension_settings[extensionName].bgMode = $("input[name='ecc_bg_mode']:checked").val();
    saveSettingsDebounced();
    updateBgModeUI();
}

function onTitleToggle(e) {
    extension_settings[extensionName].titleEnabled = Boolean($(e.target).prop("checked"));
    saveSettingsDebounced();
    applyTitleBar();
}

function onTitleInput() {
    const val = $("#ecc_title_input").val();
    extension_settings[extensionName].titleText = val;
    saveSettingsDebounced();
    // Update live
    $("#ecc_title_bar .ecc-title-text").text(val || "Your Story Title");
    positionAll();
}

// Validate API settings, return false if not ready
function validateApiSettings(statusTarget) {
    const s = extension_settings[extensionName];
    if (!s.apiKey)   { setStatus("❌ Please enter your Chutes API key!", "error", statusTarget); return false; }
    if (!s.chuteUrl) { setStatus("❌ Please enter the Chute endpoint URL!", "error", statusTarget); return false; }
    if (!s.chuteUrl.startsWith("https://")) { setStatus("❌ URL must start with https://", "error", statusTarget); return false; }
    if (s.bgMode === "removebg" && !s.removebgKey) { setStatus("❌ Please enter your remove.bg API key!", "error", statusTarget); return false; }
    return true;
}

async function onGenerateCatsClick() {
    if (!validateApiSettings("#ecc_cat_status")) return;
    const s = extension_settings[extensionName];
    const { left: pl, right: pr, label } = getCatPrompts();
    $("#ecc_gen_cats_btn").prop("disabled", true).val("⏳ Generating...");
    $("#ecc_cat_preview").hide();
    try {
        setStatus(`🎨 [${label}] Cat 1/2... 🐱`, "loading", "#ecc_cat_status");
        let leftUrl  = await generateImage(s.apiKey, s.chuteUrl, pl);
        setStatus(`🎨 [${label}] Cat 2/2... almost! 🐱`, "loading", "#ecc_cat_status");
        let rightUrl = await generateImage(s.apiKey, s.chuteUrl, pr);
        if (s.bgMode === "removebg") {
            setStatus("✂️ Removing bg (1/2)...", "loading", "#ecc_cat_status");
            leftUrl  = await removeBackground(leftUrl,  s.removebgKey);
            setStatus("✂️ Removing bg (2/2)...", "loading", "#ecc_cat_status");
            rightUrl = await removeBackground(rightUrl, s.removebgKey);
        }
        extension_settings[extensionName].catImageLeft  = leftUrl;
        extension_settings[extensionName].catImageRight = rightUrl;
        saveSettingsDebounced();
        $("#ecc_preview_cat_l").attr("src", leftUrl);
        $("#ecc_preview_cat_r").attr("src", rightUrl);
        $("#ecc_cat_preview").show();
        setStatus("✅ Cats ready! Click Apply below.", "success", "#ecc_cat_status");
    } catch (err) {
        setStatus(`❌ ${err.message}`, "error", "#ecc_cat_status");
    } finally {
        $("#ecc_gen_cats_btn").prop("disabled", false).val("🐱 Generate Cats");
    }
}

async function onGenerateDecorClick() {
    if (!validateApiSettings("#ecc_decor_status")) return;
    const s = extension_settings[extensionName];
    const { prompt, label } = getDecorPrompts();
    $("#ecc_gen_decor_btn").prop("disabled", true).val("⏳ Generating...");
    $("#ecc_decor_preview").hide();
    try {
        setStatus(`🌿 [${label}] Generating corner decoration... ✨`, "loading", "#ecc_decor_status");
        let decorUrl = await generateImage(s.apiKey, s.chuteUrl, prompt);
        if (s.bgMode === "removebg") {
            setStatus("✂️ Removing background...", "loading", "#ecc_decor_status");
            decorUrl = await removeBackground(decorUrl, s.removebgKey);
        }
        extension_settings[extensionName].decorImageLeft = decorUrl;
        saveSettingsDebounced();
        $("#ecc_preview_decor").attr("src", decorUrl);
        $("#ecc_decor_preview").show();
        setStatus("✅ Decoration ready! Click Apply below.", "success", "#ecc_decor_status");
    } catch (err) {
        setStatus(`❌ ${err.message}`, "error", "#ecc_decor_status");
    } finally {
        $("#ecc_gen_decor_btn").prop("disabled", false).val("🌿 Generate Corner Decoration");
    }
}

function onApplyCatsClick()  { applyDecorations(); setStatus("✅ Applied! Cats are sitting on top of your chat. 🐾", "success", "#ecc_cat_status"); }
function onApplyDecorClick() { applyDecorations(); setStatus("✅ Applied! Corner decorations in place. ✨", "success", "#ecc_decor_status"); }

// ─── Load Settings ─────────────────────────────────────────────────────────────
function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }
    const s = extension_settings[extensionName];
    $("#ecc_enabled").prop("checked",      s.enabled);
    $("#ecc_api_key").val(                 s.apiKey || "");
    $("#ecc_chute_url").val(               s.chuteUrl || "");
    $("#ecc_removebg_key").val(            s.removebgKey || "");
    $("#ecc_title_enabled").prop("checked",s.titleEnabled);
    $("#ecc_title_input").val(             s.titleText || "");
    $(`input[name='ecc_bg_mode'][value='${s.bgMode ?? "black"}']`).prop("checked", true);
    updateBgModeUI();
    populateDropdowns();
    if (s.catImageLeft) {
        $("#ecc_preview_cat_l").attr("src", s.catImageLeft);
        $("#ecc_preview_cat_r").attr("src", s.catImageRight || s.catImageLeft);
        $("#ecc_cat_preview").show();
    }
    if (s.decorImageLeft) {
        $("#ecc_preview_decor").attr("src", s.decorImageLeft);
        $("#ecc_decor_preview").show();
    }
    if (s.enabled) { applyDecorations(); applyTitleBar(); }
}

// ─── Init ──────────────────────────────────────────────────────────────────────
jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);
    try {
        const html = await $.get(`${extensionFolderPath}/example.html`);
        $("#extensions_settings2").append(html);

        $("#ecc_enabled").on("input",       onToggleChange);
        $("#ecc_api_key").on("change",      onApiKeyChange);
        $("#ecc_chute_url").on("change",    onChuteUrlChange);
        $("#ecc_removebg_key").on("change", onRemoveBgKeyChange);
        $("input[name='ecc_bg_mode']").on("change", onBgModeChange);
        $("#ecc_cat_theme").on("change",    onCatThemeChange);
        $("#ecc_decor_theme").on("change",  onDecorThemeChange);
        $("#ecc_gen_cats_btn").on("click",  onGenerateCatsClick);
        $("#ecc_gen_decor_btn").on("click", onGenerateDecorClick);
        $("#ecc_apply_cats_btn").on("click",  onApplyCatsClick);
        $("#ecc_apply_decor_btn").on("click", onApplyDecorClick);
        $("#ecc_title_enabled").on("input", onTitleToggle);
        $("#ecc_title_input").on("input",   onTitleInput);

        loadSettings();
        console.log(`[${extensionName}] ✅ Loaded`);
    } catch (err) {
        console.error(`[${extensionName}] ❌`, err);
    }
});
