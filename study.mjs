export const day = 86_400_000;
const tokens = s => s.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
export function search(documents, query) {
  const words = [...new Set(tokens(query))];
  if (!words.length) return [];
  const hits = [];
  for (const {name,text} of documents) {
    let heading = '';
    for (const [i, raw] of text.split(/\r?\n/).entries()) {
      if (/^#{1,6} /.test(raw)) heading = raw.replace(/^#+ /,'');
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const set = new Set(tokens(line));
      const score = words.reduce((n,w) => n + +set.has(w),0);
      if (score) hits.push({name,line:i+1,text:`${heading ? `${heading}: ` : ''}${line.slice(0,500)}`,score});
    }
  }
  return hits.sort((a,b) => b.score-a.score).slice(0,10);
}
export function nextDrill(drills, history, track, now = Date.now()) {
  const seen = new Set();
  for (const drill of drills) {
    if (drill.track !== track || seen.has(drill.concept)) continue;
    seen.add(drill.concept);
    const previous = history[`${track}:${drill.concept}`];
    if (previous?.due > now) continue;
    return drills.find(d => d.track === track && d.concept === drill.concept && d.id !== previous?.last) ?? drill;
  }
  return null;
}
