const User = require('../models/User');

// Plan configurations
const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    scansPerMonth: 10,
    codeReviewsPerDay: 3,
    toolsAvailable: ['nikto', 'gobuster'],
    features: ['Basic scanning', 'Scan history', 'PDF export']
  },
  pro: {
    name: 'Pro',
    price: 9.99,
    scansPerMonth: 100,
    codeReviewsPerDay: 20,
    toolsAvailable: ['nikto', 'gobuster', 'nuclei', 'sqlmap'],
    features: ['All Free features', 'Advanced scanning tools', 'Priority support', 'AI Code Review']
  },
  vip: {
    name: 'VIP',
    price: 29.99,
    scansPerMonth: -1, // Unlimited
    codeReviewsPerDay: -1, // Unlimited
    toolsAvailable: ['nikto', 'gobuster', 'nuclei', 'sqlmap', 'xsstrike', 'wpscan'],
    features: ['All Pro features', 'Unlimited scans', 'Unlimited code reviews', 'Auto-remediation suggestions', 'API access']
  }
};

/**
 * Get plan details
 */
const getPlanDetails = (planName) => {
  return PLANS[planName] || PLANS.free;
};

/**
 * Get all available plans
 */
const getAllPlans = () => {
  return Object.entries(PLANS).map(([key, plan]) => ({
    id: key,
    ...plan
  }));
};

/**
 * Check if user can perform a scan based on their plan limits
 */
const canPerformScan = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const plan = getPlanDetails(user.subscription?.plan || 'free');
  
  // Check if subscription is active (for paid plans)
  if (user.subscription?.plan !== 'free' && user.subscription?.status !== 'active') {
    return { allowed: false, reason: 'Subscription is not active' };
  }

  // Unlimited scans
  if (plan.scansPerMonth === -1) {
    return { allowed: true };
  }

  // Reset monthly count if needed
  const now = new Date();
  if (user.usage?.scansResetDate && now > user.usage.scansResetDate) {
    await User.findByIdAndUpdate(userId, {
      'usage.scansThisMonth': 0,
      'usage.scansResetDate': new Date(now.getFullYear(), now.getMonth() + 1, 1)
    });
    return { allowed: true };
  }

  const scansUsed = user.usage?.scansThisMonth || 0;
  if (scansUsed >= plan.scansPerMonth) {
    return { 
      allowed: false, 
      reason: `Monthly scan limit reached (${scansUsed}/${plan.scansPerMonth}). Upgrade your plan for more scans.`,
      limit: plan.scansPerMonth,
      used: scansUsed
    };
  }

  return { allowed: true, remaining: plan.scansPerMonth - scansUsed };
};

/**
 * Check if user can perform code review based on their plan limits
 */
const canPerformCodeReview = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const plan = getPlanDetails(user.subscription?.plan || 'free');
  
  // Check if subscription is active (for paid plans)
  if (user.subscription?.plan !== 'free' && user.subscription?.status !== 'active') {
    return { allowed: false, reason: 'Subscription is not active' };
  }

  // Unlimited code reviews
  if (plan.codeReviewsPerDay === -1) {
    return { allowed: true };
  }

  // Reset daily count if needed
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (user.usage?.codeReviewsResetDate && now > user.usage.codeReviewsResetDate) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    await User.findByIdAndUpdate(userId, {
      'usage.codeReviewsToday': 0,
      'usage.codeReviewsResetDate': tomorrow
    });
    return { allowed: true };
  }

  const reviewsUsed = user.usage?.codeReviewsToday || 0;
  if (reviewsUsed >= plan.codeReviewsPerDay) {
    return { 
      allowed: false, 
      reason: `Daily code review limit reached (${reviewsUsed}/${plan.codeReviewsPerDay}). Upgrade your plan or try again tomorrow.`,
      limit: plan.codeReviewsPerDay,
      used: reviewsUsed
    };
  }

  return { allowed: true, remaining: plan.codeReviewsPerDay - reviewsUsed };
};

/**
 * Check if a tool is available for user's plan
 */
const isToolAvailable = async (userId, toolName) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const plan = getPlanDetails(user.subscription?.plan || 'free');
  return plan.toolsAvailable.includes(toolName.toLowerCase());
};

/**
 * Check if auto-remediation is available for user
 */
const hasAutoRemediation = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return false;
  
  return user.subscription?.plan === 'vip' && user.subscription?.status === 'active';
};

/**
 * Increment scan count for user
 */
const incrementScanCount = async (userId) => {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  
  await User.findByIdAndUpdate(userId, {
    $inc: { 'usage.scansThisMonth': 1 },
    $setOnInsert: { 'usage.scansResetDate': nextMonth }
  }, { upsert: true });
};

/**
 * Increment code review count for user
 */
const incrementCodeReviewCount = async (userId) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  await User.findByIdAndUpdate(userId, {
    $inc: { 'usage.codeReviewsToday': 1 },
    $setOnInsert: { 'usage.codeReviewsResetDate': tomorrow }
  }, { upsert: true });
};

/**
 * Upgrade user's subscription
 */
const upgradeSubscription = async (userId, newPlan, paymentDetails = {}) => {
  if (!PLANS[newPlan]) {
    throw new Error('Invalid plan');
  }

  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + 1);

  const updateData = {
    'subscription.plan': newPlan,
    'subscription.status': newPlan === 'free' ? 'active' : 'active', // Would be 'pending' until payment confirmed
    'subscription.startDate': now,
    'subscription.endDate': newPlan === 'free' ? null : endDate,
    'subscription.autoRenew': paymentDetails.autoRenew || false
  };

  const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
  
  return {
    success: true,
    plan: PLANS[newPlan],
    subscription: user.subscription
  };
};

/**
 * Cancel subscription (downgrade to free)
 */
const cancelSubscription = async (userId) => {
  const user = await User.findByIdAndUpdate(userId, {
    'subscription.status': 'cancelled',
    'subscription.autoRenew': false
  }, { new: true });

  return {
    success: true,
    message: 'Subscription cancelled. You will retain access until the end of your billing period.',
    endDate: user.subscription?.endDate
  };
};

/**
 * Get user's subscription status and usage
 */
const getSubscriptionStatus = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const plan = getPlanDetails(user.subscription?.plan || 'free');
  const usage = user.usage || {};

  return {
    plan: {
      id: user.subscription?.plan || 'free',
      ...plan
    },
    status: user.subscription?.status || 'active',
    startDate: user.subscription?.startDate,
    endDate: user.subscription?.endDate,
    autoRenew: user.subscription?.autoRenew || false,
    usage: {
      scansThisMonth: usage.scansThisMonth || 0,
      scansLimit: plan.scansPerMonth,
      scansRemaining: plan.scansPerMonth === -1 ? 'Unlimited' : Math.max(0, plan.scansPerMonth - (usage.scansThisMonth || 0)),
      codeReviewsToday: usage.codeReviewsToday || 0,
      codeReviewsLimit: plan.codeReviewsPerDay,
      codeReviewsRemaining: plan.codeReviewsPerDay === -1 ? 'Unlimited' : Math.max(0, plan.codeReviewsPerDay - (usage.codeReviewsToday || 0))
    }
  };
};

module.exports = {
  PLANS,
  getPlanDetails,
  getAllPlans,
  canPerformScan,
  canPerformCodeReview,
  isToolAvailable,
  hasAutoRemediation,
  incrementScanCount,
  incrementCodeReviewCount,
  upgradeSubscription,
  cancelSubscription,
  getSubscriptionStatus
};
