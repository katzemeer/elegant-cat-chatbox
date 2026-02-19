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

const CAT_PROMPT =
    "A single adorable cat sitting gracefully, soft delicate watercolor illustration, " +
    "pastel pink and sage green botanical flowers and leaves surrounding the cat, " +
    "elegant whimsical storybook style, pure white background, centered composition, " +
    "high detail, no text, no watermark, no border, no frame";

// ─── Status helper ─────────────────────────────────────────────────────────────
function setStatus(msg, type = "loading") {
    $("#ecc_status").text(msg).attr("class", `ecc-status ${type}`).show();
}

// ─── Generate image ────────────────────────────────────────────────────────────
async function generateImage(apiKey, chuteUrl) {
    const res = await fetch(chuteUrl, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            prompt: CAT_PROMPT,
            negative_prompt: "ugly, blurry, low quality, text, watermark, frame, border",
            width: 512,
            height: 512,
            num_inference_steps: 30,
            guidance_scale: 7.5
        })
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`API error ${res.status}: ${err}`);
    }

    const data = await res.json();

    // Handle diffusion format: { images: ["base64..."] }
    if (data.images?.length > 0) {
        return `data:image/png;base64,${data.images[0]}`;
    }

    // Handle OpenAI-compat format: { data: [{ b64_json: "..." }] }
    if (data.data?.[0]?.b64_json) {
        return `data:image/png;base64,${data.data[0].b64_json}`;
    }

    // Handle URL response: { data: [{ url: "..." }] }
    if (data.data?.[0]?.url) {
        return data.data[0].url;
    }

    throw new Error(
        "Unexpected response format from this model. " +
        "Try a different model URL — look for FLUX or SD models on Chutes."
    );
}

// ─── Decorations ───────────────────────────────────────────────────────────────
function applyDecorations() {
    const { catImageLeft, catImageRight } = extension_settings[extensionName];
    if (!catImageLeft) {
        setStatus("⚠️ No cat images yet — generate some first!", "error");
        return;
    }

    const chat = $("#chat");
    if (!chat.length) {
        setStatus("⚠️ Couldn't find the chat area. Contact developer!", "error");
        return;
    }

    if (chat.parent().hasClass("ecc-decoration-wrapper")) return;

    chat.wrap('<div class="ecc-decoration-wrapper"></div>');
    chat.parent().prepend(`
        <img class="ecc-cat-img left"  src="${catImageLeft}"  alt="cat"/>
        <img class="ecc-cat-img right" src="${catImageRight || catImageLeft}" alt="cat"/>
    `);
}

function removeDecorations() {
    const chat = $("#chat");
    if (!chat.parent().hasClass("ecc-decoration-wrapper")) return;
    $(".ecc-cat-img").remove();
    chat.unwrap();
}

function refreshDecorations() {
    removeDecorations();
    if (extension_settings[extensionName].enabled) applyDecorations();
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
        setStatus("❌ URL should start with https://  — copy it from the curl example on Chutes.", "error");
        return;
    }

    $("#ecc_generate_btn").prop("disabled", true).val("⏳ Generating...");
    $("#ecc_preview").hide();
    setStatus("🎨 Generating your watercolor cat... ~20–30 seconds 🐱", "loading");

    try {
        const imageUrl = await generateImage(apiKey, chuteUrl);

        extension_settings[extensionName].catImageLeft  = imageUrl;
        extension_settings[extensionName].catImageRight = imageUrl;
        saveSettingsDebounced();

        $("#ecc_preview_left").attr("src", imageUrl);
        $("#ecc_preview_right").attr("src", imageUrl);
        $("#ecc_preview").show();
        setStatus("✅ Cat generated! Check the preview, then click Apply.", "success");
    } catch (err) {
        setStatus(`❌ ${err.message}`, "error");
    } finally {
        $("#ecc_generate_btn").prop("disabled", false).val("✨ Generate Cats");
    }
}

function onApplyClick() {
    refreshDecorations();
    setStatus("✅ Applied! Toggle off/on if cats don't appear right away.", "success");
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
        $("#ecc_chute_url").on("change", onChuteUrlChange);
        $("#ecc_generate_btn").on("click", onGenerateClick);
        $("#ecc_apply_btn").on("click", onApplyClick);

        loadSettings();
        console.log(`[${extensionName}] ✅ Loaded`);
    } catch (err) {
        console.error(`[${extensionName}] ❌`, err);
    }
});
