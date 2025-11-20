import mongoose from 'mongoose';

const testResultSchema = new mongoose.Schema({
  caseId: Number,
  type: String, // 'visible' | 'hidden'
  input: String,
  expected: String,
  actual: String,
  passed: Boolean,
}, { _id: false });

const submissionSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  teamName: { type: String, required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
  problemTitle: { type: String, required: true },
  code: { type: String, required: true },
  results: [testResultSchema],
  timestamp: { type: Number, default: Date.now },
  score: { type: Number, default: 0 },
});

submissionSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});


const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;
