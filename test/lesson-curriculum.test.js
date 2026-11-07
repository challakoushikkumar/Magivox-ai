import test from 'node:test';
import assert from 'node:assert/strict';
import { COURSES, getCourse } from '../course-catalog.js';
import { getTopicCurriculum } from '../lesson-curriculum.js';

test('every course module has complete Foundation-to-Project lesson material',()=>{
  let modules=0;
  for(const course of COURSES)for(const [index,topic] of course.topics.entries()){
    modules++;
    const units=getTopicCurriculum(course,topic,index);
    assert.deepEqual(units.map(unit=>unit.level),['Foundation','Beginner','Intermediate','Advanced','Project & Revision']);
    assert.ok(units.every(unit=>unit.title&&unit.paragraphs.length));
    assert.ok(units[0].concepts.length>=3);
    assert.ok(units[1].steps.length>=2);
    assert.ok(units[4].steps.length>=4);
  }
  assert.equal(modules,80);
});

test('SQL foundation teaches what SQL, databases, tables, SELECT, rows and columns mean',()=>{
  const course=getCourse('sql'),curriculum=getTopicCurriculum(course,course.topics[0],0),foundation=curriculum[0];
  assert.equal(foundation.title,'What is SQL?');
  assert.match(foundation.paragraphs.join(' '),/Structured Query Language/);
  const terms=Object.fromEntries(foundation.concepts.map(item=>[item.term.toLowerCase(),item.definition]));
  for(const term of ['database','table','select','column','row'])assert.ok(terms[term]?.length>35,`${term} needs meaningful theory`);
});
