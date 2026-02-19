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
    selectedPromptIndex: -1  // -1 = random each time
};

// ─── Prompt Library ────────────────────────────────────────────────────────────
// Each entry has a label (shown in dropdown) and left/right prompts.
// Prompts are intentionally vague so the AI has creative freedom.
const PROMPT_THEMES = [
    {
        label: "🎲 Random (different every time!)",
        left:  null,  // null = pick random from the rest
        right: null
    },
    {
        label: "🌸 Botanical Garden",
        left:  "a small fluffy cat nestled among watercolor wildflowers and leaves, " +
               "chibi style, soft pastel palette, transparent or white background, " +
               "no text, no watermark, facing right, peaceful expression",
        right: "a small fluffy cat peeking through watercolor botanical sprigs and blossoms, " +
               "chibi style, warm pastel tones, transparent or white background, " +
               "no text, no watermark, curious expression"
    },
    {
        label: "📚 Cozy Library",
        left:  "a chubby cat curled up on a stack of old books with a tiny teacup nearby, " +
               "soft illustrated style, warm amber and cream tones, white background, " +
               "cozy and sleepy mood, no text, no watermark",
        right: "a fluffy cat wearing a tiny scarf sitting beside colorful book spines, " +
               "soft illustrated style, warm cozy colors, white background, " +
               "content expression, hearts floating, no text, no watermark"
    },
    {
        label: "✨ Magical & Sparkly",
        left:  "a magical glowing cat with tiny stars and sparkles floating around it, " +
               "fantasy chibi art style, soft purple and gold tones, white background, " +
               "ethereal mood, small crescent moon nearby, no text, no watermark",
        right: "a mystical cat with a star wand and swirling magical particles, " +
               "fantasy chibi style, rose gold and lavender palette, white background, " +
               "whimsical dreamy feel, no text, no watermark"
    },
    {
        label: "😴 Sleepy Loaf",
        left:  "a perfectly loaf-shaped sleeping cat with closed eyes and rosy cheeks, " +
               "adorable chibi illustration, soft neutral tones, white background, " +
               "zzz bubbles floating above, ultra fluffy, no text, no watermark",
        right: "a round sleepy cat mid-yawn with tiny paws tucked in, " +
               "cute chibi style, pastel cream and grey colors, white background, " +
               "drowsy cozy mood, small pillow nearby, no text, no watermark"
    },
    {
        label: "🌙 Midnight Dreamer",
        left:  "a dark fluffy cat silhouette glowing at the edges against a starry sky, " +
               "soft dreamy illustration style, deep blue and silver palette, white background, " +
               "moon and tiny stars around it, mysterious yet cute, no text, no watermark",
        right: "a cat gazing up at floating lanterns and paper stars, " +
               "soft nocturnal illustration, navy and gold tones, white background, " +
               "dreamy night garden feel, chibi proportions, no text, no watermark"
    },
    {
        label: "🍓 Cottagecore",
        left:  "a chubby cottagecore cat wearing a tiny flower crown, sitting in dewy grass, " +
               "soft illustrated style, strawberry red and sage green tones, white background, " +
               "rustic cozy mood, mushroom nearby, no text, no watermark",
        right: "a fluffy cat in a woven basket surrounded by berries and daisies, " +
               "cottagecore illustration style, warm earthy pastels, white background, " +
               "happy summer mood, butterfly nearby, no text, no watermark"
    },
    {
        label: "🎀 Fancy & Elegant",
        left:  "a sophisticated cat wearing a tiny bow tie and top hat, " +
               "elegant chibi illustration, black and gold palette, white background, " +
               "dignified yet adorable expression, ornate swirls around it, no text, no watermark",
        right: "a regal fluffy cat draped in tiny ribbons and pearls, " +
               "elegant soft illustration style, rose gold and ivory tones, white background, " +
               "graceful pose, small crown, fancy and cute, no text, no watermark"
    },
    {
        label: "🌊 Ocean Breeze",
        left:  "a fluffy cat wearing a sailor collar sitting on sea foam, " +
               "soft watercolor illustration, ocean blue and seafoam green tones, white background, " +
               "small shells and bubbles around it, breezy cheerful mood, no text, no watermark",
        right: "a cat with a tiny starfish hat surrounded by floating sea bubbles, " +
               "watercolor chibi style, aquamarine and pearl tones, white background, " +
               "playful underwater-inspired feel, no text, no watermark"
    },
    {
        label: "🍂 Autumn Vibes",
        left:  "a cozy cat wrapped in a tiny knitted scarf among falling autumn leaves, " +
               "soft illustrated style, burnt orange and golden yellow palette, white background, " +
               "warm seasonal mood, acorn nearby, no text, no watermark",
        right: "a fluffy cat peeking out of a pile of colorful fallen leaves, " +
               "chibi illustration, warm russet and amber tones, white background, " +
               "playful autumn mood, small mushroom nearby, no text, no watermark"
    },
    {
        label: "🎪 Silly & Dramatic",
        left:  "a cat with a hilariously shocked expression, tiny lightning bolts around head, " +
               "expressive comic chibi style, bright colors, white background, " +
               "very dramatic pose, sweat drop, no text, no watermark",
        right: "a cat in a tiny superhero cape striking a heroic pose, " +
               "bold comic chibi illustration, vibrant primary colors, white background, " +
               "action lines and stars, comically serious expression, no text, no watermark"
    }
];

// ─── Get prompts for current selection ────────────────────────────────────────
function getSelectedPrompts() {
    let idx = extension_settings[extensionName].selectedPromptIndex ?? -1;

    // -1 or 0 both mean "random" — pick randomly from themes 1+
    if (idx <= 0) {
        idx = Math.floor(Math.random() * (PROMPT_THEMES.length - 1)) + 1;
        console.log(`[${extensionName}] 🎲 Random theme picked: "${PROMPT_THEMES[idx].label}"`);
    }

    return {
        left:  PROMPT_THEMES[idx].left,
        right: PROMPT_THEMES[idx].right,
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

    if (data.images?.length > 0)
        return `data:image/png;base64,${data.images[0]}`;
    if (data.data?.[0]?.b64_json)
        return `data:image/png;base64,${data.data[0].b64_json}`;
    if (data.data?.[0]?.url)
        return data.data[0].url;

    throw new Error("Unrecognised response format — try a different model!");
}

// ─── Decorations ───────────────────────────────────────────────────────────────
// Cats are now fixed to the BOTTOM CORNERS of the viewport screen.
// They don't overlap the chat text at all — they frame the edges of the UI.
function applyDecorations() {
    const { catImageLeft, catImageRight } = extension_settings[extensionName];

    if (!catImageLeft) {
        setStatus("⚠️ No cats yet — generate some first!", "error");
        return;
    }

    removeDecorations();

    // Append to body — position is handled entirely in CSS (bottom corners)
    $("body").append(`
        <img class="ecc-cat-img ecc-cat-left"
             id="ecc_cat_left"
             src="${catImageLeft}"
             alt="cat left"/>
        <img class="ecc-cat-img ecc-cat-right"
             id="ecc_cat_right"
             src="${catImageRight || catImageLeft}"
             alt="cat right"/>
    `);

    console.log(`[${extensionName}] ✅ Cats applied to screen corners!`);
}

function removeDecorations() {
    $("#ecc_cat_left, #ecc_cat_right").remove();
}

// ─── Populate prompt dropdown ──────────────────────────────────────────────────
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
function onToggleChange(event) {
    const value = Boolean($(event.target).prop("checked"));
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
    const idx = parseInt($("#ecc_prompt_select").val(), 10);
    extension_settings[extensionName].selectedPromptIndex = idx;
    saveSettingsDebounced();
}

async function onGenerateClick() {
    const apiKey   = extension_settings[extensionName].apiKey;
    const chuteUrl = extension_settings[extensionName].chuteUrl;

    if (!apiKey)   { setStatus("❌ Please enter your Chutes API key!", "error"); return; }
    if (!chuteUrl) { setStatus("❌ Please enter the Chute endpoint URL!", "error"); return; }
    if (!chuteUrl.startsWith("https://")) {
        setStatus("❌ URL must start with https://", "error");
        return;
    }

    const { left: promptLeft, right: promptRight, label: themeName } = getSelectedPrompts();

    $("#ecc_generate_btn").prop("disabled", true).val("⏳ Generating...");
    $("#ecc_preview").hide();

    try {
        setStatus(`🎨 Theme: ${themeName} — Generating cat 1/2... 🐱`, "loading");
        const leftUrl  = await generateImage(apiKey, chuteUrl, promptLeft);

        setStatus(`🎨 Theme: ${themeName} — Generating cat 2/2... almost! 🐱`, "loading");
        const rightUrl = await generateImage(apiKey, chuteUrl, promptRight);

        extension_settings[extensionName].catImageLeft  = leftUrl;
        extension_settings[extensionName].catImageRight = rightUrl;
        saveSettingsDebounced();

        $("#ecc_preview_left").attr("src", leftUrl);
        $("#ecc_preview_right").attr("src", rightUrl);
        $("#ecc_preview").show();

        setStatus("✅ Both cats generated! Preview below — click Apply when ready.", "success");
    } catch (err) {
        setStatus(`❌ ${err.message}`, "error");
    } finally {
        $("#ecc_generate_btn").prop("disabled", false).val("✨ Generate Both Cats");
    }
}

function onApplyClick() {
    applyDecorations();
    setStatus("✅ Cats are now in the bottom corners of your screen! 🐾", "success");
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
        $("#ecc_generate_btn").on("click", onGenerateClick);
        $("#ecc_apply_btn").on("click", onApplyClick);

        loadSettings();
        console.log(`[${extensionName}] ✅ Loaded`);
    } catch (err) {
        console.error(`[${extensionName}] ❌`, err);
    }
});
