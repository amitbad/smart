import { User, Designation, Location, Department, Project, Member, ActionItem, SmartNote, Email, Bench, ImportantLink, ImportantEvent, Skill, MemberSkill, GoalCategory, Goal, QuestionCategory, InterviewQuestion, InterviewQuestionSet, InterviewSetRun, Requirement } from '../schemas.js';

class MongoAdapter {
  constructor() {
    this.models = {
      users: User,
      designations: Designation,
      locations: Location,
      departments: Department,
      projects: Project,
      members: Member,
      actionItems: ActionItem,
      smartNotes: SmartNote,
      emails: Email,
      bench: Bench,
      importantLinks: ImportantLink,
      importantEvents: ImportantEvent,
      skills: Skill,
      memberSkills: MemberSkill,
      goalCategories: GoalCategory,
      goals: Goal,
      questionCategories: QuestionCategory,
      interviewQuestions: InterviewQuestion,
      interviewQuestionSets: InterviewQuestionSet,
      interviewSetRuns: InterviewSetRun,
      requirements: Requirement
    };
  }

  // Normalize MongoDB document to include 'id' field for frontend compatibility
  normalizeDoc(doc) {
    if (!doc) return doc;
    if (Array.isArray(doc)) {
      return doc.map(d => this.normalizeDoc(d));
    }
    const obj = doc.toObject ? doc.toObject() : doc;
    if (obj._id && !obj.id) {
      obj.id = obj._id.toString();
    }
    return obj;
  }

  async query(sql, params) {
    throw new Error('Raw SQL queries not supported in MongoDB adapter. Use model methods instead.');
  }

  async findAll(collection, filter = {}, options = {}) {
    const model = this.models[collection];
    if (!model) throw new Error(`Collection ${collection} not found`);

    let query = model.find(filter);

    if (options.populate) {
      options.populate.forEach(pop => query = query.populate(pop));
    }

    if (options.sort) {
      query = query.sort(options.sort);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.skip) {
      query = query.skip(options.skip);
    }

    const results = await query.exec();
    return this.normalizeDoc(results);
  }

  async findOne(collection, filter) {
    const model = this.models[collection];
    if (!model) throw new Error(`Collection ${collection} not found`);
    const result = await model.findOne(filter);
    return this.normalizeDoc(result);
  }

  async findById(collection, id) {
    const model = this.models[collection];
    if (!model) throw new Error(`Collection ${collection} not found`);
    const result = await model.findById(id);
    return this.normalizeDoc(result);
  }

  async create(collection, data) {
    const model = this.models[collection];
    if (!model) throw new Error(`Collection ${collection} not found`);
    const doc = new model(data);
    const result = await doc.save();
    return this.normalizeDoc(result);
  }

  async update(collection, id, data) {
    const model = this.models[collection];
    if (!model) throw new Error(`Collection ${collection} not found`);
    const result = await model.findByIdAndUpdate(id, data, { new: true });
    return this.normalizeDoc(result);
  }

  async delete(collection, id) {
    const model = this.models[collection];
    if (!model) throw new Error(`Collection ${collection} not found`);
    return await model.findByIdAndDelete(id);
  }

  async deleteMany(collection, filter = {}) {
    const model = this.models[collection];
    if (!model) throw new Error(`Collection ${collection} not found`);
    return await model.deleteMany(filter);
  }

  async count(collection, filter = {}) {
    const model = this.models[collection];
    if (!model) throw new Error(`Collection ${collection} not found`);
    return await model.countDocuments(filter);
  }

  async aggregate(collection, pipeline) {
    const model = this.models[collection];
    if (!model) throw new Error(`Collection ${collection} not found`);
    return await model.aggregate(pipeline);
  }

  getModel(collection) {
    return this.models[collection];
  }
}

export default MongoAdapter;
