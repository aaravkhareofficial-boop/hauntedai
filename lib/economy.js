const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'economy.json');
const CURRENCY = 'crystals';

function ensureFile() {
  const dir = path.dirname(FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify({ users: {} }, null, 2));
}

function readData() {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch (e) {
    return { users: {} };
  }
}

function writeData(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function getUser(id) {
  const data = readData();
  if (!data.users[id]) data.users[id] = { balance: 100, lastDaily: 0 };
  return data.users[id];
}

function setUser(id, userObj) {
  const data = readData();
  data.users[id] = userObj;
  writeData(data);
}

function addBalance(id, amount) {
  const user = getUser(id);
  user.balance = (user.balance || 0) + amount;
  setUser(id, user);
  return user.balance;
}

function transfer(fromId, toId, amount) {
  const data = readData();
  if (!data.users[fromId]) data.users[fromId] = { balance: 100, lastDaily: 0 };
  if (!data.users[toId]) data.users[toId] = { balance: 100, lastDaily: 0 };
  if (data.users[fromId].balance < amount) return false;
  data.users[fromId].balance -= amount;
  data.users[toId].balance += amount;
  writeData(data);
  return true;
}

module.exports = { getUser, setUser, addBalance, transfer, readData, CURRENCY };

