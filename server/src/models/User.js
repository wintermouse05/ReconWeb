const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  plan: {
    type: String,
    enum: ['free', 'vip_monthly', 'vip_annual'],
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  },
  startDate: Date,
  expiresAt: Date,
  autoRenew: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const usageSchema = new mongoose.Schema({
  scansThisMonth: { type: Number, default: 0 },
  codeReviewsToday: { type: Number, default: 0 },
  lastScanReset: { type: Date, default: Date.now },
  lastReviewReset: { type: Date, default: Date.now }
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 180,
    },
    password: {
      type: String,
      required: true,
    },
    subscription: {
      type: subscriptionSchema,
      default: () => ({ plan: 'free', status: 'active' })
    },
    usage: {
      type: usageSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true,
  }
);

userSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
