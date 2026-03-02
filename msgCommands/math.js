const fs = require('fs');
const path = require('path');
const SESSIONS = path.join(__dirname, '..', 'data', 'math_sessions.json');
const { addBalance } = require('../lib/economy');

function ensureSessions() {
  const dir = path.dirname(SESSIONS);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(SESSIONS)) fs.writeFileSync(SESSIONS, '{}');
}

function saveSession(userId, payload) {
  ensureSessions();
  const data = JSON.parse(fs.readFileSync(SESSIONS, 'utf8'));
  data[userId] = payload;
  fs.writeFileSync(SESSIONS, JSON.stringify(data, null, 2));
}

function getSession(userId) {
  ensureSessions();
  const data = JSON.parse(fs.readFileSync(SESSIONS, 'utf8'));
  const s = data[userId];
  if (!s) return null;
  if (Date.now() > s.expires) {
    delete data[userId];
    fs.writeFileSync(SESSIONS, JSON.stringify(data, null, 2));
    return null;
  }
  return s;
}

// Generators covering common Class 10 topics
function genLinear() {
  // ax + b = c
  const a = Math.floor(Math.random() * 9) + 1;
  const x = Math.floor(Math.random() * 21) - 10; // -10..10
  const b = Math.floor(Math.random() * 21) - 10;
  const c = a * x + b;
  const prob = `${a}x + ${b} = ${c}\nSolve for x.`;
  return { problem: prob, answer: String(x) };
}

function genQuadratic() {
  // ax^2 + bx + c = 0 with integer roots
  const r1 = Math.floor(Math.random() * 11) - 5;
  const r2 = Math.floor(Math.random() * 11) - 5;
  const a = 1;
  const b = -(r1 + r2);
  const c = r1 * r2;
  const prob = `${a}x^2 + ${b}x + ${c} = 0\nFind the integer roots (comma separated).`;
  const ans = `${r1},${r2}`;
  return { problem: prob, answer: ans };
}

function genTriangleArea() {
  const b = Math.floor(Math.random() * 30) + 5;
  const h = Math.floor(Math.random() * 20) + 3;
  const area = (b * h) / 2;
  const prob = `Find the area of a triangle with base ${b} and height ${h}. (Numeric answer)`;
  return { problem: prob, answer: String(area) };
}

function genTriangleSimilarity() {
  // similar triangles: scale factor
  const k = Math.floor(Math.random() * 4) + 2; // 2..5
  const a = Math.floor(Math.random() * 10) + 2;
  const b = a * k;
  const prob = `Two similar triangles have corresponding sides ${a} and ${b}. What is the scale factor from the first to the second?`;
  return { problem: prob, answer: String(k) };
}

function genTrigonometry() {
  // use standard angles 30,45,60 with simple exact values
  const angles = [30,45,60];
  const funcs = ['sin','cos','tan'];
  const angle = angles[Math.floor(Math.random()*angles.length)];
  const func = funcs[Math.floor(Math.random()*funcs.length)];
  let ans;
  if (angle === 30) {
    if (func === 'sin') ans = '1/2';
    if (func === 'cos') ans = 'sqrt(3)/2';
    if (func === 'tan') ans = '1/sqrt(3)';
  } else if (angle === 45) {
    if (func === 'sin' || func === 'cos') ans = 'sqrt(2)/2';
    if (func === 'tan') ans = '1';
  } else if (angle === 60) {
    if (func === 'sin') ans = 'sqrt(3)/2';
    if (func === 'cos') ans = '1/2';
    if (func === 'tan') ans = 'sqrt(3)';
  }
  const prob = `What is ${func}(${angle}°)? (Use sqrt notation, e.g., sqrt(3)/2)`;
  return { problem: prob, answer: ans };
}

function genCircles() {
  // ask for area or circumference, provide integer radius
  const r = Math.floor(Math.random() * 10) + 2;
  const kind = Math.random() < 0.5 ? 'area' : 'circumference';
  if (kind === 'area') {
    const val = r*r; // answer in terms of pi: val*pi
    const prob = `Find the area of a circle with radius ${r}. Give your answer in terms of pi (e.g., 25pi).`;
    return { problem: prob, answer: `${val}pi` };
  } else {
    const val = 2*r; // circumference = 2*pi*r -> represent as val*pi
    const prob = `Find the circumference of a circle with radius ${r}. Give your answer in terms of pi (e.g., 10pi).`;
    return { problem: prob, answer: `${val}pi` };
  }
}

function genMensuration() {
  // surface area or volume of cube/cuboid/cylinder/cone/ sphere (express pi as 'pi')
  const shapes = ['cube','cuboid','cylinder','cone','sphere'];
  const shape = shapes[Math.floor(Math.random()*shapes.length)];
  if (shape === 'cube') {
    const a = Math.floor(Math.random()*10)+2;
    const sa = 6*a*a;
    return { problem: `Find the total surface area of a cube with side ${a}.`, answer: String(sa) };
  }
  if (shape === 'cuboid') {
    const l = Math.floor(Math.random()*10)+2;
    const w = Math.floor(Math.random()*8)+2;
    const h = Math.floor(Math.random()*8)+2;
    const sa = 2*(l*w + w*h + l*h);
    return { problem: `Find the total surface area of a cuboid with dimensions ${l} x ${w} x ${h}.`, answer: String(sa) };
  }
  if (shape === 'cylinder') {
    const r = Math.floor(Math.random()*8)+2;
    const h = Math.floor(Math.random()*10)+2;
    const sa = 2*(r*r) + 2*r*h; // represent as (2r^2 + 2rh)pi
    const expr = `${2*r*r + 2*r*h}pi`;
    return { problem: `Find the total surface area of a cylinder with radius ${r} and height ${h}. Give answer in terms of pi (e.g., 50pi).`, answer: expr };
  }
  if (shape === 'cone') {
    const r = Math.floor(Math.random()*6)+2;
    const h = Math.floor(Math.random()*8)+2;
    const l = Math.sqrt(r*r + h*h);
    const sa = r*l + r*r; // lateral + base -> (r*l + r^2)pi
    const expr = `${Math.round((r*l + r*r)*100)/100}pi`;
    return { problem: `Find the total surface area of a right circular cone with radius ${r} and height ${h}. Give answer in terms of pi (round to 2 decimals for slant multiplication if needed; e.g., 23.45pi).`, answer: expr };
  }
  // sphere
  const r = Math.floor(Math.random()*6)+2;
  const sa = 4*r*r;
  return { problem: `Find the surface area of a sphere with radius ${r}. Give your answer in terms of pi (e.g., 36pi).`, answer: `${sa}pi` };
}

function genCoordinate() {
  // distance between lattice points producing integer distance
  const triples = [[0,0,3,4],[1,2,4,6],[2,3,5,7],[0,5,4,0]];
  const t = triples[Math.floor(Math.random()*triples.length)];
  const x1 = t[0], y1 = t[1], x2 = t[2], y2 = t[3];
  const dx = x2-x1, dy = y2-y1;
  const dist = Math.sqrt(dx*dx + dy*dy);
  return { problem: `Find the distance between points (${x1},${y1}) and (${x2},${y2}).`, answer: String(dist) };
}

function genStatistics() {
  // simple list with integer mean/median/mode
  const arr = [];
  const n = 5;
  for (let i=0;i<n;i++) arr.push(Math.floor(Math.random()*20)+1);
  const sum = arr.reduce((a,b)=>a+b,0);
  const mean = sum / n;
  const sorted = arr.slice().sort((a,b)=>a-b);
  const median = sorted[2];
  // mode: simple frequency
  const freq = {};
  arr.forEach(v=>freq[v]=(freq[v]||0)+1);
  let mode = arr[0];
  Object.keys(freq).forEach(k=>{ if (freq[k] > freq[mode]) mode = Number(k); });
  const prob = `Given the numbers: ${arr.join(', ')}\nWhat is the mean? (numeric)`;
  return { problem: prob, answer: String(mean) };
}

function genProbability() {
  // simple dice probability
  const prob = `What is the probability of rolling a 4 on a fair six-sided die? Give answer as a fraction.`;
  return { problem: prob, answer: '1/6' };
}

module.exports = {
  name: 'math',
  description: 'Get a random Class-10-style math problem. Usage: !math [topic]. Topics: algebra, quadratic, geometry, trig, mensuration, circles, coordinate, statistics, probability',
  async execute(message, args) {
    const topic = (args[0] || 'algebra').toLowerCase();
    let gen;
    if (topic === 'algebra' || topic === 'linear') gen = genLinear;
    else if (topic === 'quadratic') gen = genQuadratic;
    else if (topic === 'geometry' || topic === 'triangle' || topic === 'triangles') gen = genTriangleArea;
    else if (topic === 'similarity') gen = genTriangleSimilarity;
    else if (topic === 'trig' || topic === 'trigonometry') gen = genTrigonometry;
    else if (topic === 'circles') gen = genCircles;
    else if (topic === 'mensuration' || topic === 'surface' || topic === 'volume') gen = genMensuration;
    else if (topic === 'coordinate' || topic === 'distance') gen = genCoordinate;
    else if (topic === 'statistics') gen = genStatistics;
    else if (topic === 'probability') gen = genProbability;
    else return message.reply('Unknown topic. Allowed: algebra, quadratic, geometry, trig, mensuration, circles, coordinate, statistics, probability');

    const { problem, answer } = gen();
    // save session for 10 minutes for multi-step topics
    saveSession(message.author.id, { answer, expires: Date.now() + 10 * 60 * 1000, topic });

    await message.channel.send(`${message.author.tag}, here's your ${topic} problem:\n${problem}\nReply with **!answer <your answer>** to submit (10 minute timeout).`);
  }
};
