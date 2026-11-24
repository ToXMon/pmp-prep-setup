export const day = 86_400_000;
const tokens = s => s.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
const stop = new Set(['a','an','and','the','of','for','to','how','what','which','is','in','do','with']);
export function search(topics, query) {
  const words = [...new Set(tokens(query).filter(w => !stop.has(w)))];
  if (!words.length) return query.trim() ? [] : topics;
  return topics.map(topic => {
    const title = new Set(tokens(topic.title));
    const context = new Set(tokens(`${topic.summary} ${topic.source}`));
    const score = words.reduce((n, w) => n + (title.has(w) ? 4 : Number(context.has(w))), 0);
    return {topic,score};
  }).filter(hit => hit.score).sort((a,b) => b.score - a.score).map(hit => hit.topic);
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
