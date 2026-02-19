import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "elegant-cat-chatbox";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const defaultSettings = {
    enabled: false,
    apiKey: "",
    catImageLeft: "",   // base64 data URL
    catImageRight: ""   // base64 data URL (same image, CSS mirrors it)
};

// ─── Prompts ───────────────────────────────────────────────────────────────────
const CAT_PROMPT = [
    "A single cute cat sitting gracefully, soft delicate watercolor illustration,",
    "pastel pink and sage green botanical flowers and leaves surrounding the cat,",
    "elegant, whimsical, storybook style, white background, high detail,",
    "centered composition, no text, no watermark, no border"
].join(" ");

// ─── Chutes API ────────────────────────────────────────────────────────────────
async function generateCatImage(apiKey) {
    const response = await fetch("https://api.chutes.ai/v1/images/generations", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "black-forest-labs/FLUX.1-dev",
            prompt: CAT_PROMPT,
            n: 1,
            size: "512x512",
            response_format: "b64_json"
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Chutes API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) throw new Error("No image data returned from API");

    return `data:image/png;base64,${b64}`;
}

// ─── Status helper ─────────────────────────────────────────────────────────────
function setStatus(message, type = "loading") {
    const el = $("#ecc_status");
    el.text(message)
      .attr("class", `ecc-status ${type}`)
      .show();
}

function clearStatus() {
    $("#ecc_status").hide().text("").attr("class", "ecc-status");
}

// ─── Decorations ───────────────────────────────────────────────────────────────
function applyDecorations() {
    const { catImageLeft, catImageRight } = extension_settings[extensionName];

    // Need images to apply
    if (!catImageLeft) {
        console.warn(`[${extensionName}] No cat images yet — generate some first!`);
        return;
    }

    const chatTarget = $("#chat");
    if (!chatTarget.length) {
        console.warn(`[${extensionName}] ⚠️ Could not find #chat`);
        return;
    }

    if (chatTarget.parent().hasClass("ecc-decoration-wrapper")) return;

    chatTarget.wrap('<div class="ecc-decoration-wrapper"></div>');
    const wrapper = chatTarget.parent();

    wrapper.prepend(`
        <img class="ecc-cat-img left"  src="${catImageLeft}"  alt="cat"/>
        <img class="ecc-cat-img right" src="${catImageRight || catImageLeft}" alt="cat"/>
    `);

    console.log(`[${extensionName}] ✅ Cats applied to chatbox`);
}

function removeDecorations() {
    const chat = $("#chat");
    if (!chat.parent().hasClass("ecc-decoration-wrapper")) return;
    $(".ecc-cat-img").remove();
    chat.unwrap();
    console.log(`[${extensionName}] Decorations removed`);
}

function refreshDecorations() {
    removeDecorations();
    if (extension_settings[extensionName].enabled) applyDecorations();
}

// ─── Handlers ─────────────────────────────────────────────────────────────────
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

async function onGenerateClick() {
    const apiKey = extension_settings[extensionName].apiKey;

    if (!apiKey) {
        setStatus("❌ Please enter your Chutes API key first!", "error");
        return;
    }

    $("#ecc_generate_btn").prop("disabled", true).val("⏳ Generating...");
    $("#ecc_preview").hide();
    setStatus("🎨 Generating watercolor cat... this takes ~20–30 seconds. Sit tight! 🐱", "loading");

    try {
        // Generate one image — CSS mirrors it for the right side
        const imageUrl = await generateCatImage(apiKey);

        // Store in settings
        extension_settings[extensionName].catImageLeft  = imageUrl;
        extension_settings[extensionName].catImageRight = imageUrl;
        saveSettingsDebounced();

        // Show preview
        $("#ecc_preview_left").attr("src", imageUrl);
        $("#ecc_preview_right").attr("src", imageUrl);
        $("#ecc_preview").show();

        setStatus("✅ Cat generated! Check the preview below, then click Apply.", "success");
        console.log(`[${extensionName}] ✅ Image generated and stored`);
    } catch (err) {
        console.error(`[${extensionName}] Generation error:`, err);
        setStatus(`❌ Error: ${err.message}`, "error");
    } finally {
        $("#ecc_generate_btn").prop("disabled", false).val("✨ Generate Cats");
    }
}

function onApplyClick() {
    refreshDecorations();
    setStatus("✅ Cats applied to your chatbox! Toggle off/on if they don't appear.", "success");
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

    // If we already have a saved image, show the preview
    if (s.catImageLeft) {
        $("#ecc_preview_left").attr("src", s.catImageLeft);
        $("#ecc_preview_right").attr("src", s.catImageLeft);
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
        $("#ecc_generate_btn").on("click", onGenerateClick);
        $("#ecc_apply_btn").on("click", onApplyClick);

        loadSettings();
        console.log(`[${extensionName}] ✅ Loaded`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed:`, error);
    }
});
