// ==UserScript==
// @name         EVN Suchmaschine - Bahn.expert
// @namespace    http://tampermonkey.net/
// @version      1
// @description  Sucht gezielt nach einer EVN auf der aktuellen Abfahrtsübersicht
// @author       Clicktricks
// @match        https://bahn.expert/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // 1. CSS Design (Passend zu deiner GUI)
    GM_addStyle(`
        #evn-search-box {
            position: fixed; top: 100px; right: 20px; width: 170px;
            background: #1a1a1a; border: 2px solid #a3cf62; border-radius: 6px;
            padding: 10px; z-index: 10000; color: white; font-family: sans-serif;
            box-shadow: 0 4px 12px rgba(0,0,0,0.6); cursor: grab;
        }
        #evn-input {
            width: 100%; background: #2a2a2a; border: 1px solid #444;
            color: #a3cf62; padding: 6px; margin-bottom: 8px; box-sizing: border-box;
            outline: none; font-weight: bold;
        }
        #evn-go-btn {
            width: 100%; background: #1f5e06; color: white; border: none;
            padding: 8px; cursor: pointer; font-weight: bold; border-radius: 3px;
        }
        #evn-go-btn:hover { background: #2a7a08; }
        #evn-go-btn:disabled { background: #444; cursor: wait; }
    `);

    // 2. GUI erstellen
    const box = document.createElement('div');
    box.id = 'evn-search-box';
    box.innerHTML = `
        <div style="font-size:10px; color:#888; margin-bottom:6px; letter-spacing:1px;">EVN FINDER</div>
        <input type="text" id="evn-input" placeholder="EVN (z.B. 0612 123)">
        <button id="evn-go-btn">SCAN STARTEN</button>
    `;
    document.body.appendChild(box);

    // 3. Drag-Logik (Verschiebbar ohne Speichern)
    let isDragging = false, offset = { x: 0, y: 0 };
    box.onmousedown = (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
        isDragging = true;
        offset.x = e.clientX - box.getBoundingClientRect().left;
        offset.y = e.clientY - box.getBoundingClientRect().top;
        box.style.cursor = 'grabbing';
        e.preventDefault();
    };
    document.onmousemove = (e) => {
        if (!isDragging) return;
        box.style.left = (e.clientX - offset.x) + 'px';
        box.style.top = (e.clientY - offset.y) + 'px';
        box.style.right = 'auto';
    };
    document.onmouseup = () => { isDragging = false; box.style.cursor = 'grab'; };

    // 4. Such-Logik
    const input = document.getElementById('evn-input');
    const btn = document.getElementById('evn-go-btn');

const searchAction = async () => {
    const val = input.value.trim().replace(/\s/g, ""); // Deine Eingabe (z.B. "123")
    if (!val) return;

    btn.innerText = "SUCHE...";
    btn.disabled = true;

    const trains = document.querySelectorAll('div[id$="container"]');
    let found = false;

    for (const train of trains) {
        train.scrollIntoView({ block: "center", behavior: "smooth" });
        train.click();

        for (let i = 0; i < 12; i++) {
            await new Promise(r => setTimeout(r, 250));
            // Extrahiere alle Nummern aus dem HTML
            const html = train.innerHTML.replace(/\s/g, "");
            // PRÜFUNG: Ist dein Schnipsel Teil einer der Nummern im HTML?
            if (html.includes(val)) {
                found = true;
                break;
            }
        }

        if (found) {
            train.style.outline = "5px solid #a3cf62";
            btn.innerText = "TREFFER!";
            // ... (Restliches Design-Feedback wie zuvor)
            return;
        }
        train.click();
        await new Promise(r => setTimeout(r, 100));
    }
    // ... Fehlermeldung
};

    // Button-Klick & Enter-Taste
    btn.onclick = searchAction;
    input.onkeydown = (e) => { if (e.key === 'Enter') searchAction(); };
})();