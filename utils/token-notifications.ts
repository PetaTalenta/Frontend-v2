import { toast } from 'sonner';
import { TokenTransaction } from './token-balance';

/**
 * Show success notification for token operations
 */
export function showTokenSuccess(message: string, details?: string) {
  toast.success('Token Operation Successful', {
    description: details ? `${message}\n${details}` : message,
    duration: 4000,
    action: {
      label: 'Dismiss',
      onClick: () => {},
    },
  });
}

/**
 * Show error notification for token operations
 */
export function showTokenError(message: string, details?: string) {
  toast.error('Token Operation Failed', {
    description: details ? `${message}\n${details}` : message,
    duration: 6000,
    action: {
      label: 'Dismiss',
      onClick: () => {},
    },
  });
}

/**
 * Show warning notification for insufficient tokens
 */
export function showInsufficientTokensWarning(currentBalance: number, requiredTokens: number = 2) {
  toast.warning('Insufficient Token Balance', {
    description: `You have ${currentBalance} tokens but need ${requiredTokens} tokens to submit an assessment.`,
    duration: 8000,
    action: {
      label: 'Got it',
      onClick: () => {},
    },
  });
}

/**
 * Show notification for token deduction
 */
export function showTokenDeduction(tokensDeducted: number, newBalance: number, reason: string = 'assessment submission') {
  toast.info('Tokens Deducted', {
    description: `${tokensDeducted} tokens deducted for ${reason}. New balance: ${newBalance} tokens.`,
    duration: 5000,
    action: {
      label: 'OK',
      onClick: () => {},
    },
  });
}

/**
 * Show notification for token bonus/reward
 */
export function showTokenBonus(tokensAwarded: number, newBalance: number, reason: string = 'assessment completion') {
  toast.success('Tokens Awarded!', {
    description: `🎉 You earned ${tokensAwarded} tokens for ${reason}! New balance: ${newBalance} tokens.`,
    duration: 6000,
    action: {
      label: 'Awesome!',
      onClick: () => {},
    },
  });
}

/**
 * Show comprehensive notification for token transaction
 */
export function showTokenTransaction(transaction: TokenTransaction) {
  const { type, amount, reason, newBalance } = transaction;
  
  if (type === 'deduction') {
    showTokenDeduction(amount, newBalance, reason);
  } else if (type === 'bonus') {
    showTokenBonus(amount, newBalance, reason);
  }
}

/**
 * Show notification for token balance refresh
 */
export function showTokenBalanceRefresh(balance: number, hasError: boolean = false) {
  if (hasError) {
    toast.error('Token Balance Update Failed', {
      description: 'Could not refresh your token balance. Please try again.',
      duration: 4000,
    });
  } else {
    toast.success('Token Balance Updated', {
      description: `Current balance: ${balance} tokens`,
      duration: 3000,
    });
  }
}

/**
 * Show notification when assessment submission starts
 */
export function showAssessmentSubmissionStart() {
  toast.loading('Submitting Assessment...', {
    description: 'Processing your assessment and deducting tokens.',
    id: 'assessment-submission',
  });
}

/**
 * Dismiss assessment submission notification and show result
 */
export function showAssessmentSubmissionResult(success: boolean, message: string) {
  toast.dismiss('assessment-submission');
  
  if (success) {
    toast.success('Assessment Submitted Successfully!', {
      description: message,
      duration: 5000,
    });
  } else {
    toast.error('Assessment Submission Failed', {
      description: message,
      duration: 6000,
    });
  }
}
