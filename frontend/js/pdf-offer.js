/**
 * PDF Offer Generator v2.0
 * 
 * Генерира PDF оферта с jsPDF.
 * За кирилица: потребителят качва TTF шрифт веднъж (напр. Roboto-Regular.ttf),
 * шрифтът се запазва в localStorage за бъдеща употреба.
 */

import { State } from './state.js';
import { Calculator } from './calculator.js';
import { cabinetTypes } from '../data/cabinetTypes.js';

export const PdfOffer = {
    companyData: null,
    clientData: null,
    logoDataUrl: null,
    fontBase64: null,      // base64 на TTF шрифт за кирилица
    fontBoldBase64: null,
    fontLoaded: false,

    init() {
        this.loadCompanyData();
        this.loadFont();
        console.log('✅ PdfOffer module initialized' + (this.fontLoaded ? ' (with Cyrillic font)' : ' (no Cyrillic font)'));
    },

    // ═══════════════════════════════════════════════════════
    // ШРИФТ ЗА КИРИЛИЦА
    // ═══════════════════════════════════════════════════════

    loadFont() {
        try {
            const f = localStorage.getItem('pdfFontNormal');
            if (f) { this.fontBase64 = f; this.fontLoaded = true; }
            const fb = localStorage.getItem('pdfFontBold');
            if (fb) this.fontBoldBase64 = fb;
        } catch(e) {}
    },

    handleFontUpload(event, type = 'normal') {
        const file = event.target.files[0];
        if (!file || !file.name.endsWith('.ttf')) {
            alert('Моля качете .ttf файл (напр. Roboto-Regular.ttf)');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const arrayBuffer = e.target.result;
            const bytes = new Uint8Array(arrayBuffer);
            let binary = '';
            for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
            const b64 = btoa(binary);

            if (type === 'bold') {
                this.fontBoldBase64 = b64;
                try { localStorage.setItem('pdfFontBold', b64); } catch(e) {}
            } else {
                this.fontBase64 = b64;
                this.fontLoaded = true;
                try { localStorage.setItem('pdfFontNormal', b64); } catch(e) {}
            }

            const status = document.getElementById('pdfFontStatus');
            if (status) {
                status.textContent = `✅ Шрифт "${file.name}" зареден успешно!`;
                status.style.color = '#28a745';
            }
        };
        reader.readAsArrayBuffer(file);
    },

    _registerFonts(doc) {
        if (!this.fontBase64) return false;
        try {
            doc.addFileToVFS('CustomFont-Regular.ttf', this.fontBase64);
            doc.addFont('CustomFont-Regular.ttf', 'CustomFont', 'normal');

            if (this.fontBoldBase64) {
                doc.addFileToVFS('CustomFont-Bold.ttf', this.fontBoldBase64);
                doc.addFont('CustomFont-Bold.ttf', 'CustomFont', 'bold');
            } else {
                // Use normal as bold fallback
                doc.addFileToVFS('CustomFont-Bold.ttf', this.fontBase64);
                doc.addFont('CustomFont-Bold.ttf', 'CustomFont', 'bold');
            }
            doc.setFont('CustomFont');
            return true;
        } catch(e) {
            console.error('Font registration error:', e);
            return false;
        }
    },

    // ═══════════════════════════════════════════════════════
    // МОДАЛ
    // ═══════════════════════════════════════════════════════

    showOfferModal() {
        const project = State.currentProject;
        if (!project || project.length === 0) {
            alert('Няма шкафове в проекта!');
            return;
        }

        this.loadCompanyData();
        this.loadClientData();
        const cd = this.companyData || {};
        const cl = this.clientData || {};

        const modal = document.createElement('div');
        modal.id = 'pdfOfferModal';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:20000;display:flex;align-items:center;justify-content:center;';

        modal.innerHTML = `
            <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);" onclick="PdfOffer.closeModal()"></div>
            <div style="position:relative;background:white;border-radius:15px;box-shadow:0 10px 40px rgba(0,0,0,0.3);width:92%;max-width:750px;max-height:88vh;overflow-y:auto;padding:25px;" onclick="event.stopPropagation()">
                
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                    <h3 style="margin:0;color:#667eea;">📄 Генерирай оферта (PDF)</h3>
                    <button onclick="PdfOffer.closeModal()" style="background:none;border:none;font-size:1.5em;cursor:pointer;color:#999;">✕</button>
                </div>

                <!-- Шрифт за кирилица -->
                <div style="padding:12px;background:${this.fontLoaded ? '#d4edda' : '#fff3cd'};border-radius:8px;margin-bottom:20px;">
                    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                        <span style="font-size:0.9em;font-weight:600;color:${this.fontLoaded ? '#155724' : '#856404'};">
                            ${this.fontLoaded ? '✅ Кирилски шрифт зареден' : '⚠️ За кирилица качете TTF шрифт (напр. Roboto-Regular.ttf)'}
                        </span>
                        <input type="file" accept=".ttf" onchange="PdfOffer.handleFontUpload(event, 'normal')" style="font-size:0.8em;">
                    </div>
                    <div id="pdfFontStatus" style="font-size:0.8em;margin-top:4px;"></div>
                    <div style="font-size:0.75em;color:#888;margin-top:4px;">
                        Изтегли безплатен шрифт: <a href="https://fonts.google.com/specimen/Roboto" target="_blank" style="color:#667eea;">Roboto от Google Fonts</a>
                        (изтегли → разархивирай → качи Roboto-Regular.ttf)
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
                    <!-- Фирмени данни -->
                    <div>
                        <h4 style="color:#667eea;margin:0 0 10px;">🏢 Данни на фирмата</h4>
                        <div style="display:flex;flex-direction:column;gap:6px;">
                            <input type="text" id="pdfCompanyName" placeholder="Име на фирма" value="${cd.name || ''}" style="padding:8px;border:1px solid #ddd;border-radius:6px;">
                            <input type="text" id="pdfCompanyAddress" placeholder="Адрес" value="${cd.address || ''}" style="padding:8px;border:1px solid #ddd;border-radius:6px;">
                            <input type="text" id="pdfCompanyPhone" placeholder="Телефон" value="${cd.phone || ''}" style="padding:8px;border:1px solid #ddd;border-radius:6px;">
                            <input type="text" id="pdfCompanyEmail" placeholder="Email" value="${cd.email || ''}" style="padding:8px;border:1px solid #ddd;border-radius:6px;">
                            <input type="text" id="pdfCompanyEik" placeholder="ЕИК / Булстат" value="${cd.eik || ''}" style="padding:8px;border:1px solid #ddd;border-radius:6px;">
                            <input type="text" id="pdfCompanyMol" placeholder="МОЛ" value="${cd.mol || ''}" style="padding:8px;border:1px solid #ddd;border-radius:6px;">
                        </div>
                        <div style="margin-top:10px;">
                            <label style="font-size:0.85em;color:#666;">Лого:</label>
                            <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
                                <input type="file" id="pdfLogoUpload" accept="image/*" onchange="PdfOffer.handleLogoUpload(event)" style="font-size:0.8em;">
                                <div id="pdfLogoPreview" style="width:45px;height:45px;border:1px solid #ddd;border-radius:6px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#f8f9fa;">
                                    ${this.logoDataUrl ? `<img src="${this.logoDataUrl}" style="max-width:100%;max-height:100%;">` : '<span style="color:#ccc;font-size:0.6em;">Лого</span>'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Клиент -->
                    <div>
                        <h4 style="color:#28a745;margin:0 0 10px;">👤 Данни на клиента</h4>
                        <div style="display:flex;flex-direction:column;gap:6px;">
                            <input type="text" id="pdfClientName" placeholder="Име на клиент" value="${cl.name || ''}" style="padding:8px;border:1px solid #ddd;border-radius:6px;">
                            <input type="text" id="pdfClientPhone" placeholder="Телефон" value="${cl.phone || ''}" style="padding:8px;border:1px solid #ddd;border-radius:6px;">
                            <input type="text" id="pdfClientAddress" placeholder="Адрес на обекта" value="${cl.address || ''}" style="padding:8px;border:1px solid #ddd;border-radius:6px;">
                            <input type="text" id="pdfClientEmail" placeholder="Email" value="${cl.email || ''}" style="padding:8px;border:1px solid #ddd;border-radius:6px;">
                        </div>
                        <div style="margin-top:12px;">
                            <h4 style="color:#ff9800;margin:0 0 8px;">📋 Настройки</h4>
                            <div style="display:flex;flex-direction:column;gap:6px;">
                                <input type="text" id="pdfOfferNumber" placeholder="Номер на оферта" value="OF-${Date.now().toString().slice(-6)}" style="padding:8px;border:1px solid #ddd;border-radius:6px;">
                                <input type="number" id="pdfValidDays" placeholder="Валидност (дни)" value="30" min="1" style="padding:8px;border:1px solid #ddd;border-radius:6px;">
                                <textarea id="pdfNotes" placeholder="Бележки..." rows="2" style="padding:8px;border:1px solid #ddd;border-radius:6px;resize:vertical;font-family:inherit;"></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="display:flex;gap:10px;margin-top:20px;">
                    <button onclick="PdfOffer.generatePdf()" style="flex:1;padding:14px;background:linear-gradient(135deg,#667eea,#764ba2);color:white;border:none;border-radius:8px;font-size:1.05em;font-weight:600;cursor:pointer;">
                        📄 Генерирай PDF
                    </button>
                    <button onclick="PdfOffer.closeModal()" style="padding:14px 25px;background:#f0f0f0;color:#666;border:none;border-radius:8px;cursor:pointer;">
                        Отказ
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    },

    closeModal() {
        const m = document.getElementById('pdfOfferModal');
        if (m) m.remove();
    },

    handleLogoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            this.logoDataUrl = e.target.result;
            const preview = document.getElementById('pdfLogoPreview');
            if (preview) preview.innerHTML = `<img src="${this.logoDataUrl}" style="max-width:100%;max-height:100%;">`;
            try { localStorage.setItem('pdfLogo', this.logoDataUrl); } catch(e) {}
        };
        reader.readAsDataURL(file);
    },

    // ═══════════════════════════════════════════════════════
    // DATA SAVE/LOAD
    // ═══════════════════════════════════════════════════════

    saveCompanyData() {
        const data = {
            name: document.getElementById('pdfCompanyName')?.value || '',
            address: document.getElementById('pdfCompanyAddress')?.value || '',
            phone: document.getElementById('pdfCompanyPhone')?.value || '',
            email: document.getElementById('pdfCompanyEmail')?.value || '',
            eik: document.getElementById('pdfCompanyEik')?.value || '',
            mol: document.getElementById('pdfCompanyMol')?.value || '',
        };
        this.companyData = data;
        try { localStorage.setItem('pdfCompanyData', JSON.stringify(data)); } catch(e) {}
    },

    loadCompanyData() {
        try {
            const s = localStorage.getItem('pdfCompanyData');
            if (s) this.companyData = JSON.parse(s);
            const logo = localStorage.getItem('pdfLogo');
            if (logo) this.logoDataUrl = logo;
        } catch(e) {}
    },

    saveClientData() {
        const data = {
            name: document.getElementById('pdfClientName')?.value || '',
            phone: document.getElementById('pdfClientPhone')?.value || '',
            address: document.getElementById('pdfClientAddress')?.value || '',
            email: document.getElementById('pdfClientEmail')?.value || '',
        };
        this.clientData = data;
        try { localStorage.setItem('pdfClientData', JSON.stringify(data)); } catch(e) {}
    },

    loadClientData() {
        try {
            const s = localStorage.getItem('pdfClientData');
            if (s) this.clientData = JSON.parse(s);
        } catch(e) {}
    },

    // ═══════════════════════════════════════════════════════
    // PDF GENERATION
    // ═══════════════════════════════════════════════════════

    generatePdf() {
        if (typeof window.jspdf === 'undefined') {
            alert('jsPDF не е зареден. Презаредете страницата.');
            return;
        }

        this.saveCompanyData();
        this.saveClientData();

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const pw = 210, ph = 297, mg = 15, cw = pw - 2*mg;
        let y = mg;

        // Register Cyrillic font
        const hasCyrillic = this._registerFonts(doc);
        const setNormal = () => { if (hasCyrillic) doc.setFont('CustomFont', 'normal'); else doc.setFont('helvetica', 'normal'); };
        const setBold = () => { if (hasCyrillic) doc.setFont('CustomFont', 'bold'); else doc.setFont('helvetica', 'bold'); };

        const company = this.companyData || {};
        const client = this.clientData || {};
        const offerNum = document.getElementById('pdfOfferNumber')?.value || '';
        const validDays = document.getElementById('pdfValidDays')?.value || '30';
        const notes = document.getElementById('pdfNotes')?.value || '';
        const project = State.currentProject || [];
        const today = new Date().toLocaleDateString('bg-BG');

        // ──── HEADER ────
        if (this.logoDataUrl) {
            try { doc.addImage(this.logoDataUrl, 'AUTO', mg, y, 28, 28); } catch(e) {}
        }
        const hx = this.logoDataUrl ? mg + 33 : mg;
        doc.setFontSize(16); setBold();
        doc.text(company.name || 'Firma', hx, y + 8);
        doc.setFontSize(9); setNormal(); doc.setTextColor(100);
        if (company.address) doc.text(company.address, hx, y + 14);
        if (company.phone) doc.text('Tel: ' + company.phone, hx, y + 19);
        if (company.email) doc.text(company.email, hx, y + 24);
        if (company.eik) doc.text('EIK: ' + company.eik, hx, y + 29);
        doc.setTextColor(0);
        y += 36;

        // Line
        doc.setDrawColor(102, 126, 234); doc.setLineWidth(0.8);
        doc.line(mg, y, pw - mg, y); y += 8;

        // Title
        doc.setFontSize(20); setBold();
        doc.setTextColor(102, 126, 234);
        doc.text(hasCyrillic ? 'ОФЕРТА' : 'OFERTA', pw/2, y, { align: 'center' });
        y += 8;
        doc.setFontSize(10); setNormal(); doc.setTextColor(100);
        doc.text(`No: ${offerNum}  |  ${today}  |  ${hasCyrillic ? 'Валидност' : 'Validnost'}: ${validDays} ${hasCyrillic ? 'дни' : 'dni'}`, pw/2, y, { align: 'center' });
        doc.setTextColor(0); y += 10;

        // Client
        if (client.name || client.phone) {
            doc.setFillColor(248, 249, 250);
            doc.roundedRect(mg, y, cw, 18, 3, 3, 'F');
            doc.setFontSize(9); setBold();
            doc.text(hasCyrillic ? 'Клиент:' : 'Klient:', mg + 4, y + 6);
            setNormal();
            const cl = [client.name, client.phone, client.address, client.email].filter(Boolean).join('  |  ');
            doc.text(cl, mg + 4, y + 12);
            y += 24;
        }

        // ──── CABINETS TABLE ────
        y = this._sectionTitle(doc, hasCyrillic ? 'Списък шкафове' : 'Spisak shkafove', y, mg, setBold, setNormal);

        const cols = [8, 52, 24, 24, 24, 14, 24];
        const hdr = ['#', hasCyrillic ? 'Тип шкаф' : 'Tip', hasCyrillic ? 'Шир.' : 'W', hasCyrillic ? 'Вис.' : 'H', hasCyrillic ? 'Дълб.' : 'D', hasCyrillic ? 'Бр.' : 'Qty', hasCyrillic ? 'В/Р' : 'D/S'];

        doc.setFillColor(102, 126, 234); doc.rect(mg, y, cw, 7, 'F');
        doc.setTextColor(255); doc.setFontSize(8); setBold();
        let cx = mg + 2;
        hdr.forEach((h, i) => { doc.text(h, cx, y + 5); cx += cols[i]; });
        doc.setTextColor(0); y += 7;

        setNormal(); doc.setFontSize(8);
        project.forEach((cab, idx) => {
            if (y > ph - 35) { doc.addPage(); y = mg; }
            doc.setFillColor(idx % 2 === 0 ? 255 : 245, idx % 2 === 0 ? 255 : 245, idx % 2 === 0 ? 255 : 245);
            doc.rect(mg, y, cw, 6, 'F');
            cx = mg + 2;
            const cfg = cabinetTypes[cab.type] || {};
            [String(idx + 1), (cfg.name || cab.type), cab.width + 'mm', cab.height + 'mm', cab.depth + 'mm', String(cab.quantity || 1), `${cab.door_count || 0}/${cab.shelf_count || 0}`].forEach((v, i) => {
                doc.text(v.substring(0, 25), cx, y + 4); cx += cols[i];
            });
            y += 6;
        });
        y += 5;

        // ──── MATERIALS ────
        const Materials = window.Materials;
        if (Materials?.selectedMaterials) {
            const entries = Object.entries(Materials.selectedMaterials).filter(([k, v]) => v !== null);
            if (entries.length > 0) {
                if (y > ph - 50) { doc.addPage(); y = mg; }
                y = this._sectionTitle(doc, hasCyrillic ? 'Материали' : 'Materiali', y, mg, setBold, setNormal);

                doc.setFillColor(40, 167, 69); doc.rect(mg, y, cw, 7, 'F');
                doc.setTextColor(255); doc.setFontSize(8); setBold();
                doc.text(hasCyrillic ? 'Материал' : 'Material', mg + 2, y + 5);
                doc.text(hasCyrillic ? 'Бр.' : 'Qty', mg + 105, y + 5);
                doc.text(hasCyrillic ? 'Цена' : 'Price', mg + 120, y + 5);
                doc.text(hasCyrillic ? 'Общо' : 'Total', mg + 150, y + 5);
                doc.setTextColor(0); y += 7;

                let matSum = 0;
                setNormal();
                entries.forEach(([key, data], idx) => {
                    if (y > ph - 25) { doc.addPage(); y = mg; }
                    doc.setFillColor(idx % 2 === 0 ? 255 : 245, idx % 2 === 0 ? 255 : 245, idx % 2 === 0 ? 255 : 245);
                    doc.rect(mg, y, cw, 6, 'F');
                    const p = data.material.price || 0, q = data.quantity || 0, t = p * q;
                    matSum += t;
                    doc.setFontSize(7.5);
                    doc.text((data.material.name || key).substring(0, 50), mg + 2, y + 4);
                    doc.text(String(q), mg + 105, y + 4);
                    doc.text(p.toFixed(2), mg + 120, y + 4);
                    doc.text(t.toFixed(2) + (hasCyrillic ? ' лв' : ' lv'), mg + 150, y + 4);
                    y += 6;

                    if (data.additionalItems) {
                        data.additionalItems.forEach(ai => {
                            if (y > ph - 25) { doc.addPage(); y = mg; }
                            const at = (ai.material.price || 0) * ai.quantity;
                            matSum += at;
                            doc.setFillColor(252, 252, 252); doc.rect(mg, y, cw, 5.5, 'F');
                            doc.setFontSize(7); doc.setTextColor(100);
                            doc.text('  + ' + (ai.material.name || '').substring(0, 46), mg + 2, y + 4);
                            doc.text(String(ai.quantity), mg + 105, y + 4);
                            doc.text((ai.material.price || 0).toFixed(2), mg + 120, y + 4);
                            doc.text(at.toFixed(2) + (hasCyrillic ? ' лв' : ' lv'), mg + 150, y + 4);
                            doc.setTextColor(0); y += 5.5;
                        });
                    }
                });

                doc.setFillColor(230, 240, 230); doc.rect(mg, y, cw, 6, 'F');
                setBold(); doc.setFontSize(8);
                doc.text(hasCyrillic ? 'ОБЩО МАТЕРИАЛИ:' : 'TOTAL MATERIALS:', mg + 2, y + 4);
                doc.text(matSum.toFixed(2) + (hasCyrillic ? ' лв' : ' lv'), mg + 150, y + 4);
                y += 10;
            }
        }

        // ──── LABOR ────
        if (y > ph - 50) { doc.addPage(); y = mg; }
        y = this._drawLabor(doc, y, mg, cw, ph, hasCyrillic, setBold, setNormal);

        // ──── TOTALS ────
        if (y > ph - 50) { doc.addPage(); y = mg; }
        y = this._drawTotals(doc, y, mg, cw, hasCyrillic, setBold, setNormal);

        // ──── NOTES ────
        if (notes) {
            if (y > ph - 30) { doc.addPage(); y = mg; }
            y += 3; doc.setFontSize(8); setNormal(); doc.setTextColor(100);
            doc.text((hasCyrillic ? 'Бележки: ' : 'Notes: ') + notes, mg, y);
            doc.setTextColor(0); y += 8;
        }

        // ──── FOOTER ────
        y = ph - 15;
        doc.setDrawColor(200); doc.line(mg, y, pw - mg, y); y += 4;
        doc.setFontSize(7); doc.setTextColor(150);
        doc.text(`${hasCyrillic ? 'Оферта' : 'Oferta'} ${offerNum} | ${today} | ${hasCyrillic ? 'Мебелен Калкулатор v3.0' : 'Mebelen Kalkulator v3.0'}`, pw/2, y, { align: 'center' });

        const fn = `Oferta_${offerNum}_${today.replace(/\./g, '-')}.pdf`;
        doc.save(fn);
        this.closeModal();
        alert(`✅ ${hasCyrillic ? 'Офертата е генерирана!' : 'PDF generated!'}\n${fn}`);
    },

    // ══════ HELPERS ══════

    _sectionTitle(doc, title, y, mg, setBold, setNormal) {
        doc.setFontSize(11); setBold();
        doc.setTextColor(102, 126, 234);
        doc.text(title, mg, y + 5);
        doc.setTextColor(0); setNormal();
        return y + 10;
    },

    _drawLabor(doc, y, mg, cw, ph, cyr, setBold, setNormal) {
        y = this._sectionTitle(doc, cyr ? 'Труд и монтаж' : 'Trud i montazh', y, mg, setBold, setNormal);
        const items = [];

        document.querySelectorAll('#laborTableBody tr').forEach(row => {
            const n = row.querySelector('.operation-name')?.value;
            const q = parseFloat(row.querySelector('.operation-qty')?.value) || 0;
            const p = parseFloat(row.querySelector('.operation-price')?.value) || 0;
            if (n && q > 0) items.push({ n, q, p, t: q * p });
        });
        document.querySelectorAll('#installationTableBody tr').forEach(row => {
            const n = row.querySelector('.service-name')?.value;
            const q = parseFloat(row.querySelector('.service-qty')?.value) || 0;
            const p = parseFloat(row.querySelector('.service-price')?.value) || 0;
            if (n && q > 0) items.push({ n, q, p, t: q * p });
        });

        if (items.length === 0) return y;

        doc.setFillColor(255, 152, 0); doc.rect(mg, y, cw, 7, 'F');
        doc.setTextColor(255); doc.setFontSize(8); setBold();
        doc.text(cyr ? 'Операция' : 'Operation', mg + 2, y + 5);
        doc.text(cyr ? 'Бр.' : 'Qty', mg + 100, y + 5);
        doc.text(cyr ? 'Цена' : 'Price', mg + 118, y + 5);
        doc.text(cyr ? 'Общо' : 'Total', mg + 150, y + 5);
        doc.setTextColor(0); y += 7;

        let sum = 0;
        setNormal();
        items.forEach((it, i) => {
            if (y > ph - 25) { doc.addPage(); y = 15; }
            doc.setFillColor(i % 2 === 0 ? 255 : 245, i % 2 === 0 ? 255 : 245, i % 2 === 0 ? 255 : 245);
            doc.rect(mg, y, cw, 6, 'F');
            doc.setFontSize(7.5);
            doc.text(it.n.substring(0, 46), mg + 2, y + 4);
            doc.text(String(it.q), mg + 100, y + 4);
            doc.text(it.p.toFixed(2), mg + 118, y + 4);
            doc.text(it.t.toFixed(2) + (cyr ? ' лв' : ' lv'), mg + 150, y + 4);
            sum += it.t; y += 6;
        });

        doc.setFillColor(255, 240, 220); doc.rect(mg, y, cw, 6, 'F');
        setBold(); doc.setFontSize(8);
        doc.text(cyr ? 'ОБЩО ТРУД:' : 'TOTAL LABOR:', mg + 2, y + 4);
        doc.text(sum.toFixed(2) + (cyr ? ' лв' : ' lv'), mg + 150, y + 4);
        return y + 10;
    },

    _drawTotals(doc, y, mg, cw, cyr, setBold, setNormal) {
        y = this._sectionTitle(doc, cyr ? 'Обща калкулация' : 'Obsha kalkulaciya', y, mg, setBold, setNormal);

        let tOverall = 0, tMat = 0, tInst = 0, tLabor = 0;
        document.querySelectorAll('#overallCostsTable .item-price').forEach(i => tOverall += parseFloat(i.value) || 0);
        document.querySelectorAll('.service-total').forEach(c => tInst += parseFloat(c.textContent.replace(' лв', '')) || 0);
        document.querySelectorAll('.operation-total').forEach(c => tLabor += parseFloat(c.textContent.replace(' лв', '')) || 0);

        const M = window.Materials;
        if (M?.selectedMaterials) {
            Object.values(M.selectedMaterials).forEach(s => {
                if (s?.material?.price && s.quantity) tMat += s.material.price * s.quantity;
                if (s?.additionalItems) s.additionalItems.forEach(a => { if (a.material?.price && a.quantity) tMat += a.material.price * a.quantity; });
            });
        }

        const sub = tOverall + tMat + tInst + tLabor;
        const mp = parseFloat(document.getElementById('markupPercent')?.value) || 0;
        const markup = sub * mp / 100;
        const afterM = sub + markup;
        const vat = afterM * 0.2;
        const grand = afterM + vat;
        const lv = cyr ? ' лв' : ' lv';

        const rows = [
            [cyr ? 'Общи разходи' : 'Obshi razhodi', tOverall],
            [cyr ? 'Материали' : 'Materiali', tMat],
            [cyr ? 'Труд' : 'Trud', tLabor],
            [cyr ? 'Монтаж и ВиК' : 'Montazh', tInst],
            [cyr ? 'Междинна сума' : 'Mezhdinna suma', sub, true],
        ];
        if (mp !== 0) rows.push([(cyr ? 'Надценка ' : 'Markup ') + `(${mp}%)`, markup]);
        rows.push([(cyr ? 'ДДС' : 'DDS') + ' (20%)', vat]);
        rows.push([cyr ? 'ОБЩО' : 'TOTAL', grand, true, true]);

        rows.forEach(([label, val, bold, isTotal]) => {
            if (isTotal) {
                doc.setFillColor(102, 126, 234); doc.rect(mg, y, cw, 8, 'F');
                doc.setTextColor(255); doc.setFontSize(11); setBold();
                doc.text(label, mg + 5, y + 6);
                doc.text(val.toFixed(2) + lv, mg + cw - 5, y + 6, { align: 'right' });
                doc.setTextColor(0); y += 9;
            } else {
                if (bold) { doc.setFillColor(240, 240, 240); doc.rect(mg, y, cw, 7, 'F'); }
                doc.setFontSize(9); bold ? setBold() : setNormal();
                doc.text(label, mg + 5, y + 5);
                doc.text(val.toFixed(2) + lv, mg + cw - 5, y + 5, { align: 'right' });
                y += 7;
            }
        });

        return y + 5;
    }
};

window.PdfOffer = PdfOffer;
