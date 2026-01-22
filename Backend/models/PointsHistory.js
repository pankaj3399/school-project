import mongoose from 'mongoose'

const PointsHistorySchema = new mongoose.Schema({
    formId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Form'
    },
    formType:{
        type:String,
        default:"N/A"
    },
    formName: {
        type: String,
        required: true
    },
    formSubmissionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FormSubmission'
    },
    submittedById: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher'
    },
    submittedByName: {
        type: String,
        required: true
    },
    submittedBySubject: {
        type: String,
        default: null
    },
    submittedAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    submittedForId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    },
    submittedForName: {
        type: String,
        required: true
    },
    points: {
        type: Number,
        required: true
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School'
    },
    // Goal category for IEP form submissions (e.g., 'Communication goal', 'Math goal', etc.)
    goal: {
        type: String,
        default: null
    }
})

PointsHistorySchema.index({ submittedForId: 1 });
PointsHistorySchema.index({ submittedById: 1 });
PointsHistorySchema.index({ schoolId: 1, submittedAt: 1 });

export default mongoose.models.PointsHistory || mongoose.model('PointsHistory', PointsHistorySchema)