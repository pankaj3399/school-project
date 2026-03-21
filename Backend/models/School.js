import mongoose, { model } from 'mongoose';

const SchoolSchema = new mongoose.Schema({
    name : {type:String, required: true},
    logo : {type:String},
    address: {type:String},
    // Link to District (replaces old district string field)
    districtId: {type: mongoose.Schema.Types.ObjectId, ref: 'District', index: true},
    // Keep legacy field for migration purposes (deprecated)
    district: {type:String},
    teachers : [{type : mongoose.Schema.Types.ObjectId , ref : 'Teacher' }],
    students : [{type : mongoose.Schema.Types.ObjectId , ref : 'Student' }],
    createdAt : {type : Date, default : Date.now},
    createdBy: {type: mongoose.Types.ObjectId, ref: 'User'},
    state: {type: String, default: ''},
    country: {type: String, default: ''},
    timeZone: {type: String, default: ''},
    domain: {type: String, default: ''},
    // Template functionality
    isTemplate: {type: Boolean, default: false},
    templateSourceId: {type: mongoose.Schema.Types.ObjectId, ref: 'School'},
    updatedAt: {type: Date, default: Date.now}
});

SchoolSchema.index({ createdBy: 1 });

export default mongoose.model('School', SchoolSchema);