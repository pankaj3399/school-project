import mongoose from "mongoose";


const feedbackSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now, 
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School', 
    default: null,
  },
  submittedById: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Teacher'
      },
      submittedByName: {
          type: String,
          required: true
      },
      submittedForId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Student'
          },
          submittedForName: {
              type: String,
              required: true
          },
          feedback:{
                type: String,
                required: true
          },
            submittedBySubject: {
                type: String,
                required: true
            }
});

export default mongoose.model("Feedback", feedbackSchema);