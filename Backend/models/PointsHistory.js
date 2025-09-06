import mongoose from 'mongoose'

const PointsHistorySchema = new mongoose.Schema({
    formId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Form',
        index: true  // Form analytics
    },
    formType:{
        type:String,
        default:"N/A",
        index: true  // Filter by form type
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
        ref: 'Teacher',
        index: true  // Teacher submissions
    },
    submittedByName: {
        type: String,
        required: true
    },
    submittedAt: {
        type: Date,
        required: true,
        default: Date.now,
        index: true  // Date range queries
    },
    submittedForId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        index: true  // Student history
    },
    submittedForName: {
        type: String,
        required: true
    },
    points: {
        type: Number,
        required: true,
        index: true  // Points analytics
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        index: true  // School analytics
    }
})

// Compound indexes for analytics
PointsHistorySchema.index({ schoolId: 1, submittedAt: -1 });        // School timeline
PointsHistorySchema.index({ submittedForId: 1, submittedAt: -1 });  // Student history
PointsHistorySchema.index({ schoolId: 1, formType: 1 });            // School form analytics
PointsHistorySchema.index({ submittedById: 1, submittedAt: -1 });   // Teacher activity

export default mongoose.models.PointsHistory || mongoose.model('PointsHistory', PointsHistorySchema)