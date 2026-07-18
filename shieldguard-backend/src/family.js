'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FAMILY_PATH = path.join(DATA_DIR, 'family.json');

const DEFAULT_DEVICE_LIMIT = 5; // owner + up to 4 members

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}
function load() {
  ensureDir();
  try {
    if (fs.existsSync(FAMILY_PATH)) return JSON.parse(fs.readFileSync(FAMILY_PATH, 'utf-8'));
  } catch (_) {
    /* corrupted — start fresh */
  }
  return { groups: {} };
}
function save(db) {
  ensureDir();
  fs.writeFileSync(FAMILY_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

function genId() { return 'fam_' + crypto.randomBytes(6).toString('hex'); }
function genCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = crypto.randomBytes(8);
  let out = '';
  for (let i = 0; i < 8; i++) out += chars[bytes[i] % chars.length];
  return out;
}

function createFamily(ownerDeviceId, name) {
  const db = load();
  // An owner can only own one family.
  const existing = Object.values(db.groups).find((g) => g.ownerDeviceId === ownerDeviceId);
  if (existing) return existing;
  const id = genId();
  const group = {
    id,
    name: name || 'My Family',
    ownerDeviceId,
    inviteCode: genCode(),
    deviceLimit: DEFAULT_DEVICE_LIMIT,
    createdAt: Date.now(),
    members: [], // pending + active; owner tracked via ownerDeviceId
  };
  db.groups[id] = group;
  save(db);
  return group;
}

function getGroup(id) {
  return load().groups[id] || null;
}

function getGroupByCode(code) {
  const c = String(code || '').toUpperCase();
  return Object.values(load().groups).find((g) => g.inviteCode.toUpperCase() === c) || null;
}

// Returns the family group a device belongs to (as owner or active member), or null.
function getGroupForDevice(deviceId) {
  const groups = Object.values(load().groups);
  return groups.find((g) => {
    if (g.ownerDeviceId === deviceId) return true;
    return g.members.some((m) => m.deviceId === deviceId && m.status === 'active');
  }) || null;
}

// Count devices currently consuming the plan (owner + active members).
function deviceCount(group) {
  return 1 + group.members.filter((m) => m.status === 'active').length;
}

function inviteMember(groupId, { name, email, phone } = {}) {
  const db = load();
  const g = db.groups[groupId];
  if (!g) return null;
  // Invites are pending until the member joins with their device.
  g.members.push({ deviceId: null, name: name || 'Invited member', email: email || null, phone: phone || null, status: 'pending', invitedAt: Date.now() });
  save(db);
  return g;
}

function joinFamily(code, deviceId, name) {
  const g = getGroupByCode(code);
  if (!g) { const e = new Error('Invalid or expired invite code'); e.status = 404; throw e; }
  if (deviceCount(g) >= g.deviceLimit) { const e = new Error('Family plan device limit reached'); e.status = 409; throw e; }
  if (g.ownerDeviceId === deviceId) return g; // owner already covered
  const db = load();
  const grp = db.groups[g.id];
  const existing = grp.members.find((m) => m.deviceId === deviceId);
  if (existing) { existing.status = 'active'; existing.name = name || existing.name; existing.joinedAt = Date.now(); }
  else grp.members.push({ deviceId, name: name || 'Member', email: null, phone: null, status: 'active', joinedAt: Date.now() });
  save(db);
  return grp;
}

function removeMember(groupId, memberDeviceId) {
  const db = load();
  const g = db.groups[groupId];
  if (!g) return false;
  const i = g.members.findIndex((m) => m.deviceId === memberDeviceId);
  if (i === -1) return false;
  g.members.splice(i, 1);
  save(db);
  return true;
}

function leaveFamily(groupId, deviceId) {
  const db = load();
  const g = db.groups[groupId];
  if (!g) return false;
  const i = g.members.findIndex((m) => m.deviceId === deviceId && m.status === 'active');
  if (i === -1) return false;
  g.members.splice(i, 1);
  save(db);
  return true;
}

function listAllGroups() {
  return Object.values(load().groups);
}

// Normalize a group into a safe, role-aware view for a given device.
function publicView(group, deviceId) {
  if (!group) return null;
  const role = group.ownerDeviceId === deviceId ? 'owner' : 'member';
  return {
    id: group.id,
    name: group.name,
    role,
    deviceLimit: group.deviceLimit,
    deviceCount: deviceCount(group),
    inviteCode: role === 'owner' ? group.inviteCode : undefined,
    members: group.members.map((m) => ({
      name: m.name,
      email: m.email,
      phone: m.phone,
      status: m.status,
      isOwner: false,
      isYou: m.deviceId === deviceId,
      // The owner manages members, so they need each member's deviceId to remove it.
      deviceId: role === 'owner' ? m.deviceId : undefined,
    })),
  };
}

module.exports = {
  DEFAULT_DEVICE_LIMIT,
  createFamily,
  getGroup,
  getGroupByCode,
  getGroupForDevice,
  deviceCount,
  inviteMember,
  joinFamily,
  removeMember,
  leaveFamily,
  listAllGroups,
  publicView,
};
