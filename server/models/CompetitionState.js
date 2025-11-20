import mongoose from 'mongoose';

const competitionStateSchema = new mongoose.Schema({
  isActive: { type: Boolean, default: false },
  timer: { type: Number, default: 60 },
  allowHints: { type: Boolean, default: true },
  useAntiCheat: { type: Boolean, default: true },
  autoDisqualifyOnTabSwitch: { type: Boolean, default: true },
  tabSwitchViolationLimit: { type: Number, default: 1 },
  violationLimit: { type: Number, default: 3 },
  isPaused: { type: Boolean, default: false },
  announcement: {
    message: String,
    timestamp: Number,
  }
});

const CompetitionState = mongoose.model('CompetitionState', competitionStateSchema);

export default CompetitionState;