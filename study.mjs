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
  const groups = new Map();
  for (const drill of drills) {
    if (drill.track !== track) continue;
    if (!groups.has(drill.concept)) groups.set(drill.concept, []);
    groups.get(drill.concept).push(drill);
  }
  const completed = previous => new Set(Array.isArray(previous?.attempted) ? previous.attempted : [previous?.last]);
  for (const group of groups.values()) {
    const previous = history[`${track}:${group[0].concept}`];
    if (!previous) return group[0];
  }
  for (const group of groups.values()) {
    const previous = history[`${track}:${group[0].concept}`];
    const seen = completed(previous);
    const firstUnseen = group.find(d => !seen.has(d.id));
    if (firstUnseen) return firstUnseen;
  }
  for (const group of groups.values()) {
    const previous = history[`${track}:${group[0].concept}`];
    if (!(previous?.due > now)) return group[(group.findIndex(d => d.id === previous?.last) + 1) % group.length];
  }
  return null;
}
