import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "elegant-cat-chatbox";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const defaultSettings = { enabled: false };

// ─── Pixel Cat SVG Generator ─────────────────────────────────────────────────
// Each "pixel" is an SVG rect. Body = main fur color, stripe = tabby stripe,
// eye = iris color, hasStripes = tabby markings, patches = extra overlay rects
function makePixelCat(body, stripe, eye, hasStripes = true, patches = '') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 92" width="80" height="92">
        <!-- Left ear -->
        <rect x="8"  y="0"  width="16" height="4"  fill="#1a1208"/>
        <rect x="8"  y="4"  width="16" height="10" fill="${body}"/>
        <rect x="10" y="6"  width="12" height="8"  fill="#ffd4dc"/>
        <!-- Right ear -->
        <rect x="56" y="0"  width="16" height="4"  fill="#1a1208"/>
        <rect x="56" y="4"  width="16" height="10" fill="${body}"/>
        <rect x="58" y="6"  width="12" height="8"  fill="#ffd4dc"/>
        <!-- Head outline + fill -->
        <rect x="4"  y="8"  width="72" height="46" fill="#1a1208"/>
        <rect x="8"  y="12" width="64" height="38" fill="${body}"/>
        ${hasStripes ? `
        <rect x="30" y="12" width="6" height="16" fill="${stripe}"/>
        <rect x="44" y="12" width="6" height="16" fill="${stripe}"/>` : ''}
        <!-- Eyes (left) -->
        <rect x="13" y="22" width="18" height="14" fill="#1a1208"/>
        <rect x="15" y="24" width="14" height="10" fill="${eye}"/>
        <rect x="15" y="24" width="6"  height="5"  fill="white"/>
        <!-- Eyes (right) -->
        <rect x="49" y="22" width="18" height="14" fill="#1a1208"/>
        <rect x="51" y="24" width="14" height="10" fill="${eye}"/>
        <rect x="53" y="24" width="6"  height="5"  fill="white"/>
        <!-- Pink cheeks -->
        <rect x="8"  y="33" width="12" height="9" fill="#ffb8c8" opacity="0.85"/>
        <rect x="60" y="33" width="12" height="9" fill="#ffb8c8" opacity="0.85"/>
        <!-- Nose -->
        <rect x="33" y="30" width="14" height="10" fill="#e87090"/>
        <!-- Mouth marks -->
        <rect x="26" y="42" width="8" height="4" fill="#1a1208"/>
        <rect x="46" y="42" width="8" height="4" fill="#1a1208"/>
        <!-- Whiskers -->
        <rect x="0"  y="34" width="11" height="2" fill="#1a1208"/>
        <rect x="0"  y="39" width="11" height="2" fill="#1a1208"/>
        <rect x="69" y="34" width="11" height="2" fill="#1a1208"/>
        <rect x="69" y="39" width="11" height="2" fill="#1a1208"/>
        ${patches}
        <!-- Body outline + fill -->
        <rect x="8"  y="54" width="64" height="32" fill="#1a1208"/>
        <rect x="12" y="56" width="56" height="26" fill="${body}"/>
        ${hasStripes ? `
        <rect x="12" y="64" width="56" height="4" fill="${stripe}"/>
        <rect x="12" y="72" width="56" height="4" fill="${stripe}"/>` : ''}
        <!-- Left arm -->
        <rect x="0"  y="56" width="14" height="18" fill="${body}"/>
        <rect x="0"  y="72" width="16" height="6"  fill="#1a1208"/>
        <!-- Right arm -->
        <rect x="66" y="56" width="14" height="18" fill="${body}"/>
        <rect x="64" y="72" width="16" height="6"  fill="#1a1208"/>
        <!-- Legs -->
        <rect x="14" y="84" width="20" height="8" fill="#1a1208"/>
        <rect x="16" y="84" width="16" height="6" fill="${body}"/>
        <rect x="46" y="84" width="20" height="8" fill="#1a1208"/>
        <rect x="48" y="84" width="16" height="6" fill="${body}"/>
        <!-- Tail -->
        <rect x="68" y="58" width="8"  height="18" fill="${body}"/>
        <rect x="58" y="74" width="18" height="8"  fill="${body}"/>
        <rect x="58" y="80" width="20" height="4"  fill="#1a1208"/>
    </svg>`;
}

// ─── Cat Variants ─────────────────────────────────────────────────────────────
const catOrange = makePixelCat('#e8903c', '#c06818', '#4a7c5a', true);

const catGray   = makePixelCat('#9898aa', '#606272', '#4a6c8a', false);

// Black & white: white base + black head patch
const catBnW    = makePixelCat('#e8e4dc', '#e8e4dc', '#2a2030', false,
    `<rect x="8"  y="12" width="36" height="22" fill="#222222"/>
     <rect x="10" y="14" width="32" height="18" fill="#333333"/>
     <rect x="15" y="24" width="14" height="10" fill="#2a2030"/>
     <rect x="15" y="24" width="6"  height="5"  fill="white"/>`
);

// Calico: white base + orange + black patches
const catCalico = makePixelCat('#e8e4dc', '#e8e4dc', '#2a2030', false,
    `<rect x="8"  y="12" width="20" height="18" fill="#e8903c"/>
     <rect x="50" y="20" width="22" height="14" fill="#222222"/>
     <rect x="12" y="56" width="24" height="14" fill="#e8903c"/>
     <rect x="40" y="60" width="20" height="18" fill="#222222"/>
     <rect x="49" y="22" width="18" height="14" fill="#2a2030"/>
     <rect x="51" y="24" width="14" height="10" fill="#9090a0"/>
     <rect x="53" y="24" width="6"  height="5"  fill="white"/>`
);

// ─── Tiny decorations (paws + hearts) ────────────────────────────────────────
function makePaw(color = '#ffb8c8', size = 20) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22" width="${size}" height="${size}">
        <rect x="7"  y="11" width="8" height="8" fill="${color}"/>
        <rect x="6"  y="12" width="10" height="7" fill="${color}"/>
        <rect x="2"  y="5"  width="5" height="5" fill="${color}"/>
        <rect x="9"  y="3"  width="5" height="5" fill="${color}"/>
        <rect x="16" y="5"  width="4" height="5" fill="${color}"/>
    </svg>`;
}

function makeHeart(color = '#ffb8c8', size = 16) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 14" width="${size}" height="${size}">
        <rect x="1" y="3" width="4" height="5" fill="${color}"/>
        <rect x="5" y="1" width="3" height="2" fill="${color}"/>
        <rect x="8" y="1" width="3" height="2" fill="${color}"/>
        <rect x="11" y="3" width="4" height="5" fill="${color}"/>
        <rect x="1" y="7" width="14" height="4" fill="${color}"/>
        <rect x="3" y="11" width="10" height="2" fill="${color}"/>
        <rect x="5" y="13" width="6"  height="1" fill="${color}"/>
    </svg>`;
}

const topDeco = [
    makePaw('#ffb8c8', 18),
    makeHeart('#ffb8c8', 14),
    makePaw('#e8c0b0', 16),
    makeHeart('#ffd0b8', 13),
    makePaw('#ffb8c8', 18),
    makeHeart('#ffb8c8', 14),
    makePaw('#e8c0b0', 16),
    makeHeart('#ffd0b8', 13),
    makePaw('#ffb8c8', 18),
    makeHeart('#ffb8c8', 14),
].join('');

// ─── Apply / Remove ───────────────────────────────────────────────────────────
function applyDecorations() {
    const chatTarget = $("#chat");
    if (!chatTarget.length) {
        console.warn(`[${extensionName}] ⚠️ Could not find #chat — open F12 and tell me what wraps your chat messages!`);
        return;
    }
    if (chatTarget.parent().hasClass("ecc-decoration-wrapper")) return;

    chatTarget.wrap('<div class="ecc-decoration-wrapper"></div>');
    const wrapper = chatTarget.parent();

    wrapper.prepend(`
        <div class="ecc-cat ecc-cat-topleft">${catOrange}</div>
        <div class="ecc-cat ecc-cat-topright">${catGray}</div>
        <div class="ecc-cat ecc-cat-inner-left">${catBnW}</div>
        <div class="ecc-cat ecc-cat-inner-right">${catCalico}</div>
        <div class="ecc-top-deco">${topDeco}</div>
    `);

    console.log(`[${extensionName}] ✅ Pixel cats deployed!`);
}

function removeDecorations() {
    const chat = $("#chat");
    if (!chat.parent().hasClass("ecc-decoration-wrapper")) return;
    $(".ecc-cat, .ecc-top-deco").remove();
    chat.unwrap();
    console.log(`[${extensionName}] Decorations removed`);
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }
    const enabled = extension_settings[extensionName].enabled;
    $("#ecc_enabled").prop("checked", enabled);
    if (enabled) applyDecorations();
}

function onToggleChange(event) {
    const value = Boolean($(event.target).prop("checked"));
    extension_settings[extensionName].enabled = value;
    saveSettingsDebounced();
    value ? applyDecorations() : removeDecorations();
}

jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);
    try {
        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);
        $("#extensions_settings2").append(settingsHtml);
        $("#ecc_enabled").on("input", onToggleChange);
        loadSettings();
        console.log(`[${extensionName}] ✅ Loaded`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed:`, error);
    }
});
