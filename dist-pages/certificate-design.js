import { escapeHTML as e } from './studio-utils.js';

// Preserve the supplied artwork verbatim; only its five placeholder values change.
export function certificateDocument({ name, course, duration, date, id, score }, assetUrl) {
  const parsed = date ? new Date(date) : null;
  const completed = parsed && !Number.isNaN(parsed.getTime())
    ? `${String(parsed.getDate()).padStart(2, '0')}/${String(parsed.getMonth() + 1).padStart(2, '0')}/${parsed.getFullYear()}` : 'Not recorded';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>MAGIVOX AI Certificate</title><style>
    @page{size:A4 landscape;margin:0}
    *{box-sizing:border-box}body{margin:0;background:#e9edf3;color:#081c50;font-family:Arial,sans-serif}
    .toolbar{padding:16px;text-align:center;font-size:14px}.toolbar button{padding:10px 24px;cursor:pointer}
    .certificate{position:relative;width:1080px;height:720px;margin:0 auto;overflow:hidden;background:#fdfdfd}
    .art{position:absolute;inset:0;width:100%;height:100%}
    .value{position:absolute;display:flex;align-items:center;justify-content:center;background:#fdfdfd;overflow:hidden;overflow-wrap:anywhere;text-align:center;line-height:1.08}
    .name{left:245px;top:255px;width:590px;height:57px;font: bold 48px Georgia,serif}
    .course{left:230px;top:389px;width:620px;height:37px;font-size:29px;font-weight:700}
    .detail{top:510px;height:23px;font-size:13px;justify-content:flex-start;text-align:left;color:#253449}
    .duration{left:252px;width:143px}.date{left:496px;width:145px}.id{left:736px;width:242px}
    @media print{body{background:white}.toolbar{display:none}.certificate{margin:0;width:297mm;height:198mm;position:absolute;top:6mm;left:0;zoom:1}.art{width:1080px;height:720px}.certificate{width:1080px;height:720px;zoom:1.03937}*{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
  </style></head><body><div class="toolbar"><button onclick="window.print()">Print / Save PDF</button><p>MAGIVOX learning certificate · Not an accredited degree or employer credential.</p><p id="status" role="status">Loading certificate artwork…</p></div>
  <main class="certificate" aria-label="Certificate of Course Completion for ${e(name)}">
    <img class="art" src="${e(assetUrl)}" alt="MAGIVOX AI certificate artwork: gold certified seal, signature of Head of Learning and Development, and blue corner ribbons">
    <div class="value name">${e(name || 'Learner')}</div><div class="value course">${e(`${course || 'Course'}${Number.isFinite(Number(score))?` · ${Math.round(Number(score))}%`:''}`)}</div>
    <div class="value detail duration">${e(duration || 'Not recorded')}</div><div class="value detail date">${e(completed)}</div><div class="value detail id">${e(id)}</div>
  </main><script>
    const art=document.querySelector('.art');
    function ready(){for(const field of document.querySelectorAll('.value')){let size=parseFloat(getComputedStyle(field).fontSize);while((field.scrollWidth>field.clientWidth||field.scrollHeight>field.clientHeight)&&size>10){field.style.fontSize=(--size)+'px'}}document.getElementById('status').textContent='Ready to print. Choose landscape and turn off headers and footers.';}
    art.onload=ready;art.onerror=()=>{document.getElementById('status').textContent='Certificate artwork could not load. Please close this window and try again.';document.querySelector('button').disabled=true};if(art.complete&&art.naturalWidth)ready();
  </script></body></html>`;
}

export function openCertificate(details) {
  const popup = window.open('', '_blank');
  if (!popup) { window.alert('Allow pop-ups to print or save your certificate.'); return; }
  popup.opener = null;
  popup.document.write(certificateDocument(details, new URL('./resources/certificates/magivox-reference.jpeg', import.meta.url).href));
  popup.document.close();
}
