import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken, getUserTokenBalance, updateUserTokenBalance } from '../../auth/token-balance/route';

// Mock job storage
const mockJobs = new Map<string, any>();

const ASSESSMENT_TOKEN_COST = 2;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userId = getUserIdFromToken(authHeader);
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      }, { status: 401 });
    }

    const body = await request.json();
    const { assessmentName, riasec, ocean, viaIs } = body;

    console.log('Mock API: Assessment submission for user:', userId);
    console.log('Mock API: Assessment data received:', { assessmentName, riasec: !!riasec, ocean: !!ocean, viaIs: !!viaIs });

    // Check token balance
    const currentBalance = getUserTokenBalance(userId);
    console.log(`Mock API: Current token balance: ${currentBalance}, Required: ${ASSESSMENT_TOKEN_COST}`);

    if (currentBalance < ASSESSMENT_TOKEN_COST) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INSUFFICIENT_TOKENS',
          message: `Insufficient token balance. You have ${currentBalance} tokens but need ${ASSESSMENT_TOKEN_COST} tokens to submit an assessment.`,
          details: {
            currentBalance,
            requiredTokens: ASSESSMENT_TOKEN_COST,
            timestamp: new Date().toISOString(),
          },
        },
      }, { status: 402 }); // 402 Payment Required
    }

    // Deduct tokens
    const newBalance = currentBalance - ASSESSMENT_TOKEN_COST;
    updateUserTokenBalance(userId, newBalance);
    
    console.log(`Mock API: Tokens deducted. New balance: ${newBalance}`);

    // Generate job ID
    const jobId = 'job-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);

    // Store job data
    const jobData = {
      id: jobId,
      userId,
      status: 'processing',
      assessmentData: { assessmentName, riasec, ocean, viaIs },
      submittedAt: new Date().toISOString(),
      tokensDeducted: ASSESSMENT_TOKEN_COST,
      previousBalance: currentBalance,
      newBalance: newBalance,
    };

    mockJobs.set(jobId, jobData);

    // Simulate processing time - mark as completed after 3 seconds
    setTimeout(() => {
      const job = mockJobs.get(jobId);
      if (job) {
        job.status = 'completed';
        job.completedAt = new Date().toISOString();
        
        // Award completion tokens (5 tokens for completing assessment)
        const completionBonus = 5;
        const finalBalance = getUserTokenBalance(userId) + completionBonus;
        updateUserTokenBalance(userId, finalBalance);
        
        job.completionBonus = completionBonus;
        job.finalBalance = finalBalance;
        
        console.log(`Mock API: Assessment ${jobId} completed. Awarded ${completionBonus} tokens. Final balance: ${finalBalance}`);
        mockJobs.set(jobId, job);
      }
    }, 3000);

    return NextResponse.json({
      success: true,
      data: {
        jobId: jobId,
        status: 'processing',
        message: 'Assessment submitted successfully. Processing will begin shortly.',
        tokenInfo: {
          tokensDeducted: ASSESSMENT_TOKEN_COST,
          previousBalance: currentBalance,
          newBalance: newBalance,
        },
      },
    });

  } catch (error) {
    console.error('Mock API: Assessment submission error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    }, { status: 500 });
  }
}

// Export mockJobs for use in status endpoint
export { mockJobs };
