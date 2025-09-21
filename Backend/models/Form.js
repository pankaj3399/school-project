import mongoose from "mongoose";
import { QuestionType, FormType } from "../enum.js";

const optionSchema = new mongoose.Schema({
  value: {
    type: String,
    required: true,
  },
  points: {
    type: Number,
    required: true,
  },
});

const questionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: Object.values(QuestionType),
    required: true,
  },
  isCompulsory: {
    type: Boolean,
    required: true,
  },
  options: {
    type: [optionSchema],
    default: [],    
  },
  maxPoints: {
    type: Number,
    required: true,
  },
  goal:{
    type: String,
  },
  goalSummary:{
    type: String,
  },
  targetedBehaviour:{
    type: String,
  }
});

const formSchema = new mongoose.Schema({
  formName: {
    type: String,
    required: true,
  },
  formType: {
    type: String,
    enum: Object.values(FormType),
    required: true,
  },
  questions: {
    type: [questionSchema], 
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now, 
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School', 
    default: null,
  },
  studentEmail : {
    type : Boolean,
    default : false
  },
  teacherEmail : {
    type : Boolean,
    default : false
  },
  schoolAdminEmail : {
    type : Boolean,
    default : false
  },
  parentEmail : {
    type : Boolean,
    default : false
  },
  isSpecial: {
    type: Boolean,
    default: false
  },
  grade: {
    type: String,
    required: function(){return !this.isSpecial},
    default: ""
  },
  preSelectedStudents: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Student',
    default: []
  }
});

formSchema.index({ schoolId: 1, grade: 1, isSpecial: 1 });

export default mongoose.model("Form", formSchema);