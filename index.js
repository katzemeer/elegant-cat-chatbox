import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "elegant-cat-chatbox";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const defaultSettings = {
    enabled: false,
    apiKey: "",
    selectedChute: null,
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
function clearStatus() {
    $("#ecc_status").hide().text("").attr("class", "ecc-status");
}

// ─── Fetch available image/diffusion chutes ────────────────────────────────────
async function fetchImageChutes(apiKey) {
    const url = "https://api.chutes.ai/chutes/?include_public=true&template=diffusion&limit=50";
    const res = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        }
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return Array.isArray(data) ? data : (data.items || data.chutes || []);
}

// ─── Generate image via selected chute ────────────────────────────────────────
// Diffusion template chutes: POST /{username}-{slug}.chutes.ai/generate
// Returns: { images: ["base64string", ...] }
async function generateImage(apiKey, chute) {
    // Use the slug field from the API directly — don't reconstruct it
    const subdomain = `${chute.username}-${chute.slug}`;
    const url = `https://${subdomain}.chutes.ai/generate`;

    console.log(`[${extensionName}] Calling: ${url}`);

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            prompt: CAT_PROMPT,
            negative_prompt: "ugly, blurry, low quality, text, watermark, frame, border, signature",
            width: 512,
            height: 512,
            num_inference_steps: 30,
            guidance_scale: 7.5
        })
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Generation error ${res.status}: ${err}`);
    }

    const data = await res.json();

    // Handle diffusion template format: { images: ["base64..."] }
    if (data.images && data.images.length > 0) {
        return `data:image/png;base64,${data.images[0]}`;
    }

    // Handle OpenAI-compat format: { data: [{ b64_json: "..." }] }
    if (data.data && data.data[0]?.b64_json) {
        return `data:image/png;base64,${data.data[0].b64_json}`;
    }

    // Handle raw base64 string
    if (typeof data === "string") {
        return `data:image/png;base64,${data}`;
    }

    console.error(`[${extensionName}] Unexpected response shape:`, data);
    throw new Error("Unexpected response format — check the console (F12) and tell me what you see!");
}

// ─── Decorations ───────────────────────────────────────────────────────────────
function applyDecorations() {
    const { catImageLeft, catImageRight } = extension_settings[extensionName];
    if (!catImageLeft) {
        setStatus("⚠️ No cat images yet! Generate some first, then apply.", "error");
        return;
    }

    const chat = $("#chat");
    if (!chat.length) {
        setStatus("⚠️ Couldn't find #chat — open F12 → Elements and tell me what wraps your messages!", "error");
        return;
    }

    if (chat.parent().hasClass("ecc-decoration-wrapper")) return;

    chat.wrap('<div class="ecc-decoration-wrapper"></div>');
    chat.parent().prepend(`
        <img class="ecc-cat-img left"  src="${catImageLeft}"  alt="cat"/>
        <img class="ecc-cat-img right" src="${catImageRight || catImageLeft}" alt="cat"/>
    `);
    console.log(`[${extensionName}] ✅ Cats applied!`);
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

function onModelSelect() {
    const idx = $("#ecc_model_select").val();
    const chutes = window._eccChutes || [];
    if (idx !== "" && chutes[idx]) {
        extension_settings[extensionName].selectedChute = chutes[idx];
        saveSettingsDebounced();
        $("#ecc_model_tagline").text(chutes[idx].tagline || "");
        console.log(`[${extensionName}] Selected chute:`, chutes[idx]);
    }
}

async function onFetchModelsClick() {
    const apiKey = extension_settings[extensionName].apiKey;
    if (!apiKey) {
        setStatus("❌ Please enter your API key first!", "error");
        return;
    }

    $("#ecc_fetch_models_btn").prop("disabled", true).val("⏳ Loading...");
    setStatus("🔍 Fetching image models from Chutes...", "loading");

    try {
        const chutes = await fetchImageChutes(apiKey);
        window._eccChutes = chutes;

        if (!chutes.length) {
            setStatus("⚠️ No diffusion models found. Try refreshing or check your API key.", "error");
            return;
        }

        const select = $("#ecc_model_select");
        select.empty().append('<option value="">-- Choose a model --</option>');
        chutes.forEach((c, i) => {
            select.append(`<option value="${i}">${c.name} (by ${c.username})</option>`);
        });

        // Restore previously selected if any
        const saved = extension_settings[extensionName].selectedChute;
        if (saved) {
            const match = chutes.findIndex(c => c.slug === saved.slug && c.username === saved.username);
            if (match >= 0) {
                select.val(match);
                $("#ecc_model_tagline").text(chutes[match].tagline || "");
            }
        }

        $("#ecc_model_section").show();
        setStatus(`✅ Found ${chutes.length} image models! Pick one from the dropdown.`, "success");
    } catch (err) {
        console.error(`[${extensionName}]`, err);
        setStatus(`❌ ${err.message}`, "error");
    } finally {
        $("#ecc_fetch_models_btn").prop("disabled", false).val("🔍 Load Image Models");
    }
}

async function onGenerateClick() {
    const apiKey = extension_settings[extensionName].apiKey;
    const chute  = extension_settings[extensionName].selectedChute;

    if (!apiKey) { setStatus("❌ Please enter your API key!", "error"); return; }
    if (!chute)  { setStatus("❌ Please select a model first!", "error"); return; }

    $("#ecc_generate_btn").prop("disabled", true).val("⏳ Generating...");
    $("#ecc_preview").hide();
    setStatus(`🎨 Generating watercolor cat using "${chute.name}"... ~20–30 seconds 🐱`, "loading");

    try {
        const imageUrl = await generateImage(apiKey, chute);

        extension_settings[extensionName].catImageLeft  = imageUrl;
        extension_settings[extensionName].catImageRight = imageUrl;
        saveSettingsDebounced();

        $("#ecc_preview_left").attr("src", imageUrl);
        $("#ecc_preview_right").attr("src", imageUrl);
        $("#ecc_preview").show();
        setStatus("✅ Cat generated! Check the preview, then click Apply.", "success");
    } catch (err) {
        console.error(`[${extensionName}]`, err);
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
        $("#ecc_fetch_models_btn").on("click", onFetchModelsClick);
        $("#ecc_model_select").on("change", onModelSelect);
        $("#ecc_generate_btn").on("click", onGenerateClick);
        $("#ecc_apply_btn").on("click", onApplyClick);

        loadSettings();
        console.log(`[${extensionName}] ✅ Loaded`);
    } catch (err) {
        console.error(`[${extensionName}] ❌`, err);
    }
});
