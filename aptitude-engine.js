export const APTITUDE_TOPICS = Object.freeze([
  'BODMAS','Percentages','Profit & Loss','Ratio & Proportion','Average','Time & Work','Time, Speed & Distance','Simple Interest','Compound Interest','Ages','Number System','Data Interpretation','Probability','Permutations & Combinations'
]);
export const REASONING_TOPICS = Object.freeze([
  'Number Series','Letter Series','Coding-Decoding','Blood Relations','Directions','Analogy','Classification','Syllogism','Seating Arrangement','Puzzles','Logical Reasoning'
]);
export const DIFFICULTIES = Object.freeze(['Easy','Medium','Hard']);

const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const hash=value=>{let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
function random(seed){let x=hash(seed)||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};}
const int=(r,min,max)=>Math.floor(r()*(max-min+1))+min;
const pick=(r,items)=>items[int(r,0,items.length-1)];
function shuffled(items,r){const out=[...items];for(let i=out.length-1;i>0;i--){const j=int(r,0,i);[out[i],out[j]]=[out[j],out[i]];}return out;}
const money=n=>`₹${Number(n).toLocaleString('en-IN')}`;
const pct=n=>Number.isInteger(n)?`${n}%`:`${n.toFixed(1)}%`;

function choiceQuestion({topic,category,difficulty,prompt,answer,distractors,hint,explanation,formula='',shortcut=''},r){
  const values=[String(answer),...distractors.map(String)].filter((value,index,list)=>value&&list.indexOf(value)===index);
  const options=shuffled(values.slice(0,4),r),correct=options.indexOf(String(answer));
  const id=`${category.slice(0,1)}-${hash(`${topic}|${difficulty}|${prompt}`)}`;
  return {id,category,topic,difficulty,prompt,options,answer:correct,hint,explanation,formula,shortcut};
}
function numeric(meta,answer,r,{unit='',prefix='',hint,steps,formula='',shortcut=''}){
  const spread=Math.max(1,Math.round(Math.abs(answer)*.12));
  const raw=[answer+spread,answer-spread,answer+spread*2,answer-spread*2].filter(v=>v>=0&&v!==answer);
  const format=value=>`${prefix}${Number(value).toLocaleString('en-IN',{maximumFractionDigits:2})}${unit}`;
  return choiceQuestion({...meta,prompt:meta.prompt,answer:format(answer),distractors:raw.slice(0,3).map(format),hint,explanation:steps,formula,shortcut},r);
}

const names=['Asha','Manoj','Koushik','Neha','Ravi','Priya'];
function aptitudeQuestion(topic,difficulty,r){
  const level=DIFFICULTIES.indexOf(difficulty)+1,meta={topic,category:'Aptitude',difficulty};
  if(topic==='BODMAS'){const a=int(r,8,20)*level,b=int(r,2,7),c=int(r,2,6),d=int(r,1,6);const answer=a+b*c-d;return numeric({...meta,prompt:`Evaluate ${a} + ${b} × ${c} − ${d}.`},answer,r,{hint:'Complete multiplication before addition and subtraction.',steps:`First multiply: ${b} × ${c} = ${b*c}. Then calculate left to right: ${a} + ${b*c} − ${d} = ${answer}.`,formula:'BODMAS: Brackets, Orders, Division/Multiplication, Addition/Subtraction.',shortcut:'Underline multiplication and division before calculating.'});}
  if(topic==='Percentages'){const percent=pick(r,[10,15,20,25,30,40]),base=int(r,4,20)*20*level,answer=base*percent/100;return numeric({...meta,prompt:`What is ${percent}% of ${base}?`},answer,r,{hint:`Convert ${percent}% to ${percent}/100.`,steps:`${percent}% of ${base} = ${percent}/100 × ${base} = ${answer}.`,formula:'Percentage value = percentage ÷ 100 × total.',shortcut:percent===25?'25% is one quarter, so divide by 4.':'Find 10% first, then scale it.'});}
  if(topic==='Profit & Loss'){const cost=int(r,5,25)*100,rate=pick(r,[10,15,20,25]),profit=r()>.35,answer=profit?cost*(100+rate)/100:cost*(100-rate)/100;return numeric({...meta,prompt:`An item costs ${money(cost)} and is sold at a ${rate}% ${profit?'profit':'loss'}. Find the selling price.`},answer,r,{prefix:'₹',hint:`Apply ${100+(profit?rate:-rate)}% to the cost price.`,steps:`${profit?'Profit':'Loss'} = ${money(cost)} × ${rate}/100 = ${money(cost*rate/100)}. Selling price = ${money(answer)}.`,formula:`SP = CP × (100 ${profit?'+':'−'} rate) ÷ 100.`,shortcut:`Calculate ${rate}% of the cost, then ${profit?'add':'subtract'} it.`});}
  if(topic==='Ratio & Proportion'){const a=int(r,2,6),b=int(r,a+1,a+6),part=int(r,4,12)*level,total=(a+b)*part,answer=a*part;return numeric({...meta,prompt:`Two quantities are in the ratio ${a}:${b} and their total is ${total}. What is the smaller quantity?`},answer,r,{hint:`The total contains ${a+b} equal parts.`,steps:`One part = ${total} ÷ ${a+b} = ${part}. Smaller quantity = ${a} × ${part} = ${answer}.`,formula:'Required quantity = total ÷ sum of ratio parts × required parts.',shortcut:'Add ratio parts first.'});}
  if(topic==='Average'){const count=level+4,target=int(r,12,60),offsets=shuffled([-4,-2,0,2,4,6,-6],r).slice(0,count-1),last=target*count-offsets.reduce((s,x)=>s+target+x,0),values=[...offsets.map(x=>target+x),last],answer=target;return numeric({...meta,prompt:`Find the average of ${values.join(', ')}.`},answer,r,{hint:'Add the values and divide by their count.',steps:`Sum = ${values.reduce((a,b)=>a+b,0)}. Count = ${count}. Average = ${answer}.`,formula:'Average = sum of observations ÷ number of observations.',shortcut:'Use an assumed average and balance positive and negative deviations.'});}
  if(topic==='Time & Work'){const a=int(r,5,20),b=int(r,8,28),answer=Number((a*b/(a+b)).toFixed(2));return numeric({...meta,prompt:`A can finish a job in ${a} days and B in ${b} days. How many days will they take together?`},answer,r,{unit:' days',hint:'Add their one-day work rates.',steps:`Combined rate = 1/${a} + 1/${b} = (${a+b})/${a*b}. Time = ${a*b}/${a+b} = ${answer} days.`,formula:'Together time = ab ÷ (a + b).',shortcut:'Use the product-over-sum shortcut for two workers.'});}
  if(topic==='Time, Speed & Distance'){const speed=int(r,4,12)*10,time=int(r,2,5)+level/2,answer=speed*time;return numeric({...meta,prompt:`A vehicle travels at ${speed} km/h for ${time} hours. What distance does it cover?`},answer,r,{unit:' km',hint:'Multiply speed by time.',steps:`Distance = ${speed} × ${time} = ${answer} km.`,formula:'Distance = Speed × Time.',shortcut:'Keep units compatible before multiplying.'});}
  if(topic==='Simple Interest'){const principal=int(r,5,25)*500,rate=pick(r,[5,8,10,12]),time=int(r,2,5),answer=principal*rate*time/100;return numeric({...meta,prompt:`Find the simple interest on ${money(principal)} at ${rate}% per year for ${time} years.`},answer,r,{prefix:'₹',hint:'Multiply principal, rate and time, then divide by 100.',steps:`SI = ${principal} × ${rate} × ${time} ÷ 100 = ${money(answer)}.`,formula:'SI = P × R × T ÷ 100.',shortcut:'Find one-year interest first, then multiply by years.'});}
  if(topic==='Compound Interest'){const principal=int(r,4,12)*1000,rate=pick(r,[5,10,20]),time=2,amount=principal*Math.pow(1+rate/100,time),answer=Math.round(amount-principal);return numeric({...meta,prompt:`Find the compound interest on ${money(principal)} at ${rate}% per year for ${time} years, compounded annually.`},answer,r,{prefix:'₹',hint:'Calculate the amount after each year, then subtract the principal.',steps:`Amount = ${principal} × (1 + ${rate}/100)^${time} = ${money(amount)}. CI = ${money(amount)} − ${money(principal)} = ${money(answer)}.`,formula:'CI = P(1 + R/100)^T − P.',shortcut:'For 2 years, CI = simple interest for 2 years + interest on the first year’s interest.'});}
  if(topic==='Ages'){const current=int(r,18,42),years=int(r,3,10),answer=current+years;return numeric({...meta,prompt:`${pick(r,names)} is ${current} years old now. What will the age be after ${years} years?`},answer,r,{unit:' years',hint:'Future age means add the number of years.',steps:`Future age = ${current} + ${years} = ${answer} years.`,formula:'Future age = present age + elapsed years.',shortcut:'Draw a small now/future timeline.'});}
  if(topic==='Number System'){const divisor=pick(r,[3,4,5,9,11]),quotient=int(r,8,30),remainder=int(r,1,divisor-1),number=divisor*quotient+remainder;return numeric({...meta,prompt:`What is the remainder when ${number} is divided by ${divisor}?`},remainder,r,{hint:`Find the greatest multiple of ${divisor} below ${number}.`,steps:`${divisor} × ${quotient} = ${divisor*quotient}. Remainder = ${number} − ${divisor*quotient} = ${remainder}.`,formula:'Dividend = divisor × quotient + remainder.',shortcut:'Subtract the nearest lower multiple of the divisor.'});}
  if(topic==='Data Interpretation'){const values=[int(r,20,50),int(r,30,70),int(r,40,90),int(r,25,65)],labels=['Q1','Q2','Q3','Q4'],max=Math.max(...values),answer=labels[values.indexOf(max)];return choiceQuestion({...meta,prompt:`Quarterly sales are ${labels.map((x,i)=>`${x}: ${values[i]}`).join(', ')} units. Which quarter has the highest sales?`,answer,distractors:labels.filter(x=>x!==answer),hint:'Compare all four values before choosing.',explanation:`The largest value is ${max}, which belongs to ${answer}.`,formula:'Highest category = category with the maximum value.',shortcut:'Scan the values once while tracking the current maximum.'},r);}
  if(topic==='Probability'){const red=int(r,2,20),blue=int(r,2,20),total=red+blue,answer=`${red}/${total}`;return choiceQuestion({...meta,prompt:`A bag contains ${red} red and ${blue} blue balls. What is the probability of drawing a red ball?`,answer,distractors:[`${blue}/${total}`,`${red}/${total+1}`,`${Math.max(1,red-1)}/${total}`,`${red+1}/${total}`],hint:'Favourable outcomes go on top; total outcomes go below.',explanation:`There are ${red} favourable outcomes out of ${total} balls, so probability = ${answer}.`,formula:'Probability = favourable outcomes ÷ total outcomes.',shortcut:'Check that probability is between 0 and 1.'},r);}
  const n=int(r,5,30),k=level===1?2:int(r,2,Math.min(level+2,n-1)),comb=(n,k)=>{let value=1;for(let i=1;i<=k;i++)value=value*(n-k+i)/i;return Math.round(value);},answer=comb(n,k);return numeric({...meta,prompt:`In how many ways can ${k} people be chosen from a group of ${n}?`},answer,r,{hint:'Order does not matter, so use combinations.',steps:`${n}C${k} = ${n}! ÷ (${k}!(${n-k})!) = ${answer}.`,formula:'nCr = n! ÷ (r!(n−r)!).',shortcut:k===2?'For choosing 2, use n(n−1)/2.':'Cancel factorial terms before multiplying.'});
}

function reasoningQuestion(topic,difficulty,r){
  const level=DIFFICULTIES.indexOf(difficulty)+1,meta={topic,category:'Reasoning',difficulty};
  if(topic==='Number Series'){const start=int(r,1,35),step=int(r,2,15)*level,series=Array.from({length:5},(_,i)=>start+i*step),answer=start+5*step;return numeric({...meta,prompt:`Find the next number: ${series.join(', ')}, ?`},answer,r,{hint:'Compare consecutive terms.',steps:`Each term increases by ${step}. Therefore ${series[4]} + ${step} = ${answer}.`,formula:'Arithmetic series: next term = current term + common difference.',shortcut:'Write the differences below the series.'});}
  if(topic==='Letter Series'){const step=int(r,1,Math.min(4,level+1)),start=int(r,0,25-5*step),letters=Array.from({length:5},(_,i)=>String.fromCharCode(65+start+i*step)),answer=String.fromCharCode(65+start+5*step),distractors=shuffled(Array.from({length:26},(_,i)=>String.fromCharCode(65+i)).filter(x=>x!==answer),r).slice(0,3);return choiceQuestion({...meta,prompt:`Find the next letter: ${letters.join(', ')}, ?`,answer,distractors,hint:'Convert letters to alphabet positions and compare.',explanation:`The positions increase by ${step}, so the next letter is ${answer}.`,formula:'A=1, B=2, …, Z=26.',shortcut:'Write alphabet positions above difficult letters.'},r);}
  if(topic==='Coding-Decoding'){const shift=int(r,1,Math.min(8,level+4)),word=pick(r,['DATA','CODE','TEAM','LOGIC','SKILL','EXCEL','TABLE','QUERY','POWER','LEARN','GRAPH','VALUE']),encoded=[...word].map(c=>String.fromCharCode(65+(c.charCodeAt(0)-65+shift)%26)).join('');return choiceQuestion({...meta,prompt:`If every letter is shifted forward by ${shift}, how is ${word} coded?`,answer:encoded,distractors:[word,[...word].reverse().join(''),[...word].map(c=>String.fromCharCode(65+(c.charCodeAt(0)-65+shift+1)%26)).join('')],hint:`Move each letter ${shift} place${shift===1?'':'s'} forward.`,explanation:`Applying the same +${shift} shift to every letter gives ${encoded}.`,formula:'Coded position = original position + fixed shift.',shortcut:'Check the first and last letter before coding the whole word.'},r);}
  if(topic==='Blood Relations'){const person=pick(r,names),child=pick(r,names.filter(n=>n!==person));return choiceQuestion({...meta,prompt:`${person} is the mother of ${child}. ${child} is the brother of Ria. How is ${person} related to Ria?`,answer:'Mother',distractors:['Sister','Aunt','Grandmother'],hint:`${child} and Ria are siblings.`,explanation:`Because ${person} is ${child}'s mother and ${child} is Ria's brother, ${person} is also Ria's mother.`,formula:'Build the family links one statement at a time.',shortcut:'Draw names with M/F and parent arrows.'},r);}
  if(topic==='Directions'){const north=int(r,2,8),east=int(r,2,8),south=int(r,1,north-1),answer=`North-East`;return choiceQuestion({...meta,prompt:`A person walks ${north} m north, ${east} m east, then ${south} m south. In which direction is the person from the starting point?`,answer,distractors:['North-West','South-East','West'],hint:'Cancel opposite north and south movement first.',explanation:`Net movement is ${north-south} m north and ${east} m east, so the final direction is North-East.`,formula:'Net vertical = north − south; net horizontal = east − west.',shortcut:'Use a small coordinate cross.'},r);}
  if(topic==='Analogy'){const groups=[[['Book','Read'],['Song','Listen'],['Food','Eat'],['Picture','View']],[['Bird','Nest'],['Bee','Hive'],['Lion','Den'],['Horse','Stable']],[['Doctor','Hospital'],['Teacher','School'],['Judge','Court'],['Chef','Kitchen']],[['Knife','Cut'],['Pen','Write'],['Key','Unlock'],['Brush','Paint']]],g=pick(r,groups),pairs=shuffled(g,r),a=pairs[0],b=pairs[1],answer=b[1];return choiceQuestion({...meta,prompt:`${a[0]} is to ${a[1]} as ${b[0]} is to ___.`,answer,distractors:shuffled(groups.flat().map(x=>x[1]).filter(x=>x!==answer),r).slice(0,3),hint:'Identify the relationship in the first pair.',explanation:`The same relationship applies: ${a[0]} → ${a[1]}, so ${b[0]} → ${answer}.`,formula:'A:B :: C:D means the A–B relationship must match C–D.',shortcut:'Say the first pair as a short sentence.'},r);}
  if(topic==='Classification'){const divisor=int(r,2,9),base=int(r,2,20),normal=[base,base+1,base+2].map(x=>x*divisor),answer=(base+int(r,4,9))*divisor+int(r,1,divisor-1),items=shuffled([...normal,answer],r).map(String);return choiceQuestion({...meta,prompt:`Which number is not divisible by ${divisor}: ${items.join(', ')}?`,answer:String(answer),distractors:normal.map(String),hint:`Test each number using divisibility by ${divisor}.`,explanation:`${answer} leaves a remainder when divided by ${divisor}; the other values divide exactly.`,formula:'Members of the same class share one stated property.',shortcut:'Check the remainder rather than fully dividing every value.'},r);}
  if(topic==='Syllogism'){const pair=pick(r,[['analysts','people who use data'],['developers','people who write code'],['managers','people who lead teams'],['designers','creative professionals'],['teachers','people who educate others'],['athletes','people who train']]),c=pick(r,['employees','graduates','staff members','applicants','citizens','students','volunteers','trainees']),[a,b]=pair;return choiceQuestion({...meta,prompt:`All ${a} are ${b}. Some ${c} are ${a}. Which conclusion must follow?`,answer:`Some ${c} are ${b}`,distractors:[`All ${c} are ${b}`,`No ${c} are ${b}`,`All ${b} are ${a}`],hint:`Focus only on the ${c} who belong to ${a}.`,explanation:`Those ${c} who are ${a} must also be ${b}.`,formula:'Use only stated set relationships; do not assume the converse.',shortcut:'Draw one set inside another and mark the “some” overlap.'},r);}
  if(topic==='Seating Arrangement'){const people=shuffled(names,r).slice(0,4);return choiceQuestion({...meta,prompt:`Four people sit in a row. ${people[0]} is immediately left of ${people[1]}. ${people[2]} is at the far left and ${people[3]} is at the far right. Who is second from the left?`,answer:people[0],distractors:[people[1],people[2],people[3]],hint:'Place the fixed far-left and far-right people first.',explanation:`The middle pair must be ${people[0]}, ${people[1]}, so ${people[0]} is second from the left.`,formula:'Place fixed positions before relative-position clues.',shortcut:'Draw four empty boxes.'},r);}
  if(topic==='Puzzles'){const ranks=shuffled(names,r).slice(0,4);return choiceQuestion({...meta,prompt:`${ranks[0]} scored more than ${ranks[1]}. ${ranks[1]} scored more than ${ranks[2]}. ${ranks[2]} scored more than ${ranks[3]}. Who scored highest?`,answer:ranks[0],distractors:ranks.slice(1),hint:'Convert every statement into one descending chain.',explanation:`The order is ${ranks.join(' > ')}, so ${ranks[0]} is highest.`,formula:'Combine transitive comparisons: if A>B and B>C, then A>C.',shortcut:'Write a single > chain.'},r);}
  const implications=[['a report is approved','it is published'],['a candidate clears the test','the candidate attends the interview'],['a payment succeeds','a receipt is generated'],['a file is validated','it is uploaded'],['a course is completed','the final exam unlocks'],['a password is correct','access is granted'],['a ticket is confirmed','a seat is reserved'],['an order is dispatched','tracking becomes active'],['a student passes every topic','the final assessment opens'],['a device is connected','the status light turns green'],['a request is accepted','a confirmation appears'],['a form is complete','the submit button becomes active']],pair=pick(r,implications);return choiceQuestion({...meta,prompt:`If ${pair[0]}, then ${pair[1]}. It is false that ${pair[1]}. What follows logically?`,answer:`It is false that ${pair[0]}`,distractors:[`It is true that ${pair[0]}`,`Both statements are true`,'Nothing can be concluded'],hint:'Use the contrapositive of the implication.',explanation:`If the first condition guarantees the second, absence of the second means the first condition did not occur.`,formula:'If P → Q, then not Q → not P.',shortcut:'Do not reverse an implication; use its contrapositive.'},r);
}

export function validateQuestion(question){
  return Boolean(question&&question.id&&question.prompt&&question.hint&&question.explanation&&question.formula&&question.shortcut&&DIFFICULTIES.includes(question.difficulty)&&['Aptitude','Reasoning'].includes(question.category)&&Array.isArray(question.options)&&question.options.length===4&&new Set(question.options).size===4&&Number.isInteger(question.answer)&&question.answer>=0&&question.answer<4);
}
export function generateQuestion(topic,difficulty='Easy',seed=Date.now()){
  const category=APTITUDE_TOPICS.includes(topic)?'Aptitude':REASONING_TOPICS.includes(topic)?'Reasoning':'';
  if(!category)throw new Error('Choose a valid aptitude or reasoning topic.');
  if(!DIFFICULTIES.includes(difficulty))throw new Error('Choose Easy, Medium or Hard.');
  const r=random(`${seed}|${topic}|${difficulty}`),question=category==='Aptitude'?aptitudeQuestion(topic,difficulty,r):reasoningQuestion(topic,difficulty,r);
  if(!validateQuestion(question))throw new Error('A generated practice question failed validation.');
  return question;
}
export function selectQuestions({mode='aptitude',topic='',difficulty='Easy',count=10,seed=Date.now(),recentIds=[],wrongHistory=[]}={}){
  const wanted=clamp(Math.floor(Number(count)||10),1,50),recent=new Set(recentIds.slice(-120));
  let topics=mode==='reasoning'?REASONING_TOPICS:mode==='topic'?[topic]:mode==='mistakes'?[...new Set(wrongHistory.slice(-80).reverse().map(x=>x.topic))]:[...APTITUDE_TOPICS,...REASONING_TOPICS];
  if(mode==='aptitude')topics=APTITUDE_TOPICS;
  if(mode==='daily')topics=[...APTITUDE_TOPICS.slice(0,5),...REASONING_TOPICS.slice(0,5)];
  topics=topics.filter(x=>APTITUDE_TOPICS.includes(x)||REASONING_TOPICS.includes(x));
  if(!topics.length)topics=[...APTITUDE_TOPICS,...REASONING_TOPICS];
  const output=[],used=new Set();
  for(let attempt=0;output.length<wanted&&attempt<wanted*80;attempt++){
    const chosen=mode==='daily'?topics[output.length%topics.length]:topics[hash(`${seed}|topic|${attempt}`)%topics.length];
    const q=generateQuestion(chosen,difficulty,`${seed}|${attempt}`);
    if(used.has(q.id)||(recent.has(q.id)&&attempt<wanted*35))continue;
    used.add(q.id);output.push(q);
  }
  if(output.length<wanted)throw new Error('Could not create enough validated questions. Please start again.');
  return output;
}
export function dailyQuestions(date=new Date().toISOString().slice(0,10),recentIds=[]){
  const aptitude=selectQuestions({mode:'aptitude',difficulty:'Medium',count:5,seed:`${date}|aptitude`,recentIds:[]});
  const reasoning=selectQuestions({mode:'reasoning',difficulty:'Medium',count:5,seed:`${date}|reasoning`,recentIds:[]});
  return shuffled([...aptitude,...reasoning],random(date));
}
export function adaptiveDifficulty(current='Easy',recent=[]){
  const index=Math.max(0,DIFFICULTIES.indexOf(current)),rows=recent.slice(-3);
  if(rows.length<2)return DIFFICULTIES[index];
  const accuracy=rows.reduce((sum,row)=>sum+Number(row.accuracy||0),0)/rows.length;
  if(accuracy>=85)return DIFFICULTIES[Math.min(2,index+1)];
  if(accuracy<55)return DIFFICULTIES[Math.max(0,index-1)];
  return DIFFICULTIES[index];
}
export function normalizeAptitudeState(value={}){
  const source=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  return {attempts:Array.isArray(source.attempts)?source.attempts.slice(-100):[],questionHistory:Array.isArray(source.questionHistory)?source.questionHistory.slice(-500):[],wrongHistory:Array.isArray(source.wrongHistory)?source.wrongHistory.slice(-150):[],daily:source.daily&&typeof source.daily==='object'?Object.fromEntries(Object.entries(source.daily).slice(-31)):{}};
}
export function buildAttempt({id,mode,questions,answers,times,date=new Date().toISOString(),challengeDate=''}){
  const results=questions.map((question,index)=>({questionId:question.id,topic:question.topic,category:question.category,difficulty:question.difficulty,correct:Number(answers[index])===question.answer,timeTaken:Math.max(0,Math.round(Number(times[index])||0)),selected:Number(answers[index]),question:{...question}}));
  const correct=results.filter(x=>x.correct).length,total=results.length,seconds=results.reduce((sum,x)=>sum+x.timeTaken,0);
  return {id:String(id||hash(`${date}|${mode}`)),mode,date,challengeDate:String(challengeDate||''),total,correct,score:Math.round(correct/total*100),accuracy:Math.round(correct/total*100),seconds,averageSeconds:Number((seconds/total).toFixed(1)),results};
}
export function recordAptitudeAttempt(state,attempt){
  const next=normalizeAptitudeState(state),summary={id:attempt.id,mode:attempt.mode,date:attempt.date,total:attempt.total,correct:attempt.correct,score:attempt.score,accuracy:attempt.accuracy,seconds:attempt.seconds,averageSeconds:attempt.averageSeconds,difficulties:[...new Set(attempt.results.map(x=>x.difficulty))],topics:[...new Set(attempt.results.map(x=>x.topic))]};
  next.attempts=[...next.attempts.filter(x=>x.id!==summary.id),summary].slice(-100);
  next.questionHistory=[...next.questionHistory,...attempt.results.map(x=>({questionId:x.questionId,topic:x.topic,category:x.category,difficulty:x.difficulty,dateSeen:attempt.date,correct:x.correct,timeTaken:x.timeTaken}))].slice(-500);
  const unresolved=[...next.wrongHistory];
  if(attempt.mode==='mistakes')for(const result of attempt.results.filter(x=>x.correct)){const index=unresolved.findLastIndex(old=>old.topic===result.topic);if(index>=0)unresolved.splice(index,1);}
  next.wrongHistory=[...unresolved,...attempt.results.filter(x=>!x.correct).map(x=>({questionId:x.questionId,topic:x.topic,category:x.category,difficulty:x.difficulty,dateSeen:attempt.date,question:x.question}))].slice(-150);
  if(attempt.mode==='daily')next.daily[attempt.challengeDate||attempt.date.slice(0,10)]={score:attempt.score,accuracy:attempt.accuracy,completed:true,date:attempt.date};
  return next;
}
export function performanceAnalytics(value={}){
  const state=normalizeAptitudeState(value),history=state.questionHistory,total=history.length,correct=history.filter(x=>x.correct).length;
  const byDifficulty=Object.fromEntries(DIFFICULTIES.map(d=>{const rows=history.filter(x=>x.difficulty===d);return[d,rows.length?Math.round(rows.filter(x=>x.correct).length/rows.length*100):null];}));
  const topics=[...APTITUDE_TOPICS,...REASONING_TOPICS].map(topic=>{const rows=history.filter(x=>x.topic===topic);return{topic,attempts:rows.length,accuracy:rows.length?Math.round(rows.filter(x=>x.correct).length/rows.length*100):null};}).filter(x=>x.attempts);
  const ranked=[...topics].sort((a,b)=>b.accuracy-a.accuracy||b.attempts-a.attempts),weak=[...topics].sort((a,b)=>a.accuracy-b.accuracy||b.attempts-a.attempts);
  const recent=state.attempts.slice(-5),older=state.attempts.slice(-10,-5),avg=rows=>rows.length?Math.round(rows.reduce((s,x)=>s+x.accuracy,0)/rows.length):null;
  return {attempts:state.attempts.length,accuracy:total?Math.round(correct/total*100):0,averageSeconds:total?Number((history.reduce((s,x)=>s+x.timeTaken,0)/total).toFixed(1)):0,byDifficulty,strongTopics:ranked.filter(x=>x.accuracy>=70).slice(0,3),weakTopics:weak.filter(x=>x.accuracy<70).slice(0,3),recommended:weak[0]?.topic||'Percentages',improvement:older.length?avg(recent)-avg(older):null,topics};
}
