import mongoose from "mongoose";
import { QuestionType, FormType } from "../enum.js";
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
    type: [String],
    default: [],    
  },
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
});

export default mongoose.model("Form", formSchema);