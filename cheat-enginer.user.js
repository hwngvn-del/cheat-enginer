// ==UserScript==
// @name        Toolkit VioEdu Violympic by Từ Hưng 8A2 pro vip 
// @namespace   local.gemini.vio.redesigned.ultra
// @version     12.4
// @description Chụp bài đính kèm, Tích hợp Firebase Key Online, Tạo key thời hạn, Đồng bộ nhiều máy & Nút ẩn/hiện mật khẩu
// @match       https://vio.edu.vn/*
// @match       https://www.vio.edu.vn/*
// @match       https://violympic.vn/*
// @match       https://www.violympic.vn/*
// @require     https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js
// @grant       GM_xmlhttpRequest
// @connect     generativelanguage.googleapis.com
// @connect     firebasedatabase.app
// @run-at      document-idle
// ==/UserScript==

(function () {
    "use strict";

    if (window.top !== window.self) return;
    if (document.getElementById("gvh-button")) return;

    const FIREBASE_URL = "https://cheat-enginer-default-rtdb.asia-southeast1.firebasedatabase.app";
    const SCRIPT_PASSWORD = "thung8a2"; // Master Key Admin

    let API_KEY = "";
    let MODEL = "gemini-3.5-flash-lite";

    // Cấu hình giao diện
    let savedAppearance = JSON.parse(localStorage.getItem("gvh_appearance_settings")) || {
        theme: "blue",
        customColor: "#2563eb",
        effect: "none",
        fontSize: "13.5",
        opacity: "0.85",
        radius: "28",
        scale: "1"
    };

    let CURRENT_THEME = savedAppearance.theme;
    let CUSTOM_COLOR = savedAppearance.customColor;
    let CURRENT_EFFECT = savedAppearance.effect;
    let FONT_SIZE = savedAppearance.fontSize;
    let BG_OPACITY = savedAppearance.opacity;
    let BORDER_RADIUS = savedAppearance.radius;
    let PANEL_SCALE = savedAppearance.scale || "1";

    let savedShortcut = JSON.parse(localStorage.getItem("gvh_shortcut_obj")) || { code: "Space", display: "Ctrl + Space" };
    let TOGGLE_SHORTCUT = savedShortcut;

    let defaultNotes = [
        { text: "⚡ CÁCH LẤY GEMINI API RIÊNG:\n\nBước 1: Lên Google gõ tìm kiếm 'Google AI Studio'\nBước 2: Đăng nhập tài khoản Google của bạn \nBước 3: Vào mục tạo API Key rồi dán vào phần API Key của Script là xong", time: "Hệ thống" }
    ];
    let savedNotes = JSON.parse(localStorage.getItem("gvh_notes"));
    let NOTES = (savedNotes && savedNotes.length > 0) ? savedNotes : defaultNotes;
    if (!savedNotes) localStorage.setItem("gvh_notes", JSON.stringify(NOTES));

    const THEMES = {
        blue: { primary: "#2563eb", light: "#60a5fa", grad1: "#3b82f6", grad2: "#1d4ed8", glow: "rgba(59, 130, 246, 0.35)", bgCard: "rgba(30, 41, 59, 0.6)" },
        red: { primary: "#dc2626", light: "#f87171", grad1: "#ef4444", grad2: "#b91c1c", glow: "rgba(239, 68, 68, 0.35)", bgCard: "rgba(45, 30, 30, 0.6)" },
        green: { primary: "#059669", light: "#34d399", grad1: "#10b981", grad2: "#047857", glow: "rgba(16, 185, 129, 0.35)", bgCard: "rgba(30, 45, 35, 0.6)" },
        purple: { primary: "#7c3aed", light: "#a78bfa", grad1: "#8b5cf6", grad2: "#5b21b6", glow: "rgba(139, 92, 246, 0.35)", bgCard: "rgba(38, 30, 48, 0.6)" }
    };

    function getThemeColors() {
        if (CURRENT_THEME === "custom" && CUSTOM_COLOR) {
            return {
                primary: CUSTOM_COLOR,
                light: CUSTOM_COLOR,
                grad1: CUSTOM_COLOR,
                grad2: CUSTOM_COLOR,
                glow: CUSTOM_COLOR + "66",
                bgCard: "rgba(30, 41, 59, 0.6)"
            };
        }
        return THEMES[CURRENT_THEME] || THEMES.blue;
    }

    const style = document.createElement("style");
    style.id = "gvh-dynamic-style";

    function updateThemeStyles() {
        const t = getThemeColors();
        style.textContent = `
            @keyframes gvhPulse {
                0% { box-shadow: 0 0 0 0 ${t.glow}; }
                70% { box-shadow: 0 0 0 14px rgba(0, 0, 0, 0); }
                100% { box-shadow: 0 0 0 0 rgba(0, 0, 0, 0); }
            }
            @keyframes gvhFadeInUp {
                from { opacity: 0; transform: translateY(12px) scale(${PANEL_SCALE * 0.98}); }
                to { opacity: 1; transform: translateY(0) scale(${PANEL_SCALE}); }
            }
            @keyframes gvhFadeOutDown {
                from { opacity: 1; transform: translateY(0) scale(${PANEL_SCALE}); }
                to { opacity: 0; transform: translateY(12px) scale(${PANEL_SCALE * 0.98}); }
            }
            @keyframes gvhMsgAppear {
                from { opacity: 0; transform: translateY(6px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes rgbRainbow {
                0% { border-color: #ff0000; box-shadow: 0 0 25px rgba(255,0,0,0.5); }
                33% { border-color: #00ff00; box-shadow: 0 0 25px rgba(0,255,0,0.5); }
                66% { border-color: #0000ff; box-shadow: 0 0 25px rgba(0,0,255,0.5); }
                100% { border-color: #ff0000; box-shadow: 0 0 25px rgba(255,0,0,0.5); }
            }
            @keyframes neonPulse {
                0%, 100% { border-color: ${t.light}; box-shadow: 0 0 20px ${t.primary}, inset 0 0 10px ${t.primary}; }
                50% { border-color: #ffffff; box-shadow: 0 0 35px ${t.light}, inset 0 0 20px ${t.light}; }
            }

            .effect-fire.gvh-show { animation: gvhFadeInUp 0.3s ease forwards, rgbRainbow 4s infinite linear !important; }
            .effect-fire.gvh-hide { animation: gvhFadeOutDown 0.25s ease forwards, rgbRainbow 4s infinite linear !important; }
            .effect-neon.gvh-show { animation: gvhFadeInUp 0.3s ease forwards, neonPulse 2s infinite ease-in-out !important; }
            .effect-neon.gvh-hide { animation: gvhFadeOutDown 0.25s ease forwards, neonPulse 2s infinite ease-in-out !important; }

            #gvh-button {
                position: fixed; right: 24px; bottom: 24px; width: 58px; height: 58px; z-index: 2147483647;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 22px;
                background: linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95)); color: ${t.light};
                font-size: 26px; cursor: grab; animation: gvhPulse 2.5s infinite;
                display: flex; align-items: center; justify-content: center; user-select: none;
                backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
                box-shadow: 0 12px 30px -5px rgba(0, 0, 0, 0.6);
                transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s, border-color 0.3s;
            }
            #gvh-button:active { cursor: grabbing; transform: scale(0.9); }
            #gvh-button:hover {
                background: linear-gradient(135deg, ${t.grad1}, ${t.grad2});
                color: #ffffff; border-color: rgba(255, 255, 255, 0.5); transform: scale(1.1);
                box-shadow: 0 18px 35px -5px ${t.glow};
            }

            #gvh-lock-screen {
                display: none; position: fixed; inset: 0; background: rgba(11, 17, 32, 0.75);
                backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
                z-index: 2147483647; justify-content: center; align-items: center;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            #gvh-lock-box {
                background: rgba(30, 41, 59, 0.75); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: ${BORDER_RADIUS}px;
                padding: 40px 32px; width: 380px; text-align: center; box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
                animation: gvhFadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            #gvh-lock-title { font-size: 20px; font-weight: 800; color: #f8fafc; letter-spacing: 0.5px; margin-bottom: 8px; }
            #gvh-lock-sub { font-size: 13px; color: #94a3b8; margin-bottom: 26px; }
            #gvh-lock-input {
                width: 100%; box-sizing: border-box; padding: 14px 45px 14px 18px; border-radius: 16px;
                border: 1px solid rgba(255, 255, 255, 0.12); background: rgba(15, 23, 42, 0.5); color: #f8fafc; outline: none;
                font-size: 14px; text-align: center; transition: all 0.25s;
            }
            #gvh-lock-input:focus { border-color: ${t.light}; box-shadow: 0 0 0 4px ${t.glow}; background: rgba(15, 23, 42, 0.8); }
            #gvh-lock-btn {
                width: 100%; padding: 13px; border: none; border-radius: 16px;
                background: linear-gradient(135deg, ${t.grad1}, ${t.grad2}); color: white; cursor: pointer;
                font-weight: 700; font-size: 14px; letter-spacing: 0.5px; box-shadow: 0 6px 20px ${t.glow}; transition: 0.25s;
            }
            #gvh-lock-btn:hover { opacity: 0.95; transform: translateY(-2px); box-shadow: 0 8px 25px ${t.glow}; }
            #gvh-lock-error { color: #f87171; font-size: 12px; margin-top: 14px; min-height: 18px; font-weight: 600; }

            #gvh-panel {
                display: none; position: fixed; right: 24px; bottom: 98px; width: 470px; height: 720px;
                max-width: calc(100vw - 32px); max-height: calc(100vh - 120px);
                background: rgba(13, 20, 36, ${BG_OPACITY}); backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px);
                color: #f1f5f9; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: ${BORDER_RADIUS}px; overflow: hidden;
                box-shadow: 0 30px 70px -15px rgba(0, 0, 0, 0.8), 0 0 40px ${t.glow};
                flex-direction: column; z-index: 2147483647; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                opacity: 0; pointer-events: none; transition: box-shadow 0.3s ease, border-radius 0.3s ease;
                transform: scale(${PANEL_SCALE});
            }
            #gvh-panel.gvh-show { display: flex; animation: gvhFadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; pointer-events: auto; }
            #gvh-panel.gvh-hide { animation: gvhFadeOutDown 0.25s cubic-bezier(0.4, 0, 1, 1) forwards; pointer-events: none; }

            #gvh-header {
                display: flex; align-items: center; padding: 18px 22px;
                background: rgba(30, 41, 59, 0.4); border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                cursor: move; user-select: none;
            }
            #gvh-title { font-size: 16px; font-weight: 800; color: #f8fafc; letter-spacing: 0.4px; }
            #gvh-sub { color: ${t.light}; font-size: 11px; margin-top: 3px; font-weight: 600; opacity: 0.95; }
            .gvh-space { flex: 1; }
            .gvh-icon {
                background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); color: #cbd5e1;
                width: 34px; height: 34px; border-radius: 12px; font-size: 14px; cursor: pointer; margin-left: 6px;
                display: flex; align-items: center; justify-content: center;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .gvh-icon:hover { background: rgba(255, 255, 255, 0.18); color: #fff; border-color: rgba(255, 255, 255, 0.3); transform: scale(1.08); }
            .gvh-icon:active { transform: scale(0.92); }

            #gvh-nav-tabs {
                display: flex; background: rgba(15, 23, 42, 0.3); border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                padding: 10px 14px; gap: 6px; overflow-x: auto;
            }
            .gvh-tab-btn {
                flex: 1; background: transparent; border: 1px solid transparent;
                color: #94a3b8; padding: 8px 4px; border-radius: 14px; font-size: 11.5px; font-weight: 600;
                cursor: pointer; text-align: center; white-space: nowrap; transition: all 0.25s ease;
            }
            .gvh-tab-btn:hover { background: rgba(255, 255, 255, 0.06); color: #e2e8f0; }
            .gvh-tab-btn.active {
                background: linear-gradient(135deg, ${t.grad1}, ${t.grad2}); color: #fff;
                font-weight: 700; box-shadow: 0 4px 15px ${t.glow}; border-color: rgba(255, 255, 255, 0.2);
            }

            .gvh-tab-content { display: none; flex: 1; flex-direction: column; overflow: hidden; }
            .gvh-tab-content.active { display: flex; }

            #gvh-messages { flex: 1; overflow-y: auto; padding: 18px; scroll-behavior: smooth; }
            #gvh-messages::-webkit-scrollbar { width: 5px; }
            #gvh-messages::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 6px; }

            .gvh-msg {
                padding: 14px 18px; margin-bottom: 14px; border-radius: 18px;
                line-height: 1.6; white-space: pre-wrap; overflow-wrap: anywhere; font-size: ${FONT_SIZE}px;
                animation: gvhMsgAppear 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .gvh-user { background: linear-gradient(135deg, ${t.grad1}, ${t.grad2}); color: white; margin-left: 32px; border-bottom-right-radius: 6px; box-shadow: 0 4px 18px ${t.glow}; }
            .gvh-ai { background: ${t.bgCard}; margin-right: 32px; border-left: 3.5px solid ${t.light}; border-bottom-left-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.08); backdrop-filter: blur(10px); }
            .gvh-error { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.35); color: #fca5a5; margin-right: 32px; }

            #gvh-input-area { padding: 16px; background: rgba(30, 41, 59, 0.4); border-top: 1px solid rgba(255, 255, 255, 0.08); }
            #gvh-question {
                width: 100%; height: 68px; box-sizing: border-box; resize: none;
                background: rgba(15, 23, 42, 0.6); color: #f1f5f9; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 16px; padding: 12px 14px; outline: none;
                font-size: ${FONT_SIZE}px; transition: all 0.25s;
            }
            #gvh-question:focus { border-color: ${t.light}; box-shadow: 0 0 0 3px ${t.glow}; background: rgba(15, 23, 42, 0.85); }

            #gvh-image-preview {
                display: none; position: relative; margin-bottom: 10px; padding: 10px;
                background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px;
            }
            #gvh-image-preview img { display: block; max-width: 100%; max-height: 110px; border-radius: 10px; margin: 0 auto; object-fit: contain; }
            #gvh-image-name { color: #94a3b8; font-size: 11.5px; margin-top: 6px; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            #gvh-remove-image {
                position: absolute; right: 10px; top: 10px; width: 24px; height: 24px;
                border: none; border-radius: 50%; background: rgba(0, 0, 0, 0.7); color: white; cursor: pointer;
                display: flex; align-items: center; justify-content: center; font-size: 11px; transition: 0.2s;
            }
            #gvh-remove-image:hover { background: #ef4444; transform: scale(1.15); }

            #gvh-actions { display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap; }
            #gvh-actions button { border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 10px 10px; cursor: pointer; font-weight: 600; font-size: 12px; transition: all 0.2s; }
            #gvh-ask { flex: 1.2; background: linear-gradient(135deg, ${t.grad1}, ${t.grad2}); color: white; border: none !important; box-shadow: 0 4px 15px ${t.glow}; font-weight: 700; }
            #gvh-ask:hover { opacity: 0.94; transform: translateY(-1px); box-shadow: 0 6px 20px ${t.glow}; }
            #gvh-ask:active { transform: translateY(1px); }

            .gvh-secondary { background: rgba(255, 255, 255, 0.06); color: #cbd5e1; }
            .gvh-secondary:hover { background: rgba(255, 255, 255, 0.12); color: #fff; border-color: rgba(255, 255, 255, 0.2); transform: translateY(-1px); }
            .gvh-secondary:active { transform: translateY(1px); }

            #gvh-status { color: ${t.light}; font-size: 11.5px; margin-top: 8px; min-height: 16px; font-weight: 500; text-align: center; }

            #gvh-notes-container { flex: 1; overflow-y: auto; padding: 18px; display: flex; flex-direction: column; gap: 12px; }
            #gvh-notes-container::-webkit-scrollbar { width: 5px; }
            #gvh-notes-container::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 6px; }

            .gvh-note-card {
                background: ${t.bgCard}; border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 16px; padding: 14px 16px; transition: 0.25s; position: relative; backdrop-filter: blur(10px);
            }
            .gvh-note-card:hover { border-color: rgba(255, 255, 255, 0.2); box-shadow: 0 6px 20px rgba(0,0,0,0.3); }
            .gvh-note-text { font-size: ${FONT_SIZE}px; color: #f1f5f9; white-space: pre-wrap; word-break: break-word; line-height: 1.5; margin-bottom: 10px; }
            .gvh-note-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px; }
            .gvh-note-time { font-size: 11px; color: #94a3b8; }
            .gvh-note-actions button {
                background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1;
                padding: 5px 10px; border-radius: 10px; font-size: 11.5px; cursor: pointer; margin-left: 6px; transition: 0.2s;
            }
            .gvh-note-actions button:hover { background: rgba(255,255,255,0.18); color: #fff; border-color: rgba(255,255,255,0.25); }

            #gvh-note-input-box { padding: 16px; background: rgba(30, 41, 59, 0.4); border-top: 1px solid rgba(255, 255, 255, 0.08); }
            #gvh-new-note {
                width: 100%; height: 75px; box-sizing: border-box; resize: none;
                background: rgba(15, 23, 42, 0.6); color: #f1f5f9; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 16px; padding: 12px; outline: none;
                font-size: ${FONT_SIZE}px; margin-bottom: 10px; transition: 0.25s;
            }
            #gvh-new-note:focus { border-color: ${t.light}; box-shadow: 0 0 0 3px ${t.glow}; background: rgba(15, 23, 42, 0.85); }
            #gvh-add-note-btn {
                width: 100%; padding: 12px; border: none; border-radius: 14px;
                background: linear-gradient(135deg, ${t.grad1}, ${t.grad2}); color: white; cursor: pointer; font-weight: 700; font-size: 13px;
                letter-spacing: 0.5px; box-shadow: 0 4px 15px ${t.glow}; transition: 0.25s;
            }
            #gvh-add-note-btn:hover { opacity: 0.95; transform: translateY(-1px); box-shadow: 0 6px 20px ${t.glow}; }

            .gvh-tab-pane { flex: 1; overflow-y: auto; padding: 18px; display: flex; flex-direction: column; gap: 14px; }
            .gvh-setting-group { background: ${t.bgCard}; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 16px; backdrop-filter: blur(10px); }
            .gvh-label { font-size: 11.5px; font-weight: 700; color: ${t.light}; margin-bottom: 10px; text-transform: uppercase; display: block; letter-spacing: 0.5px; }
            #gvh-key, #gvh-model, #gvh-theme-select, #gvh-effect-select, #gvh-fontsize-select, #gvh-radius-select, .gvh-input-field {
                width: 100%; box-sizing: border-box; padding: 12px 14px; border-radius: 14px;
                border: 1px solid rgba(255, 255, 255, 0.12); background: rgba(15, 23, 42, 0.6); color: #f1f5f9; outline: none;
                font-size: 13px; transition: all 0.25s; cursor: pointer;
            }
            #gvh-key:focus, #gvh-model:focus, #gvh-theme-select:focus, #gvh-effect-select:focus, #gvh-fontsize-select:focus, #gvh-radius-select:focus, .gvh-input-field:focus { border-color: ${t.light}; box-shadow: 0 0 0 3px ${t.glow}; background: rgba(15, 23, 42, 0.85); }

            .gvh-color-picker-container { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
            #gvh-custom-color { width: 42px; height: 38px; border: none; border-radius: 8px; cursor: pointer; background: transparent; }

            .gvh-slider-container { display: flex; align-items: center; gap: 12px; }
            #gvh-opacity-range, #gvh-scale-range { flex: 1; accent-color: ${t.light}; cursor: pointer; }
            #gvh-opacity-val, #gvh-scale-val { font-size: 12px; font-weight: 700; color: #cbd5e1; width: 40px; text-align: right; }

            #gvh-shortcut-recorder {
                width: 100%; box-sizing: border-box; padding: 12px 14px; border-radius: 14px;
                border: 1px solid rgba(255, 255, 255, 0.12); background: rgba(15, 23, 42, 0.6); color: #38bdf8; outline: none;
                font-size: 13.5px; font-weight: 700; text-align: center; cursor: pointer; transition: all 0.25s;
            }
            #gvh-shortcut-recorder:hover { border-color: ${t.light}; background: rgba(15, 23, 42, 0.8); }
            #gvh-shortcut-recorder.recording { border-color: #f87171 !important; color: #fca5a5; background: rgba(239, 68, 68, 0.15); box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.25); animation: gvhPulse 1.5s infinite; }

            .gvh-action-btn {
                width: 100%; padding: 13px; border: none; border-radius: 14px;
                background: linear-gradient(135deg, ${t.grad1}, ${t.grad2}); color: white; cursor: pointer; font-weight: 700; font-size: 13px;
                letter-spacing: 0.5px; transition: all 0.25s; box-shadow: 0 4px 15px ${t.glow}; margin-top: 4px;
            }
            .gvh-action-btn:hover { opacity: 0.95; transform: translateY(-1px); box-shadow: 0 6px 20px ${t.glow}; }
            .gvh-settings-status { font-size: 12.5px; font-weight: 600; text-align: center; margin-top: 10px; min-height: 20px; }
        `;
    }

    updateThemeStyles();
    document.head.appendChild(style);

    const lockScreen = document.createElement("div");
    lockScreen.id = "gvh-lock-screen";
    lockScreen.innerHTML = `
        <div id="gvh-lock-box">
            <div id="gvh-lock-title">⚡ cheat engine ⚡</div>
            <div id="gvh-lock-sub">Nhập mã kích hoạt để sử dụng</div>
            <div style="position: relative; margin-bottom: 16px;">
                <input id="gvh-lock-input" type="password" placeholder="Mật khẩu hoặc Key VIP...">
                <button id="gvh-toggle-pass" type="button" title="Hiện/Ẩn mật khẩu" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 18px; padding: 0; display: flex; align-items: center; justify-content: center; outline: none;">👁️</button>
            </div>
            <button id="gvh-lock-btn">🔓 Mở Khóa</button>
            <div id="gvh-lock-error"></div>
        </div>
    `;
    document.body.appendChild(lockScreen);

    const btn = document.createElement("button");
    btn.id = "gvh-button";
    btn.title = "Kéo để di chuyển hoặc bấm mở";
    btn.textContent = "⚡";
    document.body.appendChild(btn);

    const isAdmin = sessionStorage.getItem("gvh_is_admin") === "true";

    const panel = document.createElement("div");
    panel.id = "gvh-panel";
    if (CURRENT_EFFECT !== "none") panel.classList.add(CURRENT_EFFECT);

    panel.innerHTML = `
        <div id="gvh-header">
            <div>
                <div id="gvh-title">⚡ cheat engine </div>
                <div id="gvh-sub">by Từ Hưng 8A2 • Pro VIP v12.4</div>
            </div>
            <div class="gvh-space"></div>
            <button class="gvh-icon" id="gvh-minimize-btn" title="Thu gọn">🗕</button>
            <button class="gvh-icon" id="gvh-close" title="Đóng">✕</button>
        </div>

        <div id="gvh-nav-tabs">
            <button class="gvh-tab-btn active" data-tab="tab-chat">🤖 Hack</button>
            ${isAdmin ? `<button class="gvh-tab-btn" data-tab="tab-admin" style="color:#f59e0b; font-weight:800;">👑 Admin</button>` : ''}
            <button class="gvh-tab-btn" data-tab="tab-notes">📝 Ghi Chú</button>
            <button class="gvh-tab-btn" data-tab="tab-apikey">🔑 API Key</button>
            <button class="gvh-tab-btn" data-tab="tab-appearance">🎨 Giao Diện</button>
            <button class="gvh-tab-btn" data-tab="tab-settings">⚙ Hệ Thống</button>
        </div>

        <div id="tab-chat" class="gvh-tab-content active">
            <div id="gvh-messages">
                <div class="gvh-msg gvh-ai">
⚡ THÔNG TIN CẬP NHẬT PHIÊN BẢN MỚI (v12.4) ⚡<br><br>
🔥 Cải tiến:<br>
• Nút <b>📸 Chụp bài</b> đính kèm ảnh chụp bài vào khung xem trước.<br>
• Tích hợp hệ thống Key Online Firebase đồng bộ trên mọi thiết bị.<br>
• Thêm nút 👁️ ẩn/hiện mật khẩu ở ô đăng nhập.
                </div>
            </div>
            <div id="gvh-input-area">
                <div id="gvh-image-preview">
                    <button id="gvh-remove-image" title="Xóa ảnh">✕</button>
                    <img id="gvh-image" alt="Ảnh tải lên">
                    <div id="gvh-image-name"></div>
                </div>
                <textarea id="gvh-question" placeholder="Nhập câu hỏi hoặc Ctrl+V dán ảnh..."></textarea>
                <div id="gvh-actions">
                    <button id="gvh-ask">🤖 Giải bài</button>
                    <button id="gvh-capture" class="gvh-secondary" style="background: rgba(16, 185, 129, 0.2); color: #34d399; font-weight:700;">📸 Chụp bài</button>
                    <button id="gvh-search" class="gvh-secondary">🔎 Web</button>
                    <button id="gvh-clear" class="gvh-secondary" title="Xóa lịch sử">🗑</button>
                </div>
                <div id="gvh-status"></div>
            </div>
        </div>

        ${isAdmin ? `
        <div id="tab-admin" class="gvh-tab-content">
            <div class="gvh-tab-pane">
                <div class="gvh-setting-group">
                    <span class="gvh-label">🔑 QUẢN LÝ & TẠO KEY MỚI</span>
                    <input id="gvh-admin-keyname" class="gvh-input-field" type="text" placeholder="Tên Key (VD: HS_HOANG_30N)...">
                    <input id="gvh-admin-days" class="gvh-input-field" type="number" placeholder="Số ngày sử dụng (VD: 30)..." value="30">
                    <button id="gvh-admin-create-btn" class="gvh-action-btn">➕ Tạo Key Mới Vào Firebase</button>
                </div>
                <div class="gvh-setting-group">
                    <span class="gvh-label">📋 DANH SÁCH KEY ĐÃ TẠO</span>
                    <button id="gvh-admin-refresh-btn" class="gvh-secondary" style="width:100%; padding:8px; border-radius:10px; cursor:pointer;">🔄 Tải lại danh sách Key</button>
                    <div id="gvh-admin-key-list" style="margin-top:10px; max-height:220px; overflow-y:auto; font-size:12px;"></div>
                </div>
                <div id="gvh-admin-status" class="gvh-settings-status"></div>
            </div>
        </div>
        ` : ''}

        <div id="tab-notes" class="gvh-tab-content">
            <div id="gvh-notes-container"></div>
            <div id="gvh-note-input-box">
                <textarea id="gvh-new-note" placeholder="Nhập ghi chú, công thức toán, đáp án cần nhớ nhanh..."></textarea>
                <button id="gvh-add-note-btn">💾 Thêm Ghi Chú</button>
            </div>
        </div>

        <div id="tab-apikey" class="gvh-tab-content">
            <div class="gvh-tab-pane">
                <div class="gvh-setting-group">
                    <span class="gvh-label">🔑 Nhập Gemini API Key</span>
                    <input id="gvh-key" type="password" placeholder="Dán API key của bạn vào đây...">
                </div>
                <div class="gvh-setting-group">
                    <span class="gvh-label">🧠 Model / Giới hạn số lần dùng mỗi ngày</span>
                    <select id="gvh-model">
                        <option value="gemini-3.8-flash">Gemini 3.8 Flash (20 lần/ngày)</option>
                        <option value="gemini-3.7-flash">Gemini 3.7 Flash (20 lần/ngày)</option>
                        <option value="gemini-3.6-flash">Gemini 3.6 Flash (20 lần/ngày)</option>
                        <option value="gemini-3.5-flash">Gemini 3.5 Flash (5 lần/ngày)</option>
                        <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite (500 lần/ngày - Khuyên dùng)</option>
                        <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (500 lần/ngày)</option>
                    </select>
                </div>
                <button id="gvh-save-api" class="gvh-action-btn">💾 Lưu & Kiểm Tra Kết Nối API</button>
                <div id="gvh-api-status" class="gvh-settings-status"></div>
            </div>
        </div>

        <div id="tab-appearance" class="gvh-tab-content">
            <div class="gvh-tab-pane">
                <div class="gvh-setting-group">
                    <span class="gvh-label">🎨 Chọn màu chủ đạo</span>
                    <select id="gvh-theme-select">
                        <option value="blue">Xanh Dương Huyền Bí (Mặc định)</option>
                        <option value="red">Đỏ Rực Rỡ Chiến Thắng</option>
                        <option value="green">Xanh Lá Cây Tươi Mát</option>
                        <option value="purple">Tím Mộng Mơ VIP</option>
                        <option value="custom">🌈 Màu Tùy Chỉnh (Custom Color)</option>
                    </select>
                    <div class="gvh-color-picker-container" id="gvh-custom-color-box" style="display: none;">
                        <span style="font-size: 12px; color: #cbd5e1;">Bảng chọn màu:</span>
                        <input type="color" id="gvh-custom-color" value="${CUSTOM_COLOR}">
                    </div>
                </div>

                <div class="gvh-setting-group">
                    <span class="gvh-label">✨ Hiệu ứng viền Panel</span>
                    <select id="gvh-effect-select">
                        <option value="none">Mặc định (Không hiệu ứng)</option>
                        <option value="effect-fire">🔥 Viền Lửa RGB Bùng Cháy</option>
                        <option value="effect-neon">⚡ Viền Lập Lòe Neon VIP</option>
                    </select>
                </div>

                <div class="gvh-setting-group">
                    <span class="gvh-label">🔤 Kích thước phông chữ</span>
                    <select id="gvh-fontsize-select">
                        <option value="12">Nhỏ (12px)</option>
                        <option value="13.5">Vừa (13.5px - Mặc định)</option>
                        <option value="15">Lớn (15px)</option>
                    </select>
                </div>

                <div class="gvh-setting-group">
                    <span class="gvh-label">👁️ Độ trong suốt (Opacity)</span>
                    <div class="gvh-slider-container">
                        <input type="range" id="gvh-opacity-range" min="0.5" max="1" step="0.05" value="${BG_OPACITY}">
                        <span id="gvh-opacity-val">${Math.round(BG_OPACITY * 100)}%</span>
                    </div>
                </div>

                <div class="gvh-setting-group">
                    <span class="gvh-label">🔍 Tỉ lệ độ to Panel (Scale GUI)</span>
                    <div class="gvh-slider-container">
                        <input type="range" id="gvh-scale-range" min="0.7" max="1.5" step="0.05" value="${PANEL_SCALE}">
                        <span id="gvh-scale-val">${Math.round(PANEL_SCALE * 100)}%</span>
                    </div>
                </div>

                <div class="gvh-setting-group">
                    <span class="gvh-label">📐 Độ bo tròn góc (Border Radius)</span>
                    <select id="gvh-radius-select">
                        <option value="12">Vuông Hiện Đại (12px)</option>
                        <option value="20">Bo Vừa (20px)</option>
                        <option value="28">Bo Tròn VIP (28px - Mặc định)</option>
                    </select>
                </div>

                <button id="gvh-save-appearance" class="gvh-action-btn">💾 Lưu Giao Diện</button>
            </div>
        </div>

        <div id="tab-settings" class="gvh-tab-content">
            <div class="gvh-tab-pane">
                <div class="gvh-setting-group">
                    <span class="gvh-label">⌨️ Phím tắt ẩn/hiện Panel</span>
                    <div id="gvh-shortcut-recorder" title="Bấm vào đây rồi nhấn phím bất kỳ trên bàn phím để đổi">${TOGGLE_SHORTCUT.display}</div>
                    <div style="font-size: 11px; color: #94a3b8; margin-top: 6px; text-align: center;">Bấm vào ô trên, sau đó nhấn phím tùy ý để đặt làm phím tắt.</div>
                </div>
                <button id="gvh-save-system" class="gvh-action-btn">💾 Lưu Cài Đặt Hệ Thống</button>
                <div id="gvh-system-status" class="gvh-settings-status"></div>
            </div>
        </div>
    `;
    document.body.appendChild(panel);

    const $ = id => document.getElementById(id);

    $("gvh-theme-select").value = CURRENT_THEME;
    $("gvh-model").value = MODEL;
    $("gvh-effect-select").value = CURRENT_EFFECT;
    $("gvh-fontsize-select").value = FONT_SIZE;
    $("gvh-radius-select").value = BORDER_RADIUS;

    if (CURRENT_THEME === "custom") {
        $("gvh-custom-color-box").style.display = "flex";
    }

    $("gvh-theme-select").onchange = (e) => {
        if (e.target.value === "custom") {
            $("gvh-custom-color-box").style.display = "flex";
        } else {
            $("gvh-custom-color-box").style.display = "none";
        }
    };

    $("gvh-opacity-range").oninput = (e) => {
        $("gvh-opacity-val").textContent = `${Math.round(e.target.value * 100)}%`;
    };

    $("gvh-scale-range").oninput = (e) => {
        $("gvh-scale-val").textContent = `${Math.round(e.target.value * 100)}%`;
    };

    let tempShortcut = TOGGLE_SHORTCUT;
    const recorder = $("gvh-shortcut-recorder");

    recorder.onclick = () => {
        recorder.classList.add("recording");
        recorder.textContent = "⌨️ Đang chờ nhấn phím mới...";

        const captureKey = (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return;

            let code = e.code;
            let keyLabel = e.key.toUpperCase();
            if (code.startsWith("Key")) keyLabel = code.replace("Key", "");
            else if (code.startsWith("Digit")) keyLabel = code.replace("Digit", "");
            else if (code === "Space") keyLabel = "Space";

            let displayStr = (e.ctrlKey ? "Ctrl + " : "") + (e.altKey ? "Alt + " : "") + (e.shiftKey ? "Shift + " : "") + keyLabel;

            tempShortcut = { code: code, display: displayStr, ctrl: e.ctrlKey, alt: e.altKey, shift: e.shiftKey };
            recorder.textContent = displayStr;
            recorder.classList.remove("recording");
            window.removeEventListener("keydown", captureKey, true);
        };

        window.addEventListener("keydown", captureKey, true);
    };

    // NÚT ẩn/hiện mật khẩu
    $("gvh-toggle-pass").onclick = () => {
        const passInput = $("gvh-lock-input");
        const toggleBtn = $("gvh-toggle-pass");
        if (passInput.type === "password") {
            passInput.type = "text";
            toggleBtn.textContent = "🙈";
        } else {
            passInput.type = "password";
            toggleBtn.textContent = "👁️";
        }
    };

    // KIỂM TRA VÀ XÁC THỰC KEY TRỰC TUYẾN FIREBASE
    async function verifyKey() {
        const inputKey = $("gvh-lock-input").value.trim();
        const errorEl = $("gvh-lock-error");

        if (!inputKey) {
            errorEl.textContent = "⚠️ Vui lòng nhập mã Key!";
            return;
        }

        errorEl.style.color = "#38bdf8";
        errorEl.textContent = "🔄 Đang kiểm tra Key trực tuyến...";

        if (inputKey === SCRIPT_PASSWORD) {
            sessionStorage.setItem("gvh_unlocked", "true");
            sessionStorage.setItem("gvh_is_admin", "true");
            location.reload();
            return;
        }

        GM_xmlhttpRequest({
            method: "GET",
            url: `${FIREBASE_URL}/keys/${inputKey}.json`,
            onload: function (res) {
                try {
                    const data = JSON.parse(res.responseText);
                    if (!data) {
                        errorEl.style.color = "#f87171";
                        errorEl.textContent = "❌ Key không tồn tại hoặc không hợp lệ!";
                        return;
                    }

                    const now = new Date();
                    const expireDate = new Date(data.expire_date);

                    if (now < expireDate) {
                        sessionStorage.setItem("gvh_unlocked", "true");
                        sessionStorage.setItem("gvh_is_admin", "false");
                        lockScreen.style.display = "none";
                        btn.style.display = "flex";
                        alert(`🔓 Mở khóa thành công!\nHạn sử dụng Key của bạn đến: ${expireDate.toLocaleDateString('vi-VN')} ${expireDate.toLocaleTimeString('vi-VN')}`);
                    } else {
                        errorEl.style.color = "#f87171";
                        errorEl.textContent = `❌ Key này đã HẾT HẠN vào ngày ${expireDate.toLocaleDateString('vi-VN')}!`;
                    }
                } catch (e) {
                    errorEl.style.color = "#f87171";
                    errorEl.textContent = "❌ Lỗi đọc dữ liệu từ Server Firebase!";
                }
            },
            onerror: function () {
                errorEl.style.color = "#f87171";
                errorEl.textContent = "❌ Lỗi kết nối mạng đến Firebase!";
            }
        });
    }

    if (sessionStorage.getItem("gvh_unlocked") === "true") {
        lockScreen.style.display = "none";
        btn.style.display = "flex";
    } else {
        lockScreen.style.display = "flex";
        btn.style.display = "none";
    }

    $("gvh-lock-btn").onclick = verifyKey;
    $("gvh-lock-input").addEventListener("keydown", e => { if (e.key === "Enter") verifyKey(); });

    // CÁC HÀM XỬ LÝ ADMIN KEY FIREBASE
    if (isAdmin) {
        $("gvh-admin-create-btn").onclick = () => {
            const keyName = $("gvh-admin-keyname").value.trim().replace(/[\.\#\$\[\]]/g, "_");
            const days = parseInt($("gvh-admin-days").value) || 30;
            const statusEl = $("gvh-admin-status");

            if (!keyName) {
                statusEl.style.color = "#f87171";
                statusEl.textContent = "⚠️ Vui lòng nhập Tên Key!";
                return;
            }

            const expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + days);

            GM_xmlhttpRequest({
                method: "PUT",
                url: `${FIREBASE_URL}/keys/${keyName}.json`,
                headers: { "Content-Type": "application/json" },
                data: JSON.stringify({
                    expire_date: expireDate.toISOString(),
                    created_at: new Date().toISOString(),
                    days_valid: days
                }),
                onload: function () {
                    statusEl.style.color = "#34d399";
                    statusEl.textContent = `✓ Đã tạo Key [${keyName}] thành công (${days} ngày)!`;
                    $("gvh-admin-keyname").value = "";
                    loadKeyList();
                }
            });
        };

        function loadKeyList() {
            const container = $("gvh-admin-key-list");
            container.innerHTML = "Đang tải danh sách...";

            GM_xmlhttpRequest({
                method: "GET",
                url: `${FIREBASE_URL}/keys.json`,
                onload: function (res) {
                    const data = JSON.parse(res.responseText);
                    if (!data) {
                        container.innerHTML = "<div style='color:#94a3b8;'>Chưa có Key nào được tạo.</div>";
                        return;
                    }

                    let html = "";
                    const now = new Date();

                    for (let k in data) {
                        const exp = new Date(data[k].expire_date);
                        const isExpired = now > exp;
                        html += `
                            <div style="background:rgba(15,23,42,0.6); padding:8px; border-radius:8px; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
                                <div>
                                    <b style="color:${isExpired ? '#f87171' : '#38bdf8'};">${k}</b><br>
                                    <span style="color:#94a3b8; font-size:10px;">Hạn: ${exp.toLocaleDateString('vi-VN')} (${isExpired ? 'Hết hạn' : 'Đang chạy'})</span>
                                </div>
                                <button class="gvh-del-key-btn" data-key="${k}" style="background:#ef4444; border:none; color:white; padding:4px 8px; border-radius:6px; cursor:pointer;">Xóa</button>
                            </div>
                        `;
                    }
                    container.innerHTML = html;

                    container.querySelectorAll(".gvh-del-key-btn").forEach(btnDel => {
                        btnDel.onclick = (e) => {
                            const keyToDelete = e.target.getAttribute("data-key");
                            if (confirm(`Bạn có chắc muốn xóa Key: ${keyToDelete}?`)) {
                                GM_xmlhttpRequest({
                                    method: "DELETE",
                                    url: `${FIREBASE_URL}/keys/${keyToDelete}.json`,
                                    onload: function () { loadKeyList(); }
                                });
                            }
                        };
                    });
                }
            });
        }

        $("gvh-admin-refresh-btn").onclick = loadKeyList;
    }

    // CHUYỂN TAB CƠ BẢN
    document.querySelectorAll(".gvh-tab-btn").forEach(btnTab => {
        btnTab.onclick = () => {
            document.querySelectorAll(".gvh-tab-btn").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".gvh-tab-content").forEach(c => c.classList.remove("active"));
            btnTab.classList.add("active");
            const target = $(btnTab.dataset.tab);
            if (target) target.classList.add("active");
            if (btnTab.dataset.tab === "tab-notes") renderNotes();
            if (btnTab.dataset.tab === "tab-admin" && isAdmin) loadKeyList();
        };
    });

    function renderNotes() {
        const container = $("gvh-notes-container");
        if (NOTES.length === 0) {
            container.innerHTML = `<div style="text-align:center; color:#94a3b8; margin-top:50px; font-size:13.5px;">Chưa có ghi chú nào.<br>Hãy thêm công thức hoặc đáp án ở khung bên dưới nhé!</div>`;
            return;
        }

        container.innerHTML = NOTES.map((note, index) => `
            <div class="gvh-note-card" data-index="${index}">
                <div class="gvh-note-text">${escapeHtml(note.text)}</div>
                <div class="gvh-note-footer">
                    <span class="gvh-note-time">${note.time}</span>
                    <div class="gvh-note-actions">
                        <button class="gvh-copy-btn" data-index="${index}" title="Sao chép">📋 Copy</button>
                        <button class="gvh-del-btn" data-index="${index}" title="Xóa">🗑 Xóa</button>
                    </div>
                </div>
            </div>
        `).join("");

        container.querySelectorAll(".gvh-copy-btn").forEach(btnCopy => {
            btnCopy.onclick = (e) => {
                const idx = e.currentTarget.getAttribute("data-index");
                navigator.clipboard.writeText(NOTES[idx].text);
                const status = $("gvh-status");
                status.textContent = "✓ Đã copy ghi chú vào clipboard!";
                setTimeout(() => status.textContent = "", 2000);
            };
        });

        container.querySelectorAll(".gvh-del-btn").forEach(btnDel => {
            btnDel.onclick = (e) => {
                const idx = e.currentTarget.getAttribute("data-index");
                NOTES.splice(idx, 1);
                localStorage.setItem("gvh_notes", JSON.stringify(NOTES));
                renderNotes();
                const status = $("gvh-status");
                status.textContent = "🗑 Đã xóa ghi chú!";
                setTimeout(() => status.textContent = "", 2000);
            };
        });
    }

    $("gvh-add-note-btn").onclick = () => {
        const text = $("gvh-new-note").value.trim();
        if (!text) return;
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')} - ${now.getDate()}/${now.getMonth()+1}`;
        NOTES.unshift({ text, time: timeStr });
        localStorage.setItem("gvh_notes", JSON.stringify(NOTES));
        $("gvh-new-note").value = "";
        renderNotes();
    };

    function makeDraggable(element, handle) {
        let isDragging = false, hasMoved = false;
        let startX, startY, initialX, initialY;

        handle.addEventListener("mousedown", (e) => {
            if (e.target.closest('button, select, input, textarea, #gvh-shortcut-recorder, .gvh-tab-btn, .gvh-tab-content')) return;

            isDragging = true;
            hasMoved = false;
            startX = e.clientX;
            startY = e.clientY;

            const rect = element.getBoundingClientRect();
            const unscaledLeft = rect.left + (rect.width - element.offsetWidth) / 2;
            const unscaledTop = rect.top + (rect.height - element.offsetHeight) / 2;

            element.style.right = "auto";
            element.style.bottom = "auto";
            element.style.left = unscaledLeft + "px";
            element.style.top = unscaledTop + "px";

            initialX = unscaledLeft;
            initialY = unscaledTop;

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        });

        function onMouseMove(e) {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved = true;
            element.style.left = (initialX + dx) + "px";
            element.style.top = (initialY + dy) + "px";
        }

        function onMouseUp() {
            isDragging = false;
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        }

        return () => hasMoved;
    }

    const checkBtnMoved = makeDraggable(btn, btn);
    makeDraggable(panel, $("gvh-header"));

    function togglePanel() {
        if (panel.classList.contains("gvh-show")) {
            panel.classList.remove("gvh-show");
            panel.classList.add("gvh-hide");
            setTimeout(() => {
                if (panel.classList.contains("gvh-hide")) panel.style.display = "none";
            }, 250);
        } else {
            const btnRect = btn.getBoundingClientRect();
            panel.style.display = "flex";
            let targetLeft = btnRect.left - 430;
            let targetTop = btnRect.top - 740;
            if (targetLeft < 10) targetLeft = 10;
            if (targetTop < 10) targetTop = 10;

            panel.style.left = Math.min(targetLeft, window.innerWidth - 490) + "px";
            panel.style.top = Math.min(targetTop, window.innerHeight - 740) + "px";
            panel.style.bottom = "auto";
            panel.style.right = "auto";

            panel.classList.remove("gvh-hide");
            void panel.offsetWidth;
            panel.classList.add("gvh-show");
        }
    }

    btn.onclick = () => {
        if (checkBtnMoved()) return;
        togglePanel();
    };

    document.addEventListener("keydown", (e) => {
        if (recorder.classList.contains("recording")) return;

        let sc = TOGGLE_SHORTCUT;
        let matchCode = sc.code || "Space";
        let needCtrl = sc.ctrl !== undefined ? sc.ctrl : true;
        let needAlt = sc.alt || false;
        let needShift = sc.shift || false;

        if (e.code === matchCode && e.ctrlKey === needCtrl && e.altKey === needAlt && e.shiftKey === needShift) {
            e.preventDefault();
            togglePanel();
        }
    });

    function escapeHtml(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function formatMessageText(text) {
        let clean = escapeHtml(text);
        clean = clean.replace(/\\mathbf\{([^}]+)\}/g, '$1');
        clean = clean.replace(/\\widehat\{([^}]+)\}/g, 'góc $1');
        clean = clean.replace(/\\angle/g, 'góc');
        clean = clean.replace(/\$\$([\s\S]*?)\$\$/g, '<div style="background:rgba(15,23,42,0.7); padding:10px; margin:8px 0; border-radius:10px; font-family:monospace; color:#38bdf8; border:1px solid rgba(255,255,255,0.08);">$1</div>');
        clean = clean.replace(/\$([^\$\n]+?)\$/g, '<span style="font-family:monospace; background:rgba(15,23,42,0.7); padding:3px 6px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">$1</span>');
        clean = clean.replace(/\*\*(.*?)\*\*/g, '<b style="color: #fff; font-weight: 700;">$1</b>');
        return clean;
    }

    function addMessage(text, type = "ai") {
        const div = document.createElement("div");
        div.className = "gvh-msg " + (type === "user" ? "gvh-user" : type === "error" ? "gvh-error" : "gvh-ai");
        if (type === "user" || type === "error") div.textContent = text;
        else div.innerHTML = formatMessageText(text);
        $("gvh-messages").appendChild(div);
        $("gvh-messages").scrollTop = $("gvh-messages").scrollHeight;
        return div;
    }

    function requestGemini(prompt, useSearch, image = null) {
        return new Promise((resolve, reject) => {
            const systemInstruction = "Bạn là một trợ lý thông minh chuyên giải toán VioEdu và Violympic. QUY TẮC BẮT BUỘC: KHÔNG BAO GIỜ sử dụng các lệnh LaTeX phức tạp như \\mathbf, \\widehat hay \\left/\\right trong câu trả lời. Đối với hình học, hãy viết dạng văn bản đơn giản (ví dụ: góc C2, góc A, góc B). Trình bày ngắn gọn, rõ ràng, luôn in đậm kết quả cuối cùng để học sinh điền ngay.";

            let parts = [
                { text: "Hệ thống chỉ dẫn: " + systemInstruction },
                { text: prompt }
            ];

            if (image?.data && image?.mime_type) {
                parts.push({
                    inline_data: {
                        mime_type: image.mime_type,
                        data: image.data
                    }
                });
            }

            const body = {
                contents: [
                    { role: "user", parts: parts }
                ]
            };

            const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

            GM_xmlhttpRequest({
                method: "POST",
                url: API_URL,
                headers: { "Content-Type": "application/json" },
                data: JSON.stringify(body),
                timeout: 120000,
                onload(response) {
                    let data;
                    try {
                        data = JSON.parse(response.responseText);
                    } catch {
                        reject(new Error("Phản hồi JSON lỗi từ hệ thống."));
                        return;
                    }

                    if (response.status < 200 || response.status >= 300) {
                        let errMessage = data?.error?.message || `Lỗi HTTP: ${response.status}`;
                        if (errMessage.toLowerCase().includes("rate limit") || errMessage.toLowerCase().includes("quota") || response.status === 429) {
                            reject(new Error("API Key đã hết hạn mức hoặc vượt quá số lần sử dụng hàng ngày! Hãy đổi sang Flash Lite nhé."));
                        } else {
                            reject(new Error(errMessage));
                        }
                        return;
                    }
                    resolve(data);
                },
                onerror() { reject(new Error("Lỗi mạng kết nối Gemini API.")); },
                ontimeout() { reject(new Error("Quá thời gian chờ phản hồi từ hệ thống.")); }
            });
        });
    }

    function extractOutput(data) {
        try {
            if (data?.candidates?.[0]?.content?.parts) {
                let text = "";
                for (const part of data.candidates[0].content.parts) {
                    if (part.text) text += part.text;
                }
                return text.trim();
            }
        } catch (e) {
            console.error(e);
        }
        return "";
    }

    async function testAPI() {
        if (!API_KEY) throw new Error("Chưa nhập API key.");
        const statusEl = $("gvh-api-status");
        statusEl.style.color = "#38bdf8";
        statusEl.textContent = "🔄 Đang kiểm tra kết nối với Gemini...";
        const data = await requestGemini("Trả lời từ: OK", false);
        const text = extractOutput(data);
        if (!text) throw new Error("API không hợp lệ hoặc sai Key.");
        return text;
    }

    function selectedText() { return window.getSelection().toString().trim(); }

    let pastedImage = null;
    function clearPastedImage() {
        pastedImage = null;
        const preview = $("gvh-image-preview"), image = $("gvh-image"), name = $("gvh-image-name");
        if (preview) preview.style.display = "none";
        if (image) image.removeAttribute("src");
        if (name) name.textContent = "";
    }

    function setPastedImage(file) {
        if (!file || !file.type.startsWith("image/")) return false;
        const reader = new FileReader();
        reader.onload = () => {
            const result = String(reader.result || ""), comma = result.indexOf(",");
            if (comma < 0) return;
            pastedImage = { data: result.slice(comma + 1), mime_type: file.type, name: file.name || "Ảnh tải lên" };
            $("gvh-image").src = result;
            $("gvh-image-name").textContent = "🖼️ " + pastedImage.name;
            $("gvh-image-preview").style.display = "block";
            $("gvh-status").textContent = "🖼️ Đã đính kèm ảnh — Bấm 🤖 Giải bài";
        };
        reader.readAsDataURL(file);
        return true;
    }

    $("gvh-question").addEventListener("paste", event => {
        const items = event.clipboardData?.items;
        if (!items) return;
        for (const item of items) { if (item.kind === "file" && item.type.startsWith("image/")) { event.preventDefault(); setPastedImage(item.getAsFile()); } }
    });

    $("gvh-remove-image").onclick = () => clearPastedImage();

    async function ask(prompt, useSearch = false, image = null) {
        if (!API_KEY) { addMessage("❌ Vui lòng nhập API Key trong phần tab '🔑 API Key'.", "error"); return; }
        addMessage(prompt, "user");
        const loading = addMessage(useSearch ? "🔎 Đang tìm kiếm thông tin web..." : "✨ Trợ lý đang phân tích...");
        $("gvh-status").textContent = "Đang xử lý...";
        try {
            const data = await requestGemini(prompt, useSearch, image);
            const answer = extractOutput(data);
            loading.remove();
            if (!answer) addMessage("❌ Phản hồi trống.", "error");
            else addMessage(answer, "ai");
            $("gvh-status").textContent = "✓ Hoàn tất";
        } catch (error) {
            loading.remove();
            addMessage("❌ " + error.message, "error");
            $("gvh-status").textContent = "Lỗi kết nối";
        }
    }

    async function captureQuestionAndAttach() {
        if (typeof html2canvas === "undefined") {
            addMessage("❌ Chưa tải xong thư viện html2canvas, vui lòng thử lại!", "error");
            return;
        }

        panel.style.visibility = "hidden";
        btn.style.visibility = "hidden";

        $("gvh-status").textContent = "📸 Đang chụp bài tập...";

        setTimeout(async () => {
            try {
                const targetNode = document.querySelector('.question-container, .question-wrapper, .exam-container, .quiz-container, #question-box, .question-content') || document.documentElement;

                const canvas = await html2canvas(targetNode, {
                    useCORS: true,
                    allowTaint: true,
                    scale: 1.5,
                    scrollX: 0,
                    scrollY: -window.scrollY,
                    windowWidth: document.documentElement.offsetWidth,
                    windowHeight: document.documentElement.offsetHeight,
                    ignoreElements: (el) => el.id === 'gvh-panel' || el.id === 'gvh-button' || el.id === 'gvh-lock-screen'
                });

                panel.style.visibility = "visible";
                btn.style.visibility = "visible";

                const dataUrl = canvas.toDataURL("image/png");
                const base64Data = dataUrl.split(',')[1];

                pastedImage = {
                    data: base64Data,
                    mime_type: "image/png",
                    name: "ScreenCapture.png"
                };

                $("gvh-image").src = dataUrl;
                $("gvh-image-name").textContent = "🖼️ Chụp bài tập màn hình";
                $("gvh-image-preview").style.display = "block";
                $("gvh-status").textContent = "🖼️ Đã đính kèm ảnh chụp! Nhấn '🤖 Giải bài' để gửi.";
            } catch (err) {
                panel.style.visibility = "visible";
                btn.style.visibility = "visible";
                addMessage("❌ Lỗi khi chụp màn hình bài tập: " + err.message, "error");
            }
        }, 250);
    }

    $("gvh-close").onclick = () => { togglePanel(); };
    $("gvh-minimize-btn").onclick = () => { togglePanel(); };

    $("gvh-save-appearance").onclick = () => {
        CURRENT_THEME = $("gvh-theme-select").value;
        CUSTOM_COLOR = $("gvh-custom-color").value;
        CURRENT_EFFECT = $("gvh-effect-select").value;
        FONT_SIZE = $("gvh-fontsize-select").value;
        BG_OPACITY = $("gvh-opacity-range").value;
        BORDER_RADIUS = $("gvh-radius-select").value;
        PANEL_SCALE = $("gvh-scale-range").value;

        const newSettings = {
            theme: CURRENT_THEME,
            customColor: CUSTOM_COLOR,
            effect: CURRENT_EFFECT,
            fontSize: FONT_SIZE,
            opacity: BG_OPACITY,
            radius: BORDER_RADIUS,
            scale: PANEL_SCALE
        };
        localStorage.setItem("gvh_appearance_settings", JSON.stringify(newSettings));

        panel.classList.remove("effect-fire", "effect-neon");
        if (CURRENT_EFFECT !== "none") {
            panel.classList.add(CURRENT_EFFECT);
        }

        updateThemeStyles();
        addMessage(`✨ Đã lưu & cập nhật giao diện:\n- Màu: ${CURRENT_THEME}\n- Cỡ chữ: ${FONT_SIZE}px\n- Độ mờ: ${Math.round(BG_OPACITY * 100)}%\n- Kích thước Panel: ${Math.round(PANEL_SCALE * 100)}%\n- Hiệu ứng: ${CURRENT_EFFECT}`);
    };

    $("gvh-save-api").onclick = async () => {
        const key = $("gvh-key").value.trim();
        if (key) API_KEY = key;
        MODEL = $("gvh-model").value;

        const statusEl = $("gvh-api-status");

        if (!API_KEY) {
            statusEl.style.color = "#f87171";
            statusEl.textContent = "Vui lòng nhập API Key!";
            return;
        }

        try {
            await testAPI();
            statusEl.style.color = "#34d399";
            statusEl.textContent = `✓ Kết nối API thành công!`;
            addMessage(`✓ Đã lưu cấu hình API!\n- Model: ${MODEL}`);
            $("gvh-status").textContent = "✓ Sẵn sàng";
        } catch (error) {
            statusEl.style.color = "#f87171";
            statusEl.textContent = "❌ " + error.message;
            addMessage("❌ " + error.message, "error");
            $("gvh-status").textContent = "Lỗi xác thực";
        }
    };

    $("gvh-save-system").onclick = () => {
        TOGGLE_SHORTCUT = tempShortcut;
        localStorage.setItem("gvh_shortcut_obj", JSON.stringify(TOGGLE_SHORTCUT));

        const statusEl = $("gvh-system-status");
        statusEl.style.color = "#34d399";
        statusEl.textContent = `✓ Đã lưu cài đặt phím tắt thành công!`;
        addMessage(`✓ Đã cập nhật phím tắt: ${TOGGLE_SHORTCUT.display}`);
    };

    $("gvh-ask").onclick = () => {
        let text = $("gvh-question").value.trim();
        if (!text) text = selectedText();
        if (!text && !pastedImage) { addMessage("⚠️ Hãy nhập câu hỏi, dán ảnh hoặc bấm 📸 Chụp bài.", "error"); return; }
        $("gvh-question").value = "";
        const image = pastedImage;
        clearPastedImage();
        ask(text ? text : "Hãy đọc kỹ hình ảnh bài tập này, giải chi tiết từng bước và in đậm kết quả cuối cùng.", false, image);
    };

    $("gvh-capture").onclick = () => {
        captureQuestionAndAttach();
    };

    $("gvh-search").onclick = () => {
        let text = $("gvh-question").value.trim() || selectedText();
        if (!text && !pastedImage) { addMessage("⚠️ Nhập từ khóa cần tra cứu.", "error"); return; }
        $("gvh-question").value = "";
        const image = pastedImage;
        clearPastedImage();
        ask(text ? text : "Tra cứu thông tin liên quan.", true, image);
    };

    $("gvh-clear").onclick = () => {
        $("gvh-messages").innerHTML = `<div class="gvh-msg gvh-ai">🧹 Đã làm sạch lịch sử trò chuyện!</div>`;
        clearPastedImage();
        $("gvh-status").textContent = "";
    };

    $("gvh-question").addEventListener("keydown", e => {
        if (e.ctrlKey && e.key === "Enter") { e.preventDefault(); $("gvh-ask").click(); }
    });
})();
