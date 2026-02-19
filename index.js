import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "elegant-cat-chatbox";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const defaultSettings = {
    enabled: false
};

// SVG: Elegant sitting cat silhouette with a small botanical sprig
const catSVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="90" height="90">
  <!-- Botanical leaves behind the cat -->
  <g fill="none" stroke="#7a9e7e" stroke-width="1.2" opacity="0.9">
    <path d="M10,80 Q5,60 20,50 Q15,65 10,80Z" fill="#a8c5a0"/>
    <path d="M8,78 Q2,55 18,48"/>
    <path d="M18,75 Q30,55 45,60 Q32,68 18,75Z" fill="#b8d4b0"/>
    <path d="M20,73 Q33,57 46,61"/>
    <path d="M5,85 Q10,75 22,78 Q14,82 5,85Z" fill="#a8c5a0"/>
  </g>

  <!-- Cat body -->
  <ellipse cx="54" cy="72" rx="22" ry="18" fill="#d4c5a9"/>
  
  <!-- Cat head -->
  <circle cx="54" cy="46" r="16" fill="#d4c5a9"/>
  
  <!-- Left ear -->
  <polygon points="41,36 38,22 50,32" fill="#d4c5a9"/>
  <polygon points="42,34 40,25 49,32" fill="#e8b4b8" opacity="0.6"/>
  
  <!-- Right ear -->
  <polygon points="67,36 70,22 58,32" fill="#d4c5a9"/>
  <polygon points="66,34 68,25 59,32" fill="#e8b4b8" opacity="0.6"/>
  
  <!-- Eyes -->
  <ellipse cx="47" cy="45" rx="3.5" ry="4" fill="#5a4a3a"/>
  <ellipse cx="61" cy="45" rx="3.5" ry="4" fill="#5a4a3a"/>
  <circle cx="48" cy="44" r="1" fill="white"/>
  <circle cx="62" cy="44" r="1" fill="white"/>
  
  <!-- Nose -->
  <polygon points="54,51 52,53 56,53" fill="#c4a0a0"/>
  
  <!-- Mouth -->
  <path d="M52,53 Q50,56 48,55" stroke="#9a7a7a" stroke-width="0.8" fill="none"/>
  <path d="M56,53 Q58,56 60,55" stroke="#9a7a7a" stroke-width="0.8" fill="none"/>
  
  <!-- Whiskers -->
  <line x1="32" y1="50" x2="46" y2="52" stroke="#9a8a7a" stroke-width="0.7" opacity="0.8"/>
  <line x1="32" y1="53" x2="46" y2="53" stroke="#9a8a7a" stroke-width="0.7" opacity="0.8"/>
  <line x1="62" y1="52" x2="76" y2="50" stroke="#9a8a7a" stroke-width="0.7" opacity="0.8"/>
  <line x1="62" y1="53" x2="76" y2="53" stroke="#9a8a7a" stroke-width="0.7" opacity="0.8"/>
  
  <!-- Tail curling around -->
  <path d="M32,85 Q20,90 22,78 Q24,70 35,72" 
        stroke="#c4b090" stroke-width="5" fill="none" stroke-linecap="round"/>
  
  <!-- Paws -->
  <ellipse cx="44" cy="88" rx="8" ry="5" fill="#c8b898"/>
  <ellipse cx="64" cy="88" rx="8" ry="5" fill="#c8b898"/>

  <!-- Small gold accent dots -->
  <circle cx="54" cy="30" r="1.5" fill="#c9a84c" opacity="0.7"/>
  <circle cx="48" cy="28" r="1" fill="#c9a84c" opacity="0.5"/>
  <circle cx="60" cy="28" r="1" fill="#c9a84c" opacity="0.5"/>
</svg>`;

// SVG: Delicate repeating vine for the top border
const vineSVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 28" preserveAspectRatio="xMidYMid slice"
     width="100%" height="28">
  <g fill="none" stroke="#7a9e7e" stroke-width="1.1">
    <!-- Main vine stem -->
    <path d="M0,14 Q50,6 100,14 Q150,22 200,14 Q250,6 300,14 Q350,22 400,14" 
          stroke="#8aae8a" stroke-width="1.4"/>
    
    <!-- Leaves along the vine -->
    <path d="M25,14 Q22,6 30,4 Q28,10 25,14Z" fill="#a8c5a0" stroke="none"/>
    <path d="M75,14 Q78,6 70,4 Q72,10 75,14Z" fill="#a8c5a0" stroke="none"/>
    <path d="M100,14 Q97,4 106,2 Q104,9 100,14Z" fill="#b8d4b0" stroke="none"/>
    <path d="M125,14 Q128,22 120,24 Q122,18 125,14Z" fill="#a8c5a0" stroke="none"/>
    <path d="M175,14 Q172,6 180,4 Q178,10 175,14Z" fill="#a8c5a0" stroke="none"/>
    <path d="M200,14 Q197,22 206,24 Q204,18 200,14Z" fill="#b8d4b0" stroke="none"/>
    <path d="M225,14 Q228,6 220,4 Q222,10 225,14Z" fill="#a8c5a0" stroke="none"/>
    <path d="M275,14 Q272,22 280,24 Q278,18 275,14Z" fill="#a8c5a0" stroke="none"/>
    <path d="M300,14 Q297,6 306,2 Q304,9 300,14Z" fill="#b8d4b0" stroke="none"/>
    <path d="M325,14 Q328,22 320,24 Q322,18 325,14Z" fill="#a8c5a0" stroke="none"/>
    <path d="M375,14 Q372,6 380,4 Q378,10 375,14Z" fill="#a8c5a0" stroke="none"/>

    <!-- Small gold berry accents -->
  </g>
  <circle cx="50" cy="10" r="2" fill="#c9a84c" opacity="0.6"/>
  <circle cx="150" cy="18" r="2" fill="#c9a84c" opacity="0.6"/>
  <circle cx="250" cy="10" r="2" fill="#c9a84c" opacity="0.6"/>
  <circle cx="350" cy="18" r="2" fill="#c9a84c" opacity="0.6"/>
</svg>`;

function applyDecorations() {
    // Find the chat area - this is the main chat container in SillyTavern
    const chatTarget = $("#chat");
    if (!chatTarget.length) {
        console.warn(`[${extensionName}] Could not find #chat element`);
        return;
    }

    // Avoid double-wrapping
    if (chatTarget.parent().hasClass("ecc-decoration-wrapper")) return;

    chatTarget.wrap('<div class="ecc-decoration-wrapper"></div>');

    const wrapper = chatTarget.parent();
    wrapper.prepend(`
        <div class="ecc-corner ecc-corner-left">${catSVG}</div>
        <div class="ecc-corner ecc-corner-right">${catSVG}</div>
        <div class="ecc-top-border">${vineSVG}</div>
    `);

    console.log(`[${extensionName}] ✅ Decorations applied`);
}

function removeDecorations() {
    const wrapper = $("#chat").parent();
    if (!wrapper.hasClass("ecc-decoration-wrapper")) return;

    $(".ecc-corner, .ecc-top-border").remove();
    $("#chat").unwrap();

    console.log(`[${extensionName}] Decorations removed`);
}

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

    if (value) {
        applyDecorations();
    } else {
        removeDecorations();
    }

    console.log(`[${extensionName}] Decorations enabled:`, value);
}

jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);

    try {
        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);
        $("#extensions_settings2").append(settingsHtml);

        $("#ecc_enabled").on("input", onToggleChange);
        loadSettings();

        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});
