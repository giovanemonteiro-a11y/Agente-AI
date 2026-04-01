const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const OUTPUT = path.resolve(__dirname, '../client/public/backup-maria-teste-silva.pdf');

const C = {
  bgDeep: '#0A0A14', bgCard: '#141422', blue: '#1A56DB', blueLight: '#3B76F6',
  pink: '#E040FB', purple: '#7C3AED', textPrimary: '#F0F0FF', textSecondary: '#A0A0C0',
  textMuted: '#606080', border: '#1E1E36', emerald: '#10B981', amber: '#F59E0B',
  white: '#FFFFFF',
};

// Disable auto page breaks by using large page height initially, then we control pagination manually
const doc = new PDFDocument({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 }, autoFirstPage: false });
const stream = fs.createWriteStream(OUTPUT);
doc.pipe(stream);

const PW = 595.28, PH = 841.89, ML = 50, MR = 50, CW = PW - ML - MR;
let y = 0;
let pageNum = 0;

function startPage() {
  doc.addPage({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  pageNum++;
  doc.save().rect(0, 0, PW, PH).fill(C.bgDeep).restore();
  // Footer
  doc.save().font('Helvetica').fontSize(6).fillColor(C.textMuted);
  doc.text('Documento gerado automaticamente pela plataforma AI SICI', ML, PH - 25, { width: CW * 0.6, lineBreak: false });
  doc.text('V4 Company — Pagina ' + pageNum, ML + CW * 0.6, PH - 25, { width: CW * 0.4, align: 'right', lineBreak: false });
  doc.restore();
  y = 45;
}

function need(h) { if (y + h > PH - 45) startPage(); }

function rect(x, yy, w, h, fill, r) {
  doc.save();
  if (r) doc.roundedRect(x, yy, w, h, r).fill(fill);
  else doc.rect(x, yy, w, h).fill(fill);
  doc.restore();
}

function line(x1, yy, x2, color) {
  doc.save().moveTo(x1, yy).lineTo(x2, yy).strokeColor(color).lineWidth(0.3).stroke().restore();
}

function t(str, x, yy, opts = {}) {
  doc.save().fillColor(opts.c || C.textPrimary).fontSize(opts.s || 9);
  doc.font(opts.b ? 'Helvetica-Bold' : 'Helvetica');
  doc.text(str, x, yy, { width: opts.w || CW, lineGap: 2, align: opts.a, lineBreak: opts.wrap !== false });
  doc.restore();
}

function sectionBar(label, color) {
  need(30);
  rect(ML, y, 4, 16, color, 2);
  t(label, ML + 14, y + 2, { s: 10, b: true, c: color });
  y += 26;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 1 — Header + Member Data + Activity Summary + Clients
// ═══════════════════════════════════════════════════════════════════════════════
startPage();

// Dark header
rect(0, 0, PW, 75, '#0D0D1E');
rect(0, 73, PW, 2, C.blue);

rect(ML, 14, 28, 28, C.blue, 7);
t('AI SICI', ML + 38, 16, { s: 14, b: true, c: C.blueLight });
t('Agencia Inteligente', ML + 38, 32, { s: 7.5, c: C.textMuted });

rect(PW - MR - 140, 14, 140, 18, '#2D0A40', 4);
t('CONFIDENCIAL', PW - MR - 138, 17, { s: 7, b: true, c: C.pink, w: 136, a: 'center' });
t('26 de marco de 2026', PW - MR - 140, 36, { s: 6.5, c: C.textMuted, w: 140, a: 'center' });

y = 92;
t('Relatorio de Governanca', ML, y, { s: 18, b: true });
y += 22;
t('Backup de Membro Desligado', ML, y, { s: 11, c: C.textSecondary });
y += 18;
line(ML, y, PW - MR, C.border);
y += 14;

// DADOS DO MEMBRO
sectionBar('DADOS DO MEMBRO', C.blueLight);
rect(ML, y, CW, 110, C.bgCard, 6);
const fields = [
  ['Nome Completo', 'Maria Teste Silva'], ['E-mail', 'maria.teste@v4company.com'],
  ['Cargo', 'Account Manager'], ['Data de Admissao', '26 de marco de 2026'],
  ['Data de Desligamento', '26 de marco de 2026'], ['Desligado por', 'Bruno Henrique (Lideranca)'],
  ['Tempo na Plataforma', '1 dia'],
];
let fy = y + 8;
fields.forEach((f, i) => {
  const col = i % 2, fx = ML + 12 + col * (CW / 2 - 5);
  t(f[0], fx, fy, { s: 6.5, c: C.textMuted, w: CW / 2 - 20 });
  t(f[1], fx, fy + 9, { s: 8.5, b: true, w: CW / 2 - 20 });
  if (col === 1 || i === fields.length - 1) fy += 24;
});
y += 120;

// RESUMO DE ATIVIDADES
sectionBar('RESUMO DE ATIVIDADES', C.pink);
rect(ML, y, 120, 36, C.bgCard, 6);
t('Total de acoes', ML + 10, y + 6, { s: 6.5, c: C.textMuted, w: 100 });
t('47', ML + 10, y + 16, { s: 16, b: true, c: C.blueLight, w: 100 });

const acts = [
  ['Estrategias', '8', C.blueLight], ['Reunioes', '12', C.emerald],
  ['Check-ins', '6', C.amber], ['Briefings', '5', C.pink],
  ['WhatsApp', '4', C.purple], ['One Page Summary', '3', C.blueLight],
  ['Sprints', '4', C.emerald], ['Relatorios', '5', C.textSecondary],
];
const ax0 = ML + 135;
acts.forEach((a, i) => {
  const row = Math.floor(i / 2), col = i % 2;
  const ax = ax0 + col * ((CW - 135) / 2), ay = y + row * 18;
  rect(ax, ay + 3, 4, 4, a[2], 1);
  t(a[0], ax + 8, ay + 1, { s: 7, c: C.textSecondary, w: 110, wrap: false });
  t(a[1], ax + (CW - 135) / 2 - 30, ay + 1, { s: 7.5, b: true, w: 20, a: 'right' });
});
y += 80;

// CLIENTES ATENDIDOS
sectionBar('CLIENTES ATENDIDOS', C.emerald);
rect(ML, y, CW, 18, '#161628', 3);
t('Cliente', ML + 10, y + 5, { s: 6.5, b: true, c: C.textMuted, w: 150 });
t('Segmento', ML + 170, y + 5, { s: 6.5, b: true, c: C.textMuted, w: 80 });
t('Periodo', ML + 270, y + 5, { s: 6.5, b: true, c: C.textMuted, w: 120 });
t('Acoes', ML + 420, y + 5, { s: 6.5, b: true, c: C.textMuted, w: 60, a: 'center' });
y += 20;

[['Empresa Alpha Tech', 'Tecnologia', '01/03 - 26/03/2026', '28'],
 ['Moda Nova Brasil', 'Moda', '15/03 - 26/03/2026', '19']].forEach((c, i) => {
  if (i > 0) line(ML + 5, y, PW - MR - 5, C.border);
  t(c[0], ML + 10, y + 4, { s: 8.5, b: true, w: 150 });
  t(c[1], ML + 170, y + 5, { s: 8, c: C.textSecondary, w: 80 });
  t(c[2], ML + 270, y + 5, { s: 7, c: C.textMuted, w: 120 });
  rect(ML + 430, y + 2, 26, 15, '#1A56DB30', 3);
  t(c[3], ML + 420, y + 4, { s: 8, b: true, c: C.blueLight, w: 60, a: 'center' });
  y += 22;
});
y += 10;

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 2 — Action History (first 10)
// ═══════════════════════════════════════════════════════════════════════════════
startPage();

sectionBar('HISTORICO DETALHADO DE ACOES', C.purple);
t('Ultimas 20 acoes registradas na plataforma', ML + 14, y - 16, { s: 7, c: C.textMuted });

const actions = [
  ['26/03 14:32', 'Atualizou estrategia', 'Alpha Tech', 'Revisou posicionamento e diferenciais', C.blueLight],
  ['26/03 11:15', 'Gerou briefing', 'Moda Nova', 'Briefing campanha outono/inverno', C.pink],
  ['26/03 10:00', 'Registrou check-in', 'Alpha Tech', 'Check-in quinzenal com Carlos Silva', C.amber],
  ['25/03 16:45', 'Atualizou sprint', 'Alpha Tech', '3 novas demandas na sprint', C.emerald],
  ['25/03 14:20', 'Extraiu demanda WhatsApp', 'Moda Nova', 'Criativos urgentes para promocao', C.purple],
  ['25/03 11:30', 'Gerou briefing', 'Alpha Tech', 'Landing page de produto novo', C.pink],
  ['25/03 09:00', 'Atualizou One Page Summary', 'Alpha Tech', 'Dados do ultimo check-in', C.blueLight],
  ['24/03 17:00', 'Registrou reuniao', 'Moda Nova', 'Kick-off com Ana Beatriz', C.emerald],
  ['24/03 15:30', 'Criou estrategia', 'Moda Nova', 'Social media + trafego inicial', C.blue],
  ['24/03 14:00', 'Atualizou sprint', 'Moda Nova', 'Tarefas de onboarding', C.emerald],
  ['24/03 10:00', 'Registrou check-in', 'Alpha Tech', 'Alinhamento com CEO', C.amber],
  ['23/03 16:00', 'Gerou briefing', 'Alpha Tech', 'Social media mensal', C.pink],
  ['23/03 14:30', 'Extraiu demanda WhatsApp', 'Alpha Tech', 'Relatorio de performance', C.purple],
  ['23/03 11:00', 'Atualizou estrategia', 'Alpha Tech', 'Tom de voz para publico B2B', C.blueLight],
  ['22/03 17:00', 'Registrou reuniao', 'Alpha Tech', 'Planejamento mensal', C.emerald],
  ['22/03 15:00', 'Atualizou One Page Summary', 'Moda Nova', 'Resumo inicial do cliente', C.blueLight],
  ['22/03 13:00', 'Criou estrategia', 'Alpha Tech', 'Foco em geracao de leads v2', C.blue],
  ['21/03 16:30', 'Gerou briefing', 'Alpha Tech', 'Trafego pago Google Ads', C.pink],
  ['21/03 14:00', 'Atualizou sprint', 'Alpha Tech', 'Reorganizou prioridades', C.emerald],
  ['21/03 10:00', 'Registrou reuniao', 'Alpha Tech', 'Check-in com equipe marketing', C.emerald],
];

// Table header
rect(ML, y, CW, 16, '#161628', 2);
t('#', ML + 5, y + 4, { s: 6, b: true, c: C.textMuted, w: 16 });
t('Data', ML + 22, y + 4, { s: 6, b: true, c: C.textMuted, w: 65 });
t('Acao', ML + 90, y + 4, { s: 6, b: true, c: C.textMuted, w: 140 });
t('Cliente', ML + 240, y + 4, { s: 6, b: true, c: C.textMuted, w: 75 });
t('Detalhes', ML + 320, y + 4, { s: 6, b: true, c: C.textMuted, w: 175 });
y += 18;

actions.forEach((a, i) => {
  need(20);
  if (i > 0) line(ML + 3, y, PW - MR - 3, C.border);
  if (i % 2 === 0) rect(ML, y, CW, 18, C.bgCard, 1);

  const ry = y + 4;
  t(String(i + 1).padStart(2, '0'), ML + 5, ry, { s: 6.5, c: C.textMuted, w: 16 });
  t(a[0], ML + 22, ry, { s: 6.5, c: C.textSecondary, w: 65, wrap: false });
  rect(ML + 90, ry + 2, 3, 3, a[4], 1);
  t(a[1], ML + 96, ry, { s: 6.5, b: true, c: a[4], w: 140, wrap: false });
  t(a[2], ML + 240, ry, { s: 6.5, c: C.textPrimary, w: 75, wrap: false });
  t(a[3], ML + 320, ry, { s: 6, c: C.textMuted, w: 175, wrap: false });
  y += 19;
});

y += 15;

// OBSERVACOES
sectionBar('OBSERVACOES', C.amber);
need(80);
rect(ML, y, CW, 72, C.bgCard, 6);
const obs = [
  'Todas as estrategias e briefings permanecem ativos nos respectivos clientes.',
  'Os dados de check-ins e reunioes foram preservados integralmente.',
  'Recomenda-se que o trio responsavel revise as sprints pendentes.',
];
let oy = y + 10;
obs.forEach((o) => {
  rect(ML + 12, oy + 3, 3, 3, C.amber, 1);
  t(o, ML + 20, oy, { s: 7.5, c: C.textSecondary, w: CW - 35 });
  oy += 18;
});
y += 82;

// Final notice
need(20);
line(ML, y, PW - MR, C.border);
y += 8;
t('Este documento e confidencial e destinado exclusivamente para uso interno da lideranca.', ML, y, { s: 7, c: C.textMuted, w: CW, a: 'center' });

doc.end();
stream.on('finish', () => {
  console.log('PDF generated:', OUTPUT);
  console.log('Pages:', pageNum);
  console.log('Size:', (fs.statSync(OUTPUT).size / 1024).toFixed(1), 'KB');
});
