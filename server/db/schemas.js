import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'USER'], default: 'USER' },
  created_at: { type: Date, default: Date.now }
});

const designationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  created_at: { type: Date, default: Date.now }
});

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  created_at: { type: Date, default: Date.now }
});

const projectSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  delivery_manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
  created_at: { type: Date, default: Date.now }
});

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  designation: String,
  designation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Designation' },
  department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  level: { type: String, default: null },
  manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const actionItemSchema = new mongoose.Schema({
  action_date: { type: Date, required: true },
  description: { type: String, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  status: { type: String, enum: ['Pending', 'Not Started', 'In Progress', 'Completed', 'Deferred', 'Put On Hold'], default: 'Pending' },
  dependency_member_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
  reference_link: { type: String, default: null },
  comments: [{
    text: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
  }],
  created_at: { type: Date, default: Date.now }
});

const emailSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  sender: { type: String, required: true },
  received_at: { type: Date, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  reply_by: Date,
  status: { type: String, enum: ['Not Replied', 'In Progress', 'Replied'], default: 'Not Replied' },
  created_at: { type: Date, default: Date.now }
});

const benchSchema = new mongoose.Schema({
  member_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  assigned_date: { type: Date, required: true },
  release_date: Date,
  extension_date: Date,
  status: { type: String, enum: ['Working', 'Project Completed', 'Deferred'], default: 'Working' },
  created_at: { type: Date, default: Date.now }
});

const importantLinkSchema = new mongoose.Schema({
  link_name: { type: String, required: true },
  link_url: { type: String, required: true },
  purpose: { type: String, default: null },
  created_by: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  created_at: { type: Date, default: Date.now }
});

const memberSkillSchema = new mongoose.Schema({
  member_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  skill_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
  created_at: { type: Date, default: Date.now }
});

const goalCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  created_at: { type: Date, default: Date.now }
});

const goalSchema = new mongoose.Schema({
  member_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  year: { type: Number, required: true },
  goal_text: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'inprogress', 'complete', 'deferred'], default: 'pending' },
  category_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'GoalCategory' }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);
export const Designation = mongoose.model('Designation', designationSchema);
export const Department = mongoose.model('Department', departmentSchema);
export const Project = mongoose.model('Project', projectSchema);
export const Member = mongoose.model('Member', memberSchema);
export const ActionItem = mongoose.model('ActionItem', actionItemSchema);
export const Email = mongoose.model('Email', emailSchema);
export const Bench = mongoose.model('Bench', benchSchema);
export const ImportantLink = mongoose.model('ImportantLink', importantLinkSchema);
export const Skill = mongoose.model('Skill', skillSchema);
export const MemberSkill = mongoose.model('MemberSkill', memberSkillSchema);
export const GoalCategory = mongoose.model('GoalCategory', goalCategorySchema);
export const Goal = mongoose.model('Goal', goalSchema);
