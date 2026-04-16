import { User, Designation, Department, Project, Member, ActionItem, Email, Bench, ImportantLink, Skill } from '../schemas.js';

class MongoAdapter {
  constructor() {
    this.models = {
      users: User,
      designations: Designation,
      departments: Department,
      projects: Project,
      members: Member,
      actionItems: ActionItem,
      emails: Email,
      bench: Bench,
      importantLinks: ImportantLink,
      skills: Skill
    };
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

    return await query.exec();
  }

  async findOne(collection, filter) {
    const model = this.models[collection];
    if (!model) throw new Error(`Collection ${collection} not found`);
    return await model.findOne(filter);
  }

  async findById(collection, id) {
    const model = this.models[collection];
    if (!model) throw new Error(`Collection ${collection} not found`);
    return await model.findById(id);
  }

  async create(collection, data) {
    const model = this.models[collection];
    if (!model) throw new Error(`Collection ${collection} not found`);
    const doc = new model(data);
    return await doc.save();
  }

  async update(collection, id, data) {
    const model = this.models[collection];
    if (!model) throw new Error(`Collection ${collection} not found`);
    return await model.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(collection, id) {
    const model = this.models[collection];
    if (!model) throw new Error(`Collection ${collection} not found`);
    return await model.findByIdAndDelete(id);
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
