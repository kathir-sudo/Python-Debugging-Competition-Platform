import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema({
  id: Number,
  input: String,
  expected: String,
}, { _id: false });

const problemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  initialCode: { type: String, default: '' },
  inputFormat: String,
  outputFormat: String,
  constraints: [String],
  hint: String,
  solution: String,
  showSampleCases: { type: Boolean, default: true },
  visibleTestCases: [testCaseSchema],
  hiddenTestCases: [testCaseSchema],
});

problemSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

const Problem = mongoose.model('Problem', problemSchema);

export default Problem;