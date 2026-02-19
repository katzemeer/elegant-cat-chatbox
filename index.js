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
    selectedCatTheme: 0,
    bgMode: "black",
    removebgKey: "",
    titleText: "",
    titleEnabled: true,
    titleFont: "Cinzel Decorative",
    titleSize: 22,
    borderStyle: "baroque"
};

// ─── Font Library ──────────────────────────────────────────────────────────────
// Grouped by vibe. All from Google Fonts.
const FONT_GROUPS = [
    {
        group: "✨ Fantasy & Engraved",
        fonts: [
            { label: "Cinzel Decorative",    value: "Cinzel Decorative",    import: "Cinzel+Decorative:wght@400;700" },
            { label: "Cinzel",               value: "Cinzel",               import: "Cinzel:wght@400;600;700" },
            { label: "Metamorphous",         value: "Metamorphous",         import: "Metamorphous" },
            { label: "Almendra",             value: "Almendra",             import: "Almendra:wght@400;700" },
            { label: "Almendra Display",     value: "Almendra Display",     import: "Almendra+Display" },
            { label: "MedievalSharp",        value: "MedievalSharp",        import: "MedievalSharp" },
            { label: "Philosopher",          value: "Philosopher",          import: "Philosopher:wght@400;700" },
        ]
    },
    {
        group: "🖋️ Calligraphy & Script",
        fonts: [
            { label: "Great Vibes",          value: "Great Vibes",          import: "Great+Vibes" },
            { label: "Pinyon Script",        value: "Pinyon Script",        import: "Pinyon+Script" },
            { label: "Alex Brush",           value: "Alex Brush",           import: "Alex+Brush" },
            { label: "Ruthie",               value: "Ruthie",               import: "Ruthie" },
            { label: "Italianno",            value: "Italianno",            import: "Italianno" },
            { label: "Tangerine",            value: "Tangerine",            import: "Tangerine:wght@400;700" },
            { label: "Dancing Script",       value: "Dancing Script",       import: "Dancing+Script:wght@400;700" },
            { label: "Pacifico",             value: "Pacifico",             import: "Pacifico" },
        ]
    },
    {
        group: "📜 Elegant Serif",
        fonts: [
            { label: "Cormorant Garamond",   value: "Cormorant Garamond",   import: "Cormorant+Garamond:wght@400;600;700" },
            { label: "Cormorant Unicase",    value: "Cormorant Unicase",    import: "Cormorant+Unicase:wght@400;700" },
            { label: "Playfair Display",     value: "Playfair Display",     import: "Playfair+Display:wght@400;700" },
            { label: "IM Fell English",      value: "IM Fell English",      import: "IM+Fell+English:ital@0;1" },
            { label: "Libre Baskerville",    value: "Libre Baskerville",    import: "Libre+Baskerville:wght@400;700" },
            { label: "Crimson Text",         value: "Crimson Text",         import: "Crimson+Text:wght@400;600;700" },
            { label: "Spectral",             value: "Spectral",             import: "Spectral:wght@400;700" },
        ]
    },
    {
        group: "🏰 Gothic & Blackletter",
        fonts: [
            { label: "UnifrakturMaguntia",   value: "UnifrakturMaguntia",   import: "UnifrakturMaguntia" },
            { label: "Germania One",         value: "Germania One",         import: "Germania+One" },
            { label: "Uncial Antiqua",       value: "Uncial Antiqua",       import: "Uncial+Antiqua" },
        ]
    },
    {
        group: "🌙 Mystical & Unique",
        fonts: [
            { label: "Fondamento",           value: "Fondamento",           import: "Fondamento" },
            { label: "Caesar Dressing",      value: "Caesar Dressing",      import: "Caesar+Dressing" },
            { label: "Cardo",                value: "Cardo",                import: "Cardo:wght@400;700" },
            { label: "Martel",               value: "Martel",               import: "Martel:wght@400;700" },
            { label: "Lora",                 value: "Lora",                 import: "Lora:ital,wght@1,700" },
        ]
    }
];

// Flat list for lookup
const ALL_FONTS = FONT_GROUPS.flatMap(g => g.fonts);

// Track which fonts have been injected
const loadedFonts = new Set();

function loadFont(fontValue) {
    if (loadedFonts.has(fontValue)) return;
    const def = ALL_FONTS.find(f => f.value === fontValue);
    if (!def) return;
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${def.import}&display=swap`;
    document.head.appendChild(link);
    loadedFonts.add(fontValue);
}

// ─── Border style definitions ──────────────────────────────────────────────────
const BORDER_STYLES = {
    botanical: {
        label: "🌿 Botanical Vine",
        render: () => `<div class="ecc-border-botanical"></div>`
    },
    baroque: {
        label: "🌀 Baroque Scrollwork",
        render: () => `<div class="ecc-border-baroque"><span class="ecc-border-center-ornament">❦</span></div>`
    },
    stars: {
        label: "✨ Stars & Dots",
        render: () => `<div class="ecc-border-stars"><span class="ecc-border-center-ornament">✦</span></div>`
    },
    elegant: {
        label: "⸻ Double Line",
        render: () => `<div class="ecc-border-elegant"><span class="ecc-border-center-ornament">◆</span></div>`
    },
    floral: {
        label: "🌸 Floral Chain",
        render: () => `<div class="ecc-border-floral"></div>`
    },
    gothic: {
        label: "⚜️ Gothic Filigree",
        render: () => `<div class="ecc-border-gothic"><span class="ecc-border-center-ornament">⚜</span></div>`
    }
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

function getCatPrompts() {
    let idx = extension_settings[extensionName].selectedCatTheme ?? 0;
    const suffix = (extension_settings[extensionName].bgMode ?? "black") === "black" ? "_black" : "_white";
    if (idx <= 0) {
        idx = Math.floor(Math.random() * (CAT_THEMES.length - 1)) + 1;
    }
    return { left: CAT_THEMES[idx][`left${suffix}`], right: CAT_THEMES[idx][`right${suffix}`], label: CAT_THEMES[idx].label };
}

// ─── Status helper ─────────────────────────────────────────────────────────────
function setStatus(msg, type = "loading") {
    $("#ecc_status").text(msg).attr("class", `ecc-status ${type}`).show();
}

// ─── Generate / remove.bg ──────────────────────────────────────────────────────
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
const CAT_SIZE = 115;
const BORDER_H = 22;

function positionAll() {
    const chat = document.getElementById("chat");
    if (!chat) return;
    const r = chat.getBoundingClientRect();
    const s = extension_settings[extensionName];

    const titleSize = s.titleSize ?? 22;
    // Title height scales with font size — bigger font needs more room
    const TITLE_H = Math.max(44, titleSize * 2.2);

    // Cats: bottom edge at chat top
    const catTop = r.top - CAT_SIZE;
    $("#ecc_cat_left").css({ left: r.left + "px", top: catTop + "px", width: CAT_SIZE + "px", height: CAT_SIZE + "px" });
    $("#ecc_cat_right").css({ left: (r.right - CAT_SIZE) + "px", top: catTop + "px", width: CAT_SIZE + "px", height: CAT_SIZE + "px" });

    // Border: sits on top edge of chat, between cats
    const innerLeft  = r.left + CAT_SIZE;
    const innerWidth = r.width - CAT_SIZE * 2;
    $("#ecc_top_border").css({ left: innerLeft + "px", top: (r.top + 2) + "px", width: innerWidth + "px", height: BORDER_H + "px" });

    // Title: above the cats
    const titleTop = r.top - CAT_SIZE - TITLE_H;
    $("#ecc_title_bar").css({ left: r.left + "px", top: titleTop + "px", width: r.width + "px", height: TITLE_H + "px" });
}

// ─── Apply / Remove ────────────────────────────────────────────────────────────
function applyAll() {
    const s = extension_settings[extensionName];
    if (!s.catImageLeft) { setStatus("⚠️ No cats yet — generate some first!", "error"); return; }
    removeAll();

    const blend = s.bgMode === "black" ? "ecc-blend-screen" : "";

    $("body").append(`
        <img class="ecc-overlay ecc-cat ${blend}" id="ecc_cat_left"  src="${s.catImageLeft}" alt="cat left"/>
        <img class="ecc-overlay ecc-cat ecc-flip ${blend}" id="ecc_cat_right" src="${s.catImageRight || s.catImageLeft}" alt="cat right"/>
    `);

    const borderDef = BORDER_STYLES[s.borderStyle ?? "baroque"] ?? BORDER_STYLES.baroque;
    $("body").append(`<div class="ecc-overlay ecc-top-border" id="ecc_top_border">${borderDef.render()}</div>`);

    if (s.titleEnabled) {
        const font    = s.titleFont ?? "Cinzel Decorative";
        const size    = s.titleSize ?? 22;
        loadFont(font);
        $("body").append(`
            <div id="ecc_title_bar" class="ecc-overlay ecc-title-bar">
                <div class="ecc-title-inner">
                    <span class="ecc-title-deco">— ✦ —</span>
                    <span class="ecc-title-text" style="font-family:'${font}',serif; font-size:${size}px;">${s.titleText || "Your Story"}</span>
                    <span class="ecc-title-deco">— ✦ —</span>
                </div>
            </div>
        `);
    }

    positionAll();
    $(window).on("resize.ecc scroll.ecc", positionAll);
}

function removeAll() {
    $("#ecc_cat_left, #ecc_cat_right, #ecc_top_border, #ecc_title_bar").remove();
    $(window).off("resize.ecc scroll.ecc");
}

// ─── Live title update (no full re-render needed) ──────────────────────────────
function updateTitleElement() {
    const s    = extension_settings[extensionName];
    const font = s.titleFont ?? "Cinzel Decorative";
    const size = s.titleSize ?? 22;
    loadFont(font);
    $("#ecc_title_bar .ecc-title-text")
        .text(s.titleText || "Your Story")
        .css({ "font-family": `'${font}', serif`, "font-size": size + "px" });
    positionAll(); // recalc height since size may have changed
}

// ─── UI helpers ───────────────────────────────────────────────────────────────
function updateBgModeUI() {
    const mode = extension_settings[extensionName].bgMode ?? "black";
    $("#ecc_removebg_row").toggle(mode === "removebg");
    $("#ecc_bg_hint").text(mode === "removebg"
        ? "remove.bg: real PNG transparency — crisp on any background."
        : "Black bg + screen blend: best for dark UIs.");
}

function populateCatDropdown() {
    const $sel = $("#ecc_cat_theme");
    $sel.empty();
    CAT_THEMES.forEach((t, i) => $sel.append(`<option value="${i}">${t.label}</option>`));
    $sel.val(Math.max(0, extension_settings[extensionName].selectedCatTheme ?? 0));
}

function populateBorderDropdown() {
    const $sel = $("#ecc_border_style");
    $sel.empty();
    Object.entries(BORDER_STYLES).forEach(([key, val]) => $sel.append(`<option value="${key}">${val.label}</option>`));
    $sel.val(extension_settings[extensionName].borderStyle ?? "baroque");
}

function populateFontDropdown() {
    const $sel = $("#ecc_title_font");
    $sel.empty();
    FONT_GROUPS.forEach(group => {
        const $grp = $(`<optgroup label="${group.group}"></optgroup>`);
        group.fonts.forEach(f => $grp.append(`<option value="${f.value}">${f.label}</option>`));
        $sel.append($grp);
    });
    $sel.val(extension_settings[extensionName].titleFont ?? "Cinzel Decorative");
}

function updateSizeLabel() {
    const size = extension_settings[extensionName].titleSize ?? 22;
    $("#ecc_size_label").text(size + "px");
}

// ─── Event Handlers ────────────────────────────────────────────────────────────
function onToggleChange(e) {
    const v = Boolean($(e.target).prop("checked"));
    extension_settings[extensionName].enabled = v;
    saveSettingsDebounced();
    v ? applyAll() : removeAll();
}

function onApiKeyChange()      { extension_settings[extensionName].apiKey      = $("#ecc_api_key").val().trim();      saveSettingsDebounced(); }
function onChuteUrlChange()    { extension_settings[extensionName].chuteUrl    = $("#ecc_chute_url").val().trim();    saveSettingsDebounced(); }
function onRemoveBgKeyChange() { extension_settings[extensionName].removebgKey = $("#ecc_removebg_key").val().trim(); saveSettingsDebounced(); }
function onCatThemeChange()    { extension_settings[extensionName].selectedCatTheme = parseInt($("#ecc_cat_theme").val(), 10); saveSettingsDebounced(); }

function onBgModeChange() {
    extension_settings[extensionName].bgMode = $("input[name='ecc_bg_mode']:checked").val();
    saveSettingsDebounced(); updateBgModeUI();
}

function onBorderStyleChange() {
    extension_settings[extensionName].borderStyle = $("#ecc_border_style").val();
    saveSettingsDebounced();
    if (extension_settings[extensionName].enabled) applyAll();
}

function onTitleToggle(e) {
    extension_settings[extensionName].titleEnabled = Boolean($(e.target).prop("checked"));
    saveSettingsDebounced();
    if (extension_settings[extensionName].enabled) applyAll();
}

function onTitleInput() {
    extension_settings[extensionName].titleText = $("#ecc_title_input").val();
    saveSettingsDebounced();
    updateTitleElement();
}

function onFontChange() {
    extension_settings[extensionName].titleFont = $("#ecc_title_font").val();
    saveSettingsDebounced();
    // Load font and update preview label
    loadFont(extension_settings[extensionName].titleFont);
    updateFontPreview();
    updateTitleElement();
}

function onSizeChange() {
    const size = parseInt($("#ecc_title_size").val(), 10);
    extension_settings[extensionName].titleSize = size;
    saveSettingsDebounced();
    updateSizeLabel();
    updateTitleElement();
}

function updateFontPreview() {
    const font = extension_settings[extensionName].titleFont ?? "Cinzel Decorative";
    const size = extension_settings[extensionName].titleSize ?? 22;
    loadFont(font);
    $("#ecc_font_preview").css({ "font-family": `'${font}', serif`, "font-size": Math.min(size, 28) + "px" })
                          .text(extension_settings[extensionName].titleText || "Your Story");
}

async function onGenerateCatsClick() {
    const s = extension_settings[extensionName];
    if (!s.apiKey)   { setStatus("❌ Please enter your Chutes API key!", "error"); return; }
    if (!s.chuteUrl) { setStatus("❌ Please enter the Chute endpoint URL!", "error"); return; }
    if (!s.chuteUrl.startsWith("https://")) { setStatus("❌ URL must start with https://", "error"); return; }
    if (s.bgMode === "removebg" && !s.removebgKey) { setStatus("❌ Please enter your remove.bg API key!", "error"); return; }

    const { left: pl, right: pr, label } = getCatPrompts();
    $("#ecc_gen_cats_btn").prop("disabled", true).val("⏳ Generating...");
    $("#ecc_cat_preview").hide();
    try {
        setStatus(`🎨 [${label}] Cat 1/2... 🐱`, "loading");
        let leftUrl  = await generateImage(s.apiKey, s.chuteUrl, pl);
        setStatus(`🎨 [${label}] Cat 2/2... almost! 🐱`, "loading");
        let rightUrl = await generateImage(s.apiKey, s.chuteUrl, pr);
        if (s.bgMode === "removebg") {
            setStatus("✂️ Removing bg (1/2)...", "loading");
            leftUrl  = await removeBackground(leftUrl, s.removebgKey);
            setStatus("✂️ Removing bg (2/2)...", "loading");
            rightUrl = await removeBackground(rightUrl, s.removebgKey);
        }
        extension_settings[extensionName].catImageLeft  = leftUrl;
        extension_settings[extensionName].catImageRight = rightUrl;
        saveSettingsDebounced();
        $("#ecc_preview_cat_l").attr("src", leftUrl);
        $("#ecc_preview_cat_r").attr("src", rightUrl);
        $("#ecc_cat_preview").show();
        setStatus("✅ Cats ready! Click Apply.", "success");
    } catch (err) {
        setStatus(`❌ ${err.message}`, "error");
    } finally {
        $("#ecc_gen_cats_btn").prop("disabled", false).val("🐱 Generate Cats");
    }
}

function onApplyClick() {
    applyAll();
    setStatus("✅ All decorations applied! 🐾", "success");
}

// ─── Load Settings ─────────────────────────────────────────────────────────────
function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }
    const s = extension_settings[extensionName];
    $("#ecc_enabled").prop("checked",        s.enabled);
    $("#ecc_api_key").val(                   s.apiKey || "");
    $("#ecc_chute_url").val(                 s.chuteUrl || "");
    $("#ecc_removebg_key").val(              s.removebgKey || "");
    $("#ecc_title_enabled").prop("checked",  s.titleEnabled ?? true);
    $("#ecc_title_input").val(               s.titleText || "");
    $("#ecc_title_size").val(                s.titleSize ?? 22);
    $(`input[name='ecc_bg_mode'][value='${s.bgMode ?? "black"}']`).prop("checked", true);

    updateBgModeUI();
    populateCatDropdown();
    populateBorderDropdown();
    populateFontDropdown();
    updateSizeLabel();

    if (s.catImageLeft) {
        $("#ecc_preview_cat_l").attr("src", s.catImageLeft);
        $("#ecc_preview_cat_r").attr("src", s.catImageRight || s.catImageLeft);
        $("#ecc_cat_preview").show();
    }

    // Preload the saved font
    loadFont(s.titleFont ?? "Cinzel Decorative");
    updateFontPreview();

    if (s.enabled) applyAll();
}

// ─── Init ──────────────────────────────────────────────────────────────────────
jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);
    try {
        const html = await $.get(`${extensionFolderPath}/example.html`);
        $("#extensions_settings2").append(html);

        $("#ecc_enabled").on("input",        onToggleChange);
        $("#ecc_api_key").on("change",       onApiKeyChange);
        $("#ecc_chute_url").on("change",     onChuteUrlChange);
        $("#ecc_removebg_key").on("change",  onRemoveBgKeyChange);
        $("input[name='ecc_bg_mode']").on("change", onBgModeChange);
        $("#ecc_cat_theme").on("change",     onCatThemeChange);
        $("#ecc_border_style").on("change",  onBorderStyleChange);
        $("#ecc_gen_cats_btn").on("click",   onGenerateCatsClick);
        $("#ecc_apply_btn").on("click",      onApplyClick);
        $("#ecc_title_enabled").on("input",  onTitleToggle);
        $("#ecc_title_input").on("input",    onTitleInput);
        $("#ecc_title_font").on("change",    onFontChange);
        $("#ecc_title_size").on("input",     onSizeChange);

        loadSettings();
        console.log(`[${extensionName}] ✅ Loaded`);
    } catch (err) {
        console.error(`[${extensionName}] ❌`, err);
    }
});
