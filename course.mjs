const revision = '27d4ff809f152833629de9b0c842ff3c751ad8a5';
const base = `https://raw.githubusercontent.com/tolu-jnj/PMP/${revision}/`;
export const tracks = [['s4','Session 4'],['s1','Session 1'],['s2','Session 2'],['s3','Session 3'],['s5','Session 5'],['ethics','Ethics']];
import {priorities} from './coverage.mjs';
const existing = new Set('gates comms charter norms lead conflict forecast risk evm quality retro qualityplan procurement environment closure responsibility respect disclosure honesty'.split(' '));
export const topics = [
 ['gates','s1',67,'Phase gates','Predictive governance, phase boundaries, deliverable review, risks and decisions about continuing. Printed slide 68.'],
 ['comms','s1',96,'Stakeholder and communications plans','Decide how to involve stakeholders, then plan what to communicate, to whom and when. Printed slide 97.'],
 ['charter','s1',113,'Project charter','Formal authorization, sponsorship and authority to apply resources.'],
 ['norms','s2',80,'Team norms','Agree on expectations for meetings, communication, decisions and conflict.'],
 ['lead','s2',86,'Servant leadership','Coach the team, facilitate decisions and remove impediments.'],
 ['conflict','s2',134,'Conflict management approaches','Choose an approach suited to the conflict and the need for a lasting resolution.'],
 ['forecast','s3',160,'Forecasting','Compare expert judgment, quantitative historical trends and causal or econometric models.'],
 ['risk','s3',88,'Risk register','Document uncertain events, project impacts and response information.'],
 ['evm','s3',162,'Earned value forecasting','Estimate at completion (EAC) and estimate to complete (ETC).'],
 ['quality','s4',109,'Cost of quality','Distinguish prevention, appraisal, internal failure and external failure. Susan: Zoom rows 1367–1370.'],
 ['retro','s4',141,'Retrospectives','Prepare and facilitate a team reflection, then agree on improvements to try.'],
 ['qualityplan','s4',110,'Quality policy and management plan','Use organization-wide policy and define project-specific quality methods.'],
 ['procurement','s5',19,'Procurement closeout','Evaluate vendor performance and compliance before formal closeout. Susan: Zoom rows 301–303.'],
 ['environment','s5',119,'External business environment','Compare PESTLE, TECOP and VUCA as prompts for assessing changes. Susan: Zoom rows 1357–1365.'],
 ['closure','s5',143,'Project or phase closure','Obtain acceptance, transition deliverables, archive records and release resources. Susan: Zoom rows 1758–1777.'],
 ['responsibility','ethics',9,'Responsibility: mandatory standards','Know applicable rules and handle potential violations responsibly. Code §2.3.'],
 ['respect','ethics',11,'Respect: mandatory standards','Good-faith negotiation, appropriate use of expertise, and respect for property. Code §3.3.'],
 ['disclosure','ethics',13,'Fairness: conflict disclosure','Disclose actual or potential conflicts of interest. Code §4.3.1.'],
 ['honesty','ethics',15,'Honesty: misleading communications','Do not mislead through false statements, omissions or half-truths. Code §5.3.1.'],
].concat(priorities.filter(row => !existing.has(row[0])).map(([id,track,page,title,,summary])=>[id,track,page,title,summary])).map(([id,track,page,title,summary]) => {
 const name = track === 'ethics' ? 'PMI Code of Ethics.pdf' : `PMP 5-Day Session ${track.slice(1)} Slide Deck Sep 2026.pdf`;
 if (id === 'scrum') return {id,track,title,summary,source:'The Scrum Guide',url:'https://scrumguides.org/scrum-guide.html'};
 if (id === 'acronyms') return {id,track,title,summary,source:'Course source collection',url:`https://github.com/tolu-jnj/PMP/tree/${revision}`};
 return {id,track,page,title,summary,source:`${name.replace('.pdf','')}, PDF p. ${page}`,url:`${base}${encodeURIComponent(name)}#page=${page}`};
});
export const byTopic = Object.fromEntries(topics.map(t=>[t.id,t]));
