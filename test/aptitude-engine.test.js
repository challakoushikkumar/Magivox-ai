import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { APTITUDE_TOPICS, REASONING_TOPICS, DIFFICULTIES, generateQuestion, validateQuestion, selectQuestions, dailyQuestions, adaptiveDifficulty, buildAttempt, recordAptitudeAttempt, normalizeAptitudeState, performanceAnalytics } from '../aptitude-engine.js';

const allTopics=[...APTITUDE_TOPICS,...REASONING_TOPICS];

test('every requested aptitude and reasoning topic generates validated questions at all difficulties',()=>{
  assert.equal(APTITUDE_TOPICS.length,14);assert.equal(REASONING_TOPICS.length,11);
  for(const topic of allTopics)for(const difficulty of DIFFICULTIES)for(let seed=0;seed<30;seed++)assert.equal(validateQuestion(generateQuestion(topic,difficulty,seed)),true,`${topic} ${difficulty}`);
});

test('fresh attempts rotate questions and avoid recently seen IDs',()=>{
  const first=selectQuestions({mode:'aptitude',difficulty:'Medium',count:10,seed:'first'});
  const second=selectQuestions({mode:'aptitude',difficulty:'Medium',count:10,seed:'second',recentIds:first.map(x=>x.id)});
  assert.equal(first.length,10);assert.equal(new Set(first.map(x=>x.id)).size,10);assert.equal(second.some(x=>first.some(y=>y.id===x.id)),false);
});

test('topic practice and mistake revision create similar new questions without exact repetition',()=>{
  const topicSet=selectQuestions({mode:'topic',topic:'Time & Work',difficulty:'Easy',count:10,seed:'topic'});
  const revision=selectQuestions({mode:'mistakes',difficulty:'Easy',count:5,seed:'revision',recentIds:topicSet.map(x=>x.id),wrongHistory:[{topic:'Time & Work'}]});
  assert.ok(topicSet.every(x=>x.topic==='Time & Work'));assert.ok(revision.every(x=>x.topic==='Time & Work'));assert.equal(revision.some(x=>topicSet.some(y=>y.id===x.id)),false);
});

test('daily challenge is stable within a day, changes next day and mixes five aptitude with five reasoning',()=>{
  const today=dailyQuestions('2026-09-13'),again=dailyQuestions('2026-09-13'),tomorrow=dailyQuestions('2026-09-14');
  assert.deepEqual(today.map(x=>x.id),again.map(x=>x.id));assert.notDeepEqual(today.map(x=>x.id),tomorrow.map(x=>x.id));assert.equal(today.filter(x=>x.category==='Aptitude').length,5);assert.equal(today.filter(x=>x.category==='Reasoning').length,5);
});

test('adaptive difficulty moves only one level after consistent performance',()=>{
  assert.equal(adaptiveDifficulty('Easy',[{accuracy:90},{accuracy:88}]),'Medium');assert.equal(adaptiveDifficulty('Hard',[{accuracy:40},{accuracy:50}]),'Medium');assert.equal(adaptiveDifficulty('Medium',[{accuracy:70},{accuracy:74}]),'Medium');
});

test('scoring is deterministic and keeps accuracy separate from timing',()=>{
  const questions=selectQuestions({mode:'reasoning',difficulty:'Medium',count:4,seed:'score'}),answers=questions.map((q,i)=>i<3?q.answer:(q.answer+1)%4);
  const attempt=buildAttempt({id:'a1',mode:'reasoning',questions,answers,times:[10,20,30,40],date:'2026-09-13T00:00:00.000Z'});
  assert.equal(attempt.correct,3);assert.equal(attempt.score,75);assert.equal(attempt.accuracy,75);assert.equal(attempt.seconds,100);assert.equal(attempt.averageSeconds,25);
});

test('bounded history saves compact seen data, mistakes, daily completion and analytics',()=>{
  const questions=selectQuestions({mode:'daily',difficulty:'Medium',count:4,seed:'history'}),answers=questions.map((q,i)=>i%2?q.answer:(q.answer+1)%4),attempt=buildAttempt({id:'d1',mode:'daily',questions,answers,times:[5,5,5,5],date:'2026-09-13T10:00:00.000Z'});
  const state=recordAptitudeAttempt({},attempt),analytics=performanceAnalytics(state);
  assert.equal(state.questionHistory.length,4);assert.equal(state.wrongHistory.length,2);assert.equal(state.daily['2026-09-13'].completed,true);assert.equal(analytics.accuracy,50);assert.equal(analytics.attempts,1);assert.equal(normalizeAptitudeState({questionHistory:Array(700).fill(state.questionHistory[0])}).questionHistory.length,500);
});

test('mistake revision clears only one matching saved mistake per correct retry',()=>{
  const questions=selectQuestions({mode:'topic',topic:'Percentages',difficulty:'Easy',count:2,seed:'wrong'}),wrongAttempt=buildAttempt({id:'w1',mode:'topic',questions,answers:questions.map(q=>(q.answer+1)%4),times:[4,4]});
  const saved=recordAptitudeAttempt({},wrongAttempt),revisionQuestions=selectQuestions({mode:'mistakes',difficulty:'Easy',count:1,seed:'fix',recentIds:questions.map(q=>q.id),wrongHistory:saved.wrongHistory}),revision=buildAttempt({id:'w2',mode:'mistakes',questions:revisionQuestions,answers:[revisionQuestions[0].answer],times:[5]});
  assert.equal(saved.wrongHistory.length,2);assert.equal(recordAptitudeAttempt(saved,revision).wrongHistory.length,1);
});

test('aptitude UI reuses existing AI Teacher and existing owner-scoped appState persistence',async()=>{
  const [studio,workspace,rules]=await Promise.all([readFile(new URL('../aptitude-studio.js',import.meta.url),'utf8'),readFile(new URL('../workspace.js',import.meta.url),'utf8'),readFile(new URL('../firestore.rules',import.meta.url),'utf8')]);
  for(const label of ['Aptitude Practice','Reasoning Practice','Topic Practice','Daily Challenge','Mock Exam','Practice My Mistakes','Give Hint','Submit mock exam','Explain in Telugu'])assert.match(studio,new RegExp(label));
  assert.match(studio,/tool=assistant/);assert.match(workspace,/aptitudePractice: normalizeAptitudeState/);assert.match(workspace,/recordAptitudeAttempt/);assert.match(rules,/request\.auth\.uid == userId/);
});
