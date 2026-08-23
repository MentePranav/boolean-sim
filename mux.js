/**
 * BoolSynth — Multiplexer Simulator Module
 * 2:1, 4:1, and 8:1 Multiplexers with dynamic signal routing, active path highlighting,
 * gate-level internal decoding array, truth table synchronization, and Universal Logic generator.
 */
(function () {
  'use strict';

  let muxType = 4; // 2, 4, or 8
  let enableActiveLow = 0; // 0 = Enabled, 1 = Disabled (active low strobe)

  // Inputs state
  // Max 8 data inputs: D0..D7
  let dataInputs = [1, 0, 1, 1, 0, 1, 0, 0];
  // Select lines: [S2, S1, S0] MSB to LSB
  let selectInputs = [0, 1, 0];

  // Universal logic generator state
  let universalModeActive = false;

  const MUX_CONFIGS = {
    2: {
      type: 2,
      name: '2:1 Multiplexer',
      numSelect: 1,
      numData: 2,
      selectNames: ['S0'],
      dataNames: ['D0', 'D1'],
      height: 220,
      width: 460
    },
    4: {
      type: 4,
      name: '4:1 Multiplexer',
      numSelect: 2,
      numData: 4,
      selectNames: ['S1', 'S0'],
      dataNames: ['D0', 'D1', 'D2', 'D3'],
      height: 290,
      width: 500
    },
    8: {
      type: 8,
      name: '8:1 Multiplexer',
      numSelect: 3,
      numData: 8,
      selectNames: ['S2', 'S1', 'S0'],
      dataNames: ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'],
      height: 420,
      width: 560
    }
  };

  /* ===================== Logic Computation ===================== */

  function computeMux() {
    const cfg = MUX_CONFIGS[muxType];
    const k = cfg.numSelect;
    const n = cfg.numData;

    // Active select bits (sliced to match current k)
    const selBits = selectInputs.slice(3 - k);
    const selDecimal = parseInt(selBits.join(''), 2);

    // Active data inputs
    const curData = dataInputs.slice(0, n);

    // Is enabled? (Active Low: 0 is enabled, 1 is disabled)
    const isEnabled = enableActiveLow === 0;

    // Routed output
    const routedValue = isEnabled ? curData[selDecimal] : 0;
    const invertedValue = isEnabled ? (routedValue === 1 ? 0 : 1) : 0;

    // Decoder minterms for internal gate array
    const minterms = [];
    for (let i = 0; i < n; i++) {
      const isSelected = i === selDecimal;
      const andOutput = isEnabled && isSelected ? curData[i] : 0;
      minterms.push({
        index: i,
        isSelected,
        dataVal: curData[i],
        andOutput
      });
    }

    return {
      cfg,
      k,
      n,
      selBits,
      selDecimal,
      curData,
      isEnabled,
      routedValue,
      invertedValue,
      minterms
    };
  }

  /* ===================== DOM & Rendering ===================== */

  function initMuxModule() {
    renderTypeSelector();
    renderMuxControls();
    renderMuxSchematic();
    renderTruthTable();
    renderEquation();
    bindEvents();
  }

  function renderTypeSelector() {
    const container = document.getElementById('mux-type-selector');
    if (!container) return;

    container.innerHTML = `
      <div class="tabs">
        <button class="tab-btn mux-size-btn ${muxType === 2 ? 'active' : ''}" data-size="2">2:1 MUX (1 Select)</button>
        <button class="tab-btn mux-size-btn ${muxType === 4 ? 'active' : ''}" data-size="4">4:1 MUX (2 Selects)</button>
        <button class="tab-btn mux-size-btn ${muxType === 8 ? 'active' : ''}" data-size="8">8:1 MUX (3 Selects)</button>
      </div>
    `;

    container.querySelectorAll('.mux-size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        muxType = parseInt(btn.dataset.size, 10);
        renderTypeSelector();
        renderMuxControls();
        renderMuxSchematic();
        renderTruthTable();
        renderEquation();
      });
    });
  }

  function renderMuxControls() {
    const container = document.getElementById('mux-controls-container');
    if (!container) return;

    const data = computeMux();
    const cfg = data.cfg;

    let html = `
      <div class="row" style="margin-bottom:18px;">
        <!-- Data Inputs (D0..D(n-1)) -->
        <div style="flex:2; min-width:300px;">
          <div class="arith-operand-card">
            <div class="card-head">
              <span class="card-title">Data Inputs (D<sub>0</sub>…D<sub>${data.n - 1}</sub>)</span>
              <div class="mux-quick-actions">
                <button class="btn-secondary" id="mux-btn-all0" style="padding:4px 8px; font-size:11px;">All 0</button>
                <button class="btn-secondary" id="mux-btn-all1" style="padding:4px 8px; font-size:11px;">All 1</button>
                <button class="btn-secondary" id="mux-btn-alt" style="padding:4px 8px; font-size:11px;">1010</button>
              </div>
            </div>
            <div class="bit-switches-row" style="flex-wrap:wrap;">
              ${data.curData.map((val, idx) => {
                const isSelected = idx === data.selDecimal;
                return `
                  <div class="bit-toggle-col ${isSelected ? 'active-channel-col' : ''}">
                    <span class="bit-name" style="${isSelected ? 'color:var(--signal); font-weight:700;' : ''}">D<sub>${idx}</sub></span>
                    <button class="bit-toggle-btn mux-data-btn ${val === 1 ? 'active' : ''} ${isSelected ? 'selected-channel-btn' : ''}" data-didx="${idx}">
                      ${val}
                    </button>
                    ${isSelected ? '<span class="channel-indicator">ROUTED</span>' : '<span class="channel-indicator-dim">—</span>'}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- Select Inputs (S) & Enable -->
        <div style="flex:1.2; min-width:240px;">
          <div class="arith-operand-card" style="height:100%;">
            <div class="card-head">
              <span class="card-title">Select Lines & Enable</span>
              <span class="card-badge">Selected: D<sub>${data.selDecimal}</sub></span>
            </div>
            <div class="bit-switches-row" style="margin-bottom:12px;">
              ${data.selBits.map((val, idx) => {
                const selName = cfg.selectNames[idx];
                const absIdx = (3 - data.k) + idx;
                return `
                  <div class="bit-toggle-col">
                    <span class="bit-name">${selName}</span>
                    <button class="bit-toggle-btn mux-sel-btn ${val === 1 ? 'active' : ''}" data-sidx="${absIdx}">
                      ${val}
                    </button>
                  </div>
                `;
              }).join('')}

              <!-- Enable Strobe (Active-low) -->
              <div class="bit-toggle-col" style="border-left:1px dashed var(--line); padding-left:12px;">
                <span class="bit-name" style="color:var(--amber);">E (Strobe)</span>
                <button class="bit-toggle-btn mux-enable-btn ${enableActiveLow === 1 ? 'active-red' : 'active'}" id="mux-btn-enable">
                  ${enableActiveLow}
                </button>
                <span style="font-size:10px; color:var(--text-faint);">${enableActiveLow === 0 ? 'ON' : 'OFF'}</span>
              </div>
            </div>
            <div class="hint" style="margin-top:6px;">
              Select lines = <strong>${data.selBits.join('')}<sub>2</sub> (${data.selDecimal})</strong> → Routes <strong>D<sub>${data.selDecimal}</sub></strong> to Output Y.
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Attach data input toggle events
    container.querySelectorAll('.mux-data-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.didx, 10);
        dataInputs[idx] = dataInputs[idx] === 1 ? 0 : 1;
        refreshMuxView();
      });
    });

    // Attach select toggle events
    container.querySelectorAll('.mux-sel-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.sidx, 10);
        selectInputs[idx] = selectInputs[idx] === 1 ? 0 : 1;
        refreshMuxView();
      });
    });

    // Enable button
    const enableBtn = document.getElementById('mux-btn-enable');
    if (enableBtn) {
      enableBtn.addEventListener('click', () => {
        enableActiveLow = enableActiveLow === 0 ? 1 : 0;
        refreshMuxView();
      });
    }

    // Quick actions
    const btnAll0 = document.getElementById('mux-btn-all0');
    if (btnAll0) {
      btnAll0.addEventListener('click', () => {
        dataInputs.fill(0);
        refreshMuxView();
      });
    }
    const btnAll1 = document.getElementById('mux-btn-all1');
    if (btnAll1) {
      btnAll1.addEventListener('click', () => {
        dataInputs.fill(1);
        refreshMuxView();
      });
    }
    const btnAlt = document.getElementById('mux-btn-alt');
    if (btnAlt) {
      btnAlt.addEventListener('click', () => {
        dataInputs = [1, 0, 1, 0, 1, 0, 1, 0];
        refreshMuxView();
      });
    }
  }

  function refreshMuxView() {
    renderMuxControls();
    renderMuxSchematic();
    renderTruthTable();
    renderEquation();
  }

  /* ===================== SVG Schematic Renderer ===================== */

  function renderMuxSchematic() {
    const container = document.getElementById('mux-schematic-svg');
    if (!container) return;

    const data = computeMux();
    const cfg = data.cfg;
    const n = data.n;
    const k = data.k;

    const W = cfg.width;
    const H = cfg.height;

    // Trapezoid geometry
    const muxLeft = 140;
    const muxRight = 320;
    const muxTop = 40;
    const muxBottom = H - 50;
    const muxRightTop = muxTop + (n === 8 ? 60 : n === 4 ? 40 : 25);
    const muxRightBottom = muxBottom - (n === 8 ? 60 : n === 4 ? 40 : 25);

    let svg = `<svg viewBox="0 0 ${W} ${H}" class="gate-svg mux-svg-diagram">
      <defs>
        <filter id="glow-signal" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <!-- Trapezoid Body -->
      <polygon points="${muxLeft},${muxTop} ${muxRight},${muxRightTop} ${muxRight},${muxRightBottom} ${muxLeft},${muxBottom}"
        class="gate-shape" style="fill:var(--panel-2); stroke:var(--line); stroke-width:2;" />

      <text x="${(muxLeft + muxRight) / 2}" y="${(muxTop + muxBottom) / 2 - 10}" text-anchor="middle"
        style="font-family:var(--font-display); font-size:16px; font-weight:700; fill:var(--signal); letter-spacing:.1em;">
        ${muxType}:1 MUX
      </text>
      <text x="${(muxLeft + muxRight) / 2}" y="${(muxTop + muxBottom) / 2 + 14}" text-anchor="middle"
        style="font-family:var(--font-data); font-size:11px; fill:var(--text-dim);">
        ${data.isEnabled ? 'ENABLED' : 'DISABLED'}
      </text>
    `;

    // 1. Draw Data Inputs (Left side)
    const dataSpacing = (muxBottom - muxTop - 20) / (n - 1 || 1);
    for (let i = 0; i < n; i++) {
      const y = muxTop + 10 + i * dataSpacing;
      const isSelected = i === data.selDecimal && data.isEnabled;
      const val = data.curData[i];
      const strokeColor = isSelected ? (val === 1 ? 'var(--signal)' : 'var(--red)') : (val === 1 ? 'var(--signal-dim)' : 'var(--line)');
      const filterAttr = isSelected ? 'filter="url(#glow-signal)" stroke-width="3"' : 'stroke-width="1.8"';

      // Pin wire from left
      svg += `
        <line x1="20" y1="${y}" x2="${muxLeft}" y2="${y}" stroke="${strokeColor}" ${filterAttr} />
        <circle cx="20" cy="${y}" r="3.5" fill="${strokeColor}" />
        <text x="12" y="${y + 4}" text-anchor="end" class="var-label" style="${isSelected ? 'font-weight:700; fill:var(--signal);' : 'fill:var(--text-dim);'} font-size:12px;">
          D${i}=${val}
        </text>
        <text x="${muxLeft + 10}" y="${y + 4}" class="gate-label" style="${isSelected ? 'fill:var(--signal); font-weight:700;' : 'fill:var(--text-faint);'}">
          D${i}
        </text>
      `;

      // Draw active routing path inside trapezoid
      if (isSelected) {
        const outY = (muxRightTop + muxRightBottom) / 2;
        svg += `
          <path d="M${muxLeft} ${y} Q${(muxLeft + muxRight)/2} ${y} ${muxRight} ${outY}"
            stroke="var(--signal)" stroke-width="2.8" fill="none" filter="url(#glow-signal)" class="pulse-path" />
        `;
      }
    }

    // 2. Draw Select Lines (Bottom)
    const selSpacing = 40;
    const selStartX = (muxLeft + muxRight) / 2 - ((k - 1) * selSpacing) / 2;
    for (let s = 0; s < k; s++) {
      const x = selStartX + s * selSpacing;
      const selName = cfg.selectNames[s];
      const sVal = data.selBits[s];
      const strokeColor = sVal === 1 ? 'var(--amber)' : 'var(--line)';

      svg += `
        <line x1="${x}" y1="${muxBottom}" x2="${x}" y2="${H - 10}" stroke="${strokeColor}" stroke-width="2" />
        <circle cx="${x}" cy="${H - 10}" r="3.5" fill="${strokeColor}" />
        <text x="${x}" y="${H - 1}" text-anchor="middle" style="font-family:var(--font-data); font-size:11px; fill:var(--amber); font-weight:700;">
          ${selName}=${sVal}
        </text>
      `;
    }

    // 3. Draw Enable Strobe (Top)
    const enableX = (muxLeft + muxRight) / 2;
    const enableStroke = data.isEnabled ? 'var(--signal)' : 'var(--red)';
    svg += `
      <line x1="${enableX}" y1="10" x2="${enableX}" y2="${muxTop}" stroke="${enableStroke}" stroke-width="2" />
      <circle cx="${enableX}" cy="10" r="3.5" fill="${enableStroke}" />
      <circle cx="${enableX}" cy="${muxTop - 5}" r="3.5" class="gate-bubble" />
      <text x="${enableX}" y="6" text-anchor="middle" style="font-family:var(--font-data); font-size:11px; fill:var(--text-dim);">
        Ē=${enableActiveLow}
      </text>
    `;

    // 4. Draw Outputs (Right side)
    const outY = (muxRightTop + muxRightBottom) / 2;
    const outVal = data.routedValue;
    const outStroke = data.isEnabled ? (outVal === 1 ? 'var(--signal)' : 'var(--text-faint)') : 'var(--line)';

    svg += `
      <!-- Main Output Y -->
      <line x1="${muxRight}" y1="${outY}" x2="${W - 40}" y2="${outY}" stroke="${outStroke}" stroke-width="3" ${data.isEnabled ? 'filter="url(#glow-signal)"' : ''} />
      <circle cx="${W - 40}" cy="${outY}" r="4.5" fill="${outStroke}" />
      <text x="${W - 30}" y="${outY + 5}" class="out-label" style="font-size:15px; fill:${outStroke};">
        Y = ${data.isEnabled ? outVal : '0 (DIS)'}
      </text>

      <!-- Inverted Output Y' (or W in 74151) -->
      <line x1="${muxRight}" y1="${outY + 25}" x2="${W - 65}" y2="${outY + 25}" stroke="var(--line)" stroke-width="1.8" />
      <circle cx="${W - 60}" cy="${outY + 25}" r="3.5" class="gate-bubble" />
      <line x1="${W - 55}" y1="${outY + 25}" x2="${W - 40}" y2="${outY + 25}" stroke="var(--line)" stroke-width="1.8" />
      <circle cx="${W - 40}" cy="${outY + 25}" r="3.5" fill="var(--text-faint)" />
      <text x="${W - 30}" y="${outY + 29}" style="font-family:var(--font-data); font-size:12px; fill:var(--text-dim);">
        W (Ȳ) = ${data.isEnabled ? data.invertedValue : '0'}
      </text>
    `;

    svg += '</svg>';
    container.innerHTML = svg;
  }

  /* ===================== Truth Table & Equation ===================== */

  function renderTruthTable() {
    const container = document.getElementById('mux-truth-table');
    if (!container) return;

    const data = computeMux();
    const cfg = data.cfg;

    let html = `
      <table class="tt">
        <thead>
          <tr>
            <th>Ē (Strobe)</th>
            ${cfg.selectNames.map(s => `<th>${s}</th>`).join('')}
            <th>Active Channel</th>
            <th>Output (Y)</th>
          </tr>
        </thead>
        <tbody>
          <!-- Disabled Row -->
          <tr style="${enableActiveLow === 1 ? 'background:rgba(255,107,107,0.12); font-weight:700;' : ''}">
            <td style="color:var(--red);">1 (H)</td>
            ${cfg.selectNames.map(() => `<td>X</td>`).join('')}
            <td style="color:var(--text-faint);">None (Disabled)</td>
            <td style="color:var(--text-faint);">0</td>
          </tr>
          <!-- Enabled Rows -->
          ${Array.from({ length: data.n }, (_, i) => {
            const isRowActive = (enableActiveLow === 0 && i === data.selDecimal);
            const rowSelBits = [];
            for (let b = data.k - 1; b >= 0; b--) {
              rowSelBits.push((i >> b) & 1);
            }
            const dVal = data.curData[i];
            return `
              <tr style="${isRowActive ? 'background:rgba(107,255,176,0.14); font-weight:700;' : ''}">
                <td style="color:var(--signal);">0 (L)</td>
                ${rowSelBits.map(b => `<td>${b}</td>`).join('')}
                <td><strong style="color:${isRowActive ? 'var(--signal)' : 'var(--text-dim)'};">D<sub>${i}</sub></strong></td>
                <td style="color:${isRowActive ? (dVal ? 'var(--signal)' : 'var(--text-faint)') : 'var(--text-dim)'};">
                  D<sub>${i}</sub> (${dVal})
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    container.innerHTML = html;
  }

  function renderEquation() {
    const container = document.getElementById('mux-equation-display');
    if (!container) return;

    const data = computeMux();
    const cfg = data.cfg;

    const terms = [];
    for (let i = 0; i < data.n; i++) {
      const literals = [];
      for (let b = 0; b < data.k; b++) {
        const bitVal = (i >> (data.k - 1 - b)) & 1;
        const sName = cfg.selectNames[b];
        literals.push(bitVal === 1 ? sName : sName + "'");
      }
      const termStr = `${literals.join('')}·D<sub>${i}</sub>`;
      const isSelected = enableActiveLow === 0 && i === data.selDecimal;
      if (isSelected) {
        terms.push(`<span class="active-mux-term" style="color:var(--signal); background:rgba(107,255,176,0.15); padding:2px 6px; border-radius:3px; border:1px solid var(--signal-dim);">${termStr}</span>`);
      } else {
        terms.push(`<span style="color:var(--text-dim);">${termStr}</span>`);
      }
    }

    const eqHtml = `
      <div class="expr-display">
        <span class="lbl">SOP Multiplexer Signal Routing Equation</span>
        <div>Y = Ē' · [ ${terms.join(' + ')} ]</div>
        <div style="margin-top:8px; font-size:16px;">
          Current Output: <strong style="color:var(--signal); font-size:22px;">Y = ${data.isEnabled ? data.routedValue : 0}</strong>
          ${!data.isEnabled ? ' <span style="font-size:12px; color:var(--red);">(Strobe Disabled)</span>' : ` <span style="font-size:13px; color:var(--text-dim);">(Routed from D<sub>${data.selDecimal}</sub> = ${data.routedValue})</span>`}
        </div>
      </div>
    `;

    container.innerHTML = eqHtml;
  }

  /* ===================== Universal Logic Generator ===================== */

  const UNIVERSAL_PRESETS = [
    {
      name: 'AND Gate: F(A, B) = A · B (using 4:1 MUX)',
      size: 4,
      desc: 'Select lines S1=A, S0=B. Inputs: D0=0, D1=0, D2=0, D3=1.',
      data: [0, 0, 0, 1]
    },
    {
      name: 'OR Gate: F(A, B) = A + B (using 4:1 MUX)',
      size: 4,
      desc: 'Select lines S1=A, S0=B. Inputs: D0=0, D1=1, D2=1, D3=1.',
      data: [0, 1, 1, 1]
    },
    {
      name: 'XOR Gate: F(A, B) = A ⊕ B (using 4:1 MUX)',
      size: 4,
      desc: 'Select lines S1=A, S0=B. Inputs: D0=0, D1=1, D2=1, D3=0.',
      data: [0, 1, 1, 0]
    },
    {
      name: 'Full Adder Sum: F(A, B, C) (using 8:1 MUX)',
      size: 8,
      desc: 'Select lines S2=A, S1=B, S0=C. Inputs: D1, D2, D4, D7 = 1; others = 0.',
      data: [0, 1, 1, 0, 1, 0, 0, 1]
    },
    {
      name: 'Majority Vote (2 of 3): F(A, B, C) (using 8:1 MUX)',
      size: 8,
      desc: 'Select lines S2=A, S1=B, S0=C. Inputs: D3, D5, D6, D7 = 1; others = 0.',
      data: [0, 0, 0, 1, 0, 1, 1, 1]
    }
  ];

  function renderUniversalPresets() {
    const select = document.getElementById('mux-universal-select');
    if (!select) return;

    let html = '<option value="">-- Choose a standard logic function to synthesize --</option>';
    UNIVERSAL_PRESETS.forEach((p, idx) => {
      html += `<option value="${idx}">${p.name}</option>`;
    });
    select.innerHTML = html;

    select.addEventListener('change', () => {
      const idx = select.value;
      if (idx === '') return;
      const p = UNIVERSAL_PRESETS[parseInt(idx, 10)];
      if (!p) return;

      muxType = p.size;
      enableActiveLow = 0;
      dataInputs.fill(0);
      p.data.forEach((v, i) => dataInputs[i] = v);

      const descBox = document.getElementById('mux-universal-desc');
      if (descBox) {
        descBox.innerHTML = `<div class="hint" style="color:var(--signal); margin-top:8px;">${p.desc}</div>`;
      }

      renderTypeSelector();
      refreshMuxView();
    });
  }

  function bindEvents() {
    renderUniversalPresets();

    if (window.BoolUI && window.BoolUI.registerModuleHook) {
      window.BoolUI.registerModuleHook('module-mux', () => {
        refreshMuxView();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMuxModule);
  } else {
    initMuxModule();
  }
})();
