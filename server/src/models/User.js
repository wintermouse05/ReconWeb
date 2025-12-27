// server/src/models/User.js
const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  plan: {
    type: String,
    enum: ['free', 'pro', 'vip'],  // ← Cập nhật enum cho khớp
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  },
  startDate: Date,
  expiresAt: Date,  // ← Đổi tên từ 'endDate' sang 'expiresAt' nếu cần
  autoRenew: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const usageSchema = new mongoose.Schema({
  scansThisMonth: { type: Number, default: 0 },
  codeReviewsToday: { type: Number, default: 0 },
  scansResetDate: { type: Date, default: Date.now },      // ← Thêm field này
  codeReviewsResetDate: { type: Date, default: Date.now } // ← Thêm field này
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