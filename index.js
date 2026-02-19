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
    selectedPromptIndex: 0,
    bgMode: "black",   // "black" = black bg + screen blend | "removebg" = remove.bg API
    removebgKey: ""
};

// ─── Prompt Library ────────────────────────────────────────────────────────────
const PROMPT_THEMES = [
    { label: "🎲 Random (different every time!)", left_black: null, right_black: null, left_white: null, right_white: null },
    {
        label: "🌸 Botanical Garden",
        left_black:  "a small fluffy chibi cat nestled among delicate wildflowers, soft watercolor illustration style, pastel pink and green colors, pure solid black background, no text, no watermark",
        right_black: "a small fluffy chibi cat peeking through botanical sprigs and blossoms, soft watercolor style, warm pastel tones, pure solid black background, no text, no watermark",
        left_white:  "a small fluffy chibi cat nestled among delicate wildflowers, soft watercolor illustration style, pastel pink and green colors, pure solid white background, no text, no watermark",
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
        right_black: "a mystical chibi cat with a star wand and swirling magical particles, fantasy style, rose gold and lavender palette, pure solid black background, whimsical feel, no text, no watermark",
        left_white:  "a magical glowing chibi cat with tiny stars and sparkles floating around it, fantasy art style, soft purple and gold tones, pure solid white background, crescent moon nearby, no text, no watermark",
        right_white: "a mystical chibi cat with a star wand and swirling magical particles, fantasy style, rose gold and lavender palette, pure solid white background, whimsical feel, no text, no watermark"
    },
    {
        label: "😴 Sleepy Loaf",
        left_black:  "a perfectly loaf-shaped sleeping chibi cat with closed eyes and rosy cheeks, adorable illustration, soft neutral tones, pure solid black background, zzz bubbles above, ultra fluffy, no text, no watermark",
        right_black: "a round sleepy chibi cat mid-yawn with tiny paws tucked in, cute style, pastel cream and grey, pure solid black background, small pillow nearby, no text, no watermark",
        left_white:  "a perfectly loaf-shaped sleeping chibi cat with closed eyes and rosy cheeks, adorable illustration, soft neutral tones, pure solid white background, zzz bubbles above, ultra fluffy, no text, no watermark",
        right_white: "a round sleepy chibi cat mid-yawn with tiny paws tucked in, cute style, pastel cream and grey, pure solid white background, small pillow nearby, no text, no watermark"
    },
    {
        label: "🌙 Midnight Dreamer",
        left_black:  "a dark fluffy chibi cat glowing softly at the edges, dreamy illustration, deep blue and silver palette, pure solid black background, moon and tiny stars around it, no text, no watermark",
        right_black: "a chibi cat gazing up at floating lanterns and paper stars, nocturnal soft illustration, navy and gold tones, pure solid black background, dreamy night feel, no text, no watermark",
        left_white:  "a dark fluffy chibi cat glowing softly at the edges, dreamy illustration, deep blue and silver palette, pure solid white background, moon and tiny stars around it, no text, no watermark",
        right_white: "a chibi cat gazing up at floating lanterns and paper stars, nocturnal soft illustration, navy and gold tones, pure solid white background, dreamy night feel, no text, no watermark"
    },
    {
        label: "🍓 Cottagecore",
        left_black:  "a chubby chibi cat wearing a tiny flower crown sitting in dewy grass, cottagecore illustrated style, strawberry red and sage green, pure solid black background, mushroom nearby, no text, no watermark",
        right_black: "a fluffy chibi cat in a woven basket surrounded by berries and daisies, cottagecore illustration, warm earthy pastels, pure solid black background, butterfly nearby, no text, no watermark",
        left_white:  "a chubby chibi cat wearing a tiny flower crown sitting in dewy grass, cottagecore illustrated style, strawberry red and sage green, pure solid white background, mushroom nearby, no text, no watermark",
        right_white: "a fluffy chibi cat in a woven basket surrounded by berries and daisies, cottagecore illustration, warm earthy pastels, pure solid white background, butterfly nearby, no text, no watermark"
    },
    {
        label: "🎀 Fancy & Elegant",
        left_black:  "a sophisticated chibi cat wearing a tiny bow tie and top hat, elegant illustration, black and gold palette, pure solid black background, ornate swirls, dignified yet cute, no text, no watermark",
        right_black: "a regal fluffy chibi cat draped in tiny ribbons and pearls, elegant soft illustration, rose gold and ivory tones, pure solid black background, small crown, no text, no watermark",
        left_white:  "a sophisticated chibi cat wearing a tiny bow tie and top hat, elegant illustration, cream and gold palette, pure solid white background, ornate swirls, dignified yet cute, no text, no watermark",
        right_white: "a regal fluffy chibi cat draped in tiny ribbons and pearls, elegant soft illustration, rose gold and ivory tones, pure solid white background, small crown, no text, no watermark"
    },
    {
        label: "🌊 Ocean Breeze",
        left_black:  "a fluffy chibi cat wearing a sailor collar sitting on sea foam, watercolor illustration, ocean blue and seafoam green, pure solid black background, shells and bubbles around it, no text, no watermark",
        right_black: "a chibi cat with a tiny starfish hat surrounded by sea bubbles, watercolor style, aquamarine and pearl tones, pure solid black background, playful feel, no text, no watermark",
        left_white:  "a fluffy chibi cat wearing a sailor collar sitting on sea foam, watercolor illustration, ocean blue and seafoam green, pure solid white background, shells and bubbles around it, no text, no watermark",
        right_white: "a chibi cat with a tiny starfish hat surrounded by sea bubbles, watercolor style, aquamarine and pearl tones, pure solid white background, playful feel, no text, no watermark"
    },
    {
        label: "🍂 Autumn Vibes",
        left_black:  "a cozy chibi cat wrapped in a tiny knitted scarf among falling autumn leaves, soft illustrated style, burnt orange and golden yellow, pure solid black background, acorn nearby, no text, no watermark",
        right_black: "a fluffy chibi cat peeking out of a pile of colorful fallen leaves, illustration, warm russet and amber tones, pure solid black background, playful mood, no text, no watermark",
        left_white:  "a cozy chibi cat wrapped in a tiny knitted scarf among falling autumn leaves, soft illustrated style, burnt orange and golden yellow, pure solid white background, acorn nearby, no text, no watermark",
        right_white: "a fluffy chibi cat peeking out of a pile of colorful fallen leaves, illustration, warm russet and amber tones, pure solid white background, playful mood, no text, no watermark"
    },
    {
        label: "🎪 Silly & Dramatic",
        left_black:  "a chibi cat with a hilariously shocked expression, tiny lightning bolts around head, expressive comic style, bright colors, pure solid black background, very dramatic pose, no text, no watermark",
        right_black: "a chibi cat in a tiny superhero cape striking a heroic pose, bold comic illustration, vibrant primary colors, pure solid black background, action lines and stars, no text, no watermark",
        left_white:  "a chibi cat with a hilariously shocked expression, tiny lightning bolts around head, expressive comic style, bright colors, pure solid white background, very dramatic pose, no text, no watermark",
        right_white: "a chibi cat in a tiny superhero cape striking a heroic pose, bold comic illustration, vibrant primary colors, pure solid white background, action lines and stars, no text, no watermark"
    }
];

// ─── Get prompts ───────────────────────────────────────────────────────────────
function getSelectedPrompts() {
    let idx = extension_settings[extensionName].selectedPromptIndex ?? 0;
    const bgMode = extension_settings[extensionName].bgMode ?? "black";
    const suffix = bgMode === "black" ? "_black" : "_white";

    if (idx <= 0) {
        idx = Math.floor(Math.random() * (PROMPT_THEMES.length - 1)) + 1;
        console.log(`[${extensionName}] 🎲 Random: "${PROMPT_THEMES[idx].label}"`);
    }

    return {
        left:  PROMPT_THEMES[idx][`left${suffix}`],
        right: PROMPT_THEMES[idx][`right${suffix}`],
        label: PROMPT_THEMES[idx].label
    };
}

// ─── Status helper ─────────────────────────────────────────────────────────────
function setStatus(msg, type = "loading") {
    $("#ecc_status").text(msg).attr("class", `ecc-status ${type}`).show();
}

// ─── Generate one image ────────────────────────────────────────────────────────
async function generateImage(apiKey, chuteUrl, prompt) {
    const res = await fetch(chuteUrl, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt })
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`API error ${res.status}: ${err}`);
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("image/")) {
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload  = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("Failed to read image"));
            reader.readAsDataURL(blob);
        });
    }

    const data = await res.json();
    if (data.images?.length > 0)  return `data:image/png;base64,${data.images[0]}`;
    if (data.data?.[0]?.b64_json) return `data:image/png;base64,${data.data[0].b64_json}`;
    if (data.data?.[0]?.url)      return data.data[0].url;
    throw new Error("Unrecognised response format — try a different model!");
}

// ─── remove.bg API ─────────────────────────────────────────────────────────────
async function removeBackground(imageDataUrl, removebgApiKey) {
    const response = await fetch(imageDataUrl);
    const blob     = await response.blob();

    const formData = new FormData();
    formData.append("image_file", blob, "cat.png");
    formData.append("size", "auto");

    const res = await fetch("https://api.remove.bg/v1.0/removebg", {
        method:  "POST",
        headers: { "X-Api-Key": removebgApiKey },
        body:    formData
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`remove.bg error ${res.status}: ${err}`);
    }

    const resultBlob = await res.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Failed to read remove.bg result"));
        reader.readAsDataURL(resultBlob);
    });
}

// ─── Positioning ───────────────────────────────────────────────────────────────
// Reads the #chat element's position and places cats just outside its left/right
// edges, flush with the bottom of the chat container.
function positionCats() {
    const chat = document.getElementById("chat");
    if (!chat) return;

    const rect = chat.getBoundingClientRect();
    const size = 140;

    // Left cat: flush with the left edge of #chat, bottom-aligned
    $("#ecc_cat_left").css({
        left: Math.max(0, rect.left - size) + "px",
        top:  Math.max(0, rect.bottom - size) + "px"
    });

    // Right cat: flush with the right edge of #chat, bottom-aligned
    $("#ecc_cat_right").css({
        left: rect.right + "px",
        top:  Math.max(0, rect.bottom - size) + "px"
    });
}

// ─── Decorations ───────────────────────────────────────────────────────────────
function applyDecorations() {
    const s = extension_settings[extensionName];
    if (!s.catImageLeft) {
        setStatus("⚠️ No cats yet — generate some first!", "error");
        return;
    }

    removeDecorations();

    const blendClass = s.bgMode === "black" ? "ecc-blend-screen" : "";

    $("body").append(`
        <img class="ecc-cat-img ${blendClass}" id="ecc_cat_left"
             src="${s.catImageLeft}" alt="cat left"/>
        <img class="ecc-cat-img ecc-cat-flip ${blendClass}" id="ecc_cat_right"
             src="${s.catImageRight || s.catImageLeft}" alt="cat right"/>
    `);

    positionCats();
    $(window).on("resize.ecc scroll.ecc", positionCats);
    console.log(`[${extensionName}] ✅ Cats applied beside chat!`);
}

function removeDecorations() {
    $("#ecc_cat_left, #ecc_cat_right").remove();
    $(window).off("resize.ecc scroll.ecc");
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────
function updateBgModeUI() {
    const mode = extension_settings[extensionName].bgMode ?? "black";
    if (mode === "removebg") {
        $("#ecc_removebg_row").show();
        $("#ecc_bg_hint").text("remove.bg gives real PNG transparency — crisp on ANY background color.");
    } else {
        $("#ecc_removebg_row").hide();
        $("#ecc_bg_hint").text("Black bg + screen blend: black pixels vanish. Works great on dark UIs!");
    }
}

function populatePromptDropdown() {
    const $select = $("#ecc_prompt_select");
    $select.empty();
    PROMPT_THEMES.forEach((theme, i) => {
        $select.append(`<option value="${i}">${theme.label}</option>`);
    });
    const saved = extension_settings[extensionName].selectedPromptIndex ?? 0;
    $select.val(saved < 0 ? 0 : saved);
}

// ─── Event Handlers ────────────────────────────────────────────────────────────
function onToggleChange(e) {
    const value = Boolean($(e.target).prop("checked"));
    extension_settings[extensionName].enabled = value;
    saveSettingsDebounced();
    value ? applyDecorations() : removeDecorations();
}

function onApiKeyChange() {
    extension_settings[extensionName].apiKey = $("#ecc_api_key").val().trim();
    saveSettingsDebounced();
}

function onChuteUrlChange() {
    extension_settings[extensionName].chuteUrl = $("#ecc_chute_url").val().trim();
    saveSettingsDebounced();
}

function onPromptSelectChange() {
    extension_settings[extensionName].selectedPromptIndex = parseInt($("#ecc_prompt_select").val(), 10);
    saveSettingsDebounced();
}

function onBgModeChange() {
    extension_settings[extensionName].bgMode = $("input[name='ecc_bg_mode']:checked").val();
    saveSettingsDebounced();
    updateBgModeUI();
}

function onRemoveBgKeyChange() {
    extension_settings[extensionName].removebgKey = $("#ecc_removebg_key").val().trim();
    saveSettingsDebounced();
}

async function onGenerateClick() {
    const s = extension_settings[extensionName];
    if (!s.apiKey)   { setStatus("❌ Please enter your Chutes API key!", "error"); return; }
    if (!s.chuteUrl) { setStatus("❌ Please enter the Chute endpoint URL!", "error"); return; }
    if (!s.chuteUrl.startsWith("https://")) { setStatus("❌ URL must start with https://", "error"); return; }
    if (s.bgMode === "removebg" && !s.removebgKey) {
        setStatus("❌ Please enter your remove.bg API key!", "error"); return;
    }

    const { left: promptLeft, right: promptRight, label: themeName } = getSelectedPrompts();
    $("#ecc_generate_btn").prop("disabled", true).val("⏳ Generating...");
    $("#ecc_preview").hide();

    try {
        setStatus(`🎨 [${themeName}] Generating cat 1/2... 🐱`, "loading");
        let leftUrl  = await generateImage(s.apiKey, s.chuteUrl, promptLeft);

        setStatus(`🎨 [${themeName}] Generating cat 2/2... almost! 🐱`, "loading");
        let rightUrl = await generateImage(s.apiKey, s.chuteUrl, promptRight);

        if (s.bgMode === "removebg") {
            setStatus("✂️ Removing background (cat 1/2)... 🖼️", "loading");
            leftUrl  = await removeBackground(leftUrl, s.removebgKey);
            setStatus("✂️ Removing background (cat 2/2)... 🖼️", "loading");
            rightUrl = await removeBackground(rightUrl, s.removebgKey);
        }

        extension_settings[extensionName].catImageLeft  = leftUrl;
        extension_settings[extensionName].catImageRight = rightUrl;
        saveSettingsDebounced();

        $("#ecc_preview_left").attr("src", leftUrl);
        $("#ecc_preview_right").attr("src", rightUrl);
        $("#ecc_preview").show();
        setStatus("✅ Both cats ready! Preview below — click Apply when happy.", "success");
    } catch (err) {
        setStatus(`❌ ${err.message}`, "error");
    } finally {
        $("#ecc_generate_btn").prop("disabled", false).val("✨ Generate Both Cats");
    }
}

function onApplyClick() {
    applyDecorations();
    setStatus("✅ Cats are now beside your chatbox! 🐾", "success");
}

// ─── Load Settings ─────────────────────────────────────────────────────────────
function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }

    const s = extension_settings[extensionName];
    $("#ecc_enabled").prop("checked", s.enabled);
    $("#ecc_api_key").val(s.apiKey || "");
    $("#ecc_chute_url").val(s.chuteUrl || "");
    $("#ecc_removebg_key").val(s.removebgKey || "");
    $(`input[name='ecc_bg_mode'][value='${s.bgMode ?? "black"}']`).prop("checked", true);

    updateBgModeUI();
    populatePromptDropdown();

    if (s.catImageLeft) {
        $("#ecc_preview_left").attr("src", s.catImageLeft);
        $("#ecc_preview_right").attr("src", s.catImageRight || s.catImageLeft);
        $("#ecc_preview").show();
    }

    if (s.enabled) applyDecorations();
}

// ─── Init ──────────────────────────────────────────────────────────────────────
jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);
    try {
        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);
        $("#extensions_settings2").append(settingsHtml);

        $("#ecc_enabled").on("input", onToggleChange);
        $("#ecc_api_key").on("change", onApiKeyChange);
        $("#ecc_chute_url").on("change", onChuteUrlChange);
        $("#ecc_prompt_select").on("change", onPromptSelectChange);
        $("input[name='ecc_bg_mode']").on("change", onBgModeChange);
        $("#ecc_removebg_key").on("change", onRemoveBgKeyChange);
        $("#ecc_generate_btn").on("click", onGenerateClick);
        $("#ecc_apply_btn").on("click", onApplyClick);

        loadSettings();
        console.log(`[${extensionName}] ✅ Loaded`);
    } catch (err) {
        console.error(`[${extensionName}] ❌`, err);
    }
});
