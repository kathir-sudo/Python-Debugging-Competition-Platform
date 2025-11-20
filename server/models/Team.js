import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  teamName: { type: String, required: true, unique: true },
  members: [String],
  score: { type: Number, default: 0 },
  tabSwitchViolations: { type: Number, default: 0 },
  violations: { type: Number, default: 0 },
  isDisqualified: { type: Boolean, default: false },
  hasFinished: { type: Boolean, default: false },
  lastSubmissionTimestamp: { type: Number, default: null },
});

// Use a custom _id to match frontend's expectation if needed, or transform the output
// For simplicity, we'll let mongoose handle _id and the frontend will use it.
// Let's transform the output to use `id` for frontend compatibility.
teamSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString();
        // Map teamName to name for frontend compatibility
        returnedObject.name = returnedObject.teamName;
        delete returnedObject.teamName;
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});


const Team = mongoose.model('Team', teamSchema);

export default Team;