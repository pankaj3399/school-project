import mongoose from "mongoose";

const PendingTokenSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    tokens: [
      {
        form: {
          type: mongoose.Schema.Types.Mixed,
          required: true,
        },
        data: {
          type: mongoose.Schema.Types.Mixed,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

// Create index for faster lookups by studentId
PendingTokenSchema.index({ studentId: 1 });

const PendingTokens = mongoose.model("PendingTokens", PendingTokenSchema);

export default PendingTokens;
