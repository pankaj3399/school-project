import mongoose from 'mongoose';

const SchoolSchema = new mongoose.Schema({
    name : {type: String, required: true},
    logo : {type : String},
    teachers : [{type : mongoose.Schema.Types.ObjectId , ref : 'Teacher' }],
    students : [{type : mongoose.Schema.Types.ObjectId , ref : 'Student' }],
    
    createdAt : {type : Date, default : Date.now}
});

export default mongoose.model('School', SchoolSchema);