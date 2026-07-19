'use strict';

// SQLite-backed family/circle groups. Replaces the JSON file store. Keeps the
// exact exported API used elsewhere (createFamily, getGroup, getGroupForDevice,
// getGroupByCode, inviteMember, joinFamily, removeMember, leaveFamily,
// listAllGroups, publicView, deviceCount).

const crypto = require('crypto');
const { getDb } = require('./db');

const FAMILY_PATH = require('path').join(__dirname, '..', 'data', 'family.json');

const DEFAULT_DEVICE_LIMIT = 5; // owner + up to 4 members

function genId() { return 'fam_' + crypto.randomBytes(6).toString('hex'); }
function genCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = crypto.randomBytes(8);
  let out = '';
  for (let i = 0; i < 8; i++) out += chars[bytes[i] % chars.length];
  return out;
}

function rowToGroup(g, members) {
  return {
    id: g.id, name: g.name, ownerDeviceId: g.owner_device_id,
    inviteCode: g.invite_code, deviceLimit: g.device_limit,
    createdAt: g.created_at, members: members || [],
  };
}

function loadMembers(groupId) {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM family_members WHERE group_id = ?').all(groupId);
  return rows.map((m) => ({
    deviceId: m.device_id, name: m.name, email: m.email, phone: m.phone,
    status: m.status, invitedAt: m.invited_at, joinedAt: m.joined_at,
  }));
}

function createFamily(ownerDeviceId, name) {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM families WHERE owner_device_id = ?').get(ownerDeviceId);
  if (existing) return rowToGroup(existing, loadMembers(existing.id));
  const id = genId();
  db.prepare(
    'INSERT INTO families (id, name, owner_device_id, invite_code, device_limit, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, name || 'My Family', ownerDeviceId, genCode(), DEFAULT_DEVICE_LIMIT, Date.now());
  return rowToGroup(db.prepare('SELECT * FROM families WHERE id = ?').get(id), []);
}

function getGroup(id) {
  const db = getDb();
  const g = db.prepare('SELECT * FROM families WHERE id = ?').get(id);
  if (!g) return null;
  return rowToGroup(g, loadMembers(id));
}

function getGroupByCode(code) {
  const db = getDb();
  const c = String(code || '').toUpperCase();
  const groups = db.prepare('SELECT * FROM families').all();
  const g = groups.find((x) => x.invite_code.toUpperCase() === c);
  if (!g) return null;
  return rowToGroup(g, loadMembers(g.id));
}

function getGroupForDevice(deviceId) {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM families').all();
  for (const g of rows) {
    if (g.owner_device_id === deviceId) return rowToGroup(g, loadMembers(g.id));
    const member = db.prepare('SELECT * FROM family_members WHERE group_id = ? AND device_id = ? AND status = ?')
      .get(g.id, deviceId, 'active');
    if (member) return rowToGroup(g, loadMembers(g.id));
  }
  return null;
}

function deviceCount(group) {
  return 1 + group.members.filter((m) => m.status === 'active').length;
}

function inviteMember(groupId, { name, email, phone } = {}) {
  const db = getDb();
  const g = db.prepare('SELECT * FROM families WHERE id = ?').get(groupId);
  if (!g) return null;
  db.prepare(
    "INSERT INTO family_members (id, group_id, device_id, name, email, phone, status, invited_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)"
  ).run('mem_' + crypto.randomBytes(6).toString('hex'), groupId, null, name || 'Invited member', email || null, phone || null, Date.now());
  return getGroup(groupId);
}

function joinFamily(code, deviceId, name) {
  const g = getGroupByCode(code);
  if (!g) { const e = new Error('Invalid or expired invite code'); e.status = 404; throw e; }
  if (deviceCount(g) >= g.deviceLimit) { const e = new Error('Family plan device limit reached'); e.status = 409; throw e; }
  if (g.ownerDeviceId === deviceId) return g; // owner already covered
  const db = getDb();
  const existing = db.prepare('SELECT * FROM family_members WHERE group_id = ? AND device_id = ?').get(g.id, deviceId);
  if (existing) {
    db.prepare("UPDATE family_members SET status = 'active', name = ?, joined_at = ?, invited_at = ? WHERE id = ?")
      .run(name || existing.name, Date.now(), existing.invited_at, existing.id);
  } else {
    db.prepare(
      "INSERT INTO family_members (id, group_id, device_id, name, email, phone, status, joined_at) VALUES (?, ?, ?, ?, NULL, NULL, 'active', ?)"
    ).run('mem_' + crypto.randomBytes(6).toString('hex'), g.id, deviceId, name || 'Member', Date.now());
  }
  return getGroup(g.id);
}

function removeMember(groupId, memberDeviceId) {
  const db = getDb();
  const res = db.prepare('DELETE FROM family_members WHERE group_id = ? AND device_id = ?').run(groupId, memberDeviceId);
  return res.changes > 0;
}

function leaveFamily(groupId, deviceId) {
  const db = getDb();
  const res = db.prepare("DELETE FROM family_members WHERE group_id = ? AND device_id = ? AND status = 'active'").run(groupId, deviceId);
  return res.changes > 0;
}

function listAllGroups() {
  const db = getDb();
  return db.prepare('SELECT * FROM families').all().map((g) => rowToGroup(g, loadMembers(g.id)));
}

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
  FAMILY_PATH,
};
