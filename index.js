import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "elegant-cat-chatbox";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const defaultSettings = {
    enabled: false,
    apiKey: "",
    chuteUrl: "",
    catImageLeft: "",
    catImageRight: ""
};

// Vague, open-ended prompts so the AI has creative freedom
const PROMPT_LEFT =
    "A cute cat with soft watercolor botanical flowers and leaves, " +
    "chibi illustration style, pastel colors, white background, " +
    "no text, no watermark, no border, high quality";

const PROMPT_RIGHT =
    "A cute cat with soft watercolor wildflowers and botanical sprigs, " +
    "chibi illustration style, warm pastel tones, white background, " +
    "no text, no watermark, no border, high quality";

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

// ─── Position cats over the chat element ───────────────────────────────────────
function positionCats() {
    const chat = $("#chat")[0];
    if (!chat) return;

    const rect = chat.getBoundingClientRect();

    $("#ecc_cat_left").css({
        top:  (rect.top) + "px",
        left: (rect.left) + "px"
    });

    $("#ecc_cat_right").css({
        top:  (rect.top) + "px",
        left: (rect.right - 130) + "px"
    });
}

// ─── Decorations ───────────────────────────────────────────────────────────────
function applyDecorations() {
    const { catImageLeft, catImageRight } = extension_settings[extensionName];

    if (!catImageLeft) {
        setStatus("⚠️ No cats yet — generate some first!", "error");
        return;
    }

    removeDecorations();

    $("body").append(`
        <img class="ecc-cat-img left"
             id="ecc_cat_left"
             src="${catImageLeft}"
             alt="cat left"/>
        <img class="ecc-cat-img right"
             id="ecc_cat_right"
             src="${catImageRight || catImageLeft}"
             alt="cat right"/>
    `);

    positionCats();
    $(window).on("resize.ecc", positionCats);

    console.log(`[${extensionName}] ✅ Cats applied!`);
}

function removeDecorations() {
    $("#ecc_cat_left, #ecc_cat_right").remove();
    $(window).off("resize.ecc");
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

async function onGenerateClick() {
    const apiKey   = extension_settings[extensionName].apiKey;
    const chuteUrl = extension_settings[extensionName].chuteUrl;

    if (!apiKey)   { setStatus("❌ Please enter your Chutes API key!", "error"); return; }
    if (!chuteUrl) { setStatus("❌ Please enter the Chute endpoint URL!", "error"); return; }
    if (!chuteUrl.startsWith("https://")) {
        setStatus("❌ URL must start with https://", "error");
        return;
    }

    $("#ecc_generate_btn").prop("disabled", true).val("⏳ Generating...");
    $("#ecc_preview").hide();

    try {
        setStatus("🎨 Generating cat 1 of 2... ~20–30 seconds 🐱", "loading");
        const leftUrl  = await generateImage(apiKey, chuteUrl, PROMPT_LEFT);

        setStatus("🎨 Generating cat 2 of 2... almost there! 🐱", "loading");
        const rightUrl = await generateImage(apiKey, chuteUrl, PROMPT_RIGHT);

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
    setStatus("✅ Cats fixed to your screen! Menus will appear on top of them. 🐾", "success");
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
        $("#ecc_generate_btn").on("click", onGenerateClick);
        $("#ecc_apply_btn").on("click", onApplyClick);

        loadSettings();
        console.log(`[${extensionName}] ✅ Loaded`);
    } catch (err) {
        console.error(`[${extensionName}] ❌`, err);
    }
});
