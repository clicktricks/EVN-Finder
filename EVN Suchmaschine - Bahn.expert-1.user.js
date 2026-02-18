// ==UserScript==
// @name         EVN-Finder
// @namespace    http://tampermonkey.net/
// @version      1
// @description  EVN (Fahrzeugnummer)-  Suche mit Eingabefeld direkt im Browser
// @author       Clicktricks
// @match        https://bahn.expert/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    let scriptReady = false;
    let isScanning = false;

    setTimeout(() => { scriptReady = true; }, 1000);

    GM_addStyle(`
        #evn-search-box {
            position: fixed; top: 45px; right: 85px; width: 180px;
            background: #1a1a1a; border: 2px solid #1976d2; border-radius: 6px;
            padding: 10px; z-index: 10000; color: ; font-family: sans-serif;
            box-shadow: 0 4px 12px rgba(0,0,0,0.6); cursor: grab;
        }
        #evn-input {
            width: 100%; background: #2a2a2a; border: 1px solid #444;
            color: #a3cf62; padding: 6px; margin-bottom: 8px; box-sizing: border-box;
            outline: none; font-weight: bold; transition: all 0.2s;
        }
        /* Feld während der Suche: Hintergrund dunkel, Schrift Weiß */
        #evn-input:disabled {
            background: #121212;
            border-color: #333;
            color: #ffffff !important;
            cursor: not-allowed;
            opacity: 1; /* Verhindert das Standard-Ausgrauen vom Browser */
        }

        #evn-go-btn {
            width: 100%; color: white; border: none;
            padding: 8px; cursor: pointer; font-weight: bold; border-radius: 3px;
            display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .btn-start { background: #1f5e06; }
        .btn-start:hover { background: #2a7a08; }
        .btn-stop { background: #333; color: #ffffff; border: 1px solid #444; }
        .btn-stop:hover { background: #444; }

        #evn-status {
            font-size: 11px; font-weight: bold; color: #a3cf62;
            margin-top: 8px; text-align: center; height: 14px;
            visibility: hidden;
        }
    `);

    const box = document.createElement('div');
    box.id = 'evn-search-box';
    box.innerHTML = `
        <div style="font-size:10px; color:#888; margin-bottom:6px; letter-spacing:1px;">EVN FINDER</div>
        <input type="text" id="evn-input" placeholder="EVN (z.B. 0612 123)">
        <button id="evn-go-btn" class="btn-start">SCAN STARTEN</button>
        <div id="evn-status">SUCHE LÄUFT...</div>
    `;
    document.body.appendChild(box);

    const input = document.getElementById('evn-input');
    const btn = document.getElementById('evn-go-btn');
    const status = document.getElementById('evn-status');

    // Drag-Logik
    let isDragging = false, offset = { x: 0, y: 0 };
    box.onmousedown = (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
        isDragging = true;
        offset.x = e.clientX - box.getBoundingClientRect().left;
        offset.y = e.clientY - box.getBoundingClientRect().top;
        box.style.cursor = 'grabbing';
    };
    document.onmousemove = (e) => {
        if (!isDragging) return;
        box.style.left = (e.clientX - offset.x) + 'px';
        box.style.top = (e.clientY - offset.y) + 'px';
        box.style.right = 'auto';
    };
    document.onmouseup = () => { isDragging = false; box.style.cursor = 'grab'; };

    const resetUI = () => {
        isScanning = false;
        btn.innerHTML = "SCAN STARTEN";
        btn.className = "btn-start";
        input.disabled = false;
        status.style.visibility = "hidden";
        status.innerText = "SUCHE LÄUFT...";
        status.style.color = "#a3cf62";
    };

    const searchAction = async (e) => {
        if (!scriptReady) return;
        if (e) { e.preventDefault(); e.stopPropagation(); }

        if (isScanning) {
            isScanning = false;
            status.innerText = "BEENDET";
            status.style.color = "#ff4444";
            setTimeout(resetUI, 1200);
            return;
        }

        const val = input.value.trim().replace(/\s/g, "");
        if (!val) return;

        isScanning = true;
        btn.innerHTML = '<span style="color: #ff4444; font-size: 16px;">✖</span> BEENDEN';
        btn.className = "btn-stop";
        input.disabled = true;
        status.style.visibility = "visible";

        const trains = document.querySelectorAll('div[id$="container"]');
        for (const train of trains) {
            if (!isScanning || document.hidden) break;

            train.scrollIntoView({ block: "center", behavior: "smooth" });
            train.click();

            let found = false;
            for (let i = 0; i < 12; i++) {
                if (!isScanning) break;
                await new Promise(r => setTimeout(r, 250));
                const evnRegex = /\b9[1-8]\s?\d{2}\s?\d{4}\s?\d{3}-\d\b|\b\d{4}\s\d{3}\b/g;
                const gefundeneNummern = train.innerHTML.match(evnRegex) || [];

                if (gefundeneNummern.some(nr => nr.replace(/\s/g, "").includes(val))) {
                    found = true;
                    break;
                }
            }

            if (found) {
                train.style.outline = "5px solid #a3cf62";
                status.innerText = "GEFUNDEN!";
                btn.innerHTML = "NEUE SUCHE";
                btn.className = "btn-start";
                input.disabled = false;
                isScanning = false;
                return;
            }

            if (isScanning) train.click();
            await new Promise(r => setTimeout(r, 100));
        }

        if (isScanning) {
            alert("EVN nicht gefunden!");
            resetUI();
        }
    };

    btn.onclick = (e) => searchAction(e);
    input.onkeydown = (e) => { if (e.key === 'Enter') searchAction(e); };
})();
