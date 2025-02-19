import mongoose from 'mongoose';

const SchoolSchema = new mongoose.Schema({
    name : {type:String, required: true},
    logo : {type:String},
    address: {type:String},
    district: {type:String},
    teachers : [{type : mongoose.Schema.Types.ObjectId , ref : 'Teacher' }],
    students : [{type : mongoose.Schema.Types.ObjectId , ref : 'Student' }],
    createdAt : {type : Date, default : Date.now},
    createdBy: {type: mongoose.Types.ObjectId, ref: 'User'},
    state: {type: String, default: ''},
    country: {type: String, default: ''},
});

export default mongoose.model('School', SchoolSchema);