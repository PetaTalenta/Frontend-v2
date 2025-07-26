import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '../../../auth/token-balance/route';

// Import mockJobs from submit route
// Note: In a real application, this would be stored in a database
const mockJobs = new Map<string, any>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
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

    const { jobId } = await params;
    
    // Try to get job from the submit route's storage
    // This is a workaround for the module isolation in Next.js API routes
    // In a real app, you'd use a shared database or cache
    let job = mockJobs.get(jobId);
    
    if (!job) {
      // If not found in local storage, create a mock completed job
      // This simulates the job being processed and completed
      job = {
        id: jobId,
        userId,
        status: 'completed',
        assessmentData: {
          assessmentName: "AI-Driven Talent Mapping",
          riasec: { realistic: 75, investigative: 60, artistic: 45, social: 80, enterprising: 70, conventional: 55 },
          ocean: { openness: 75, conscientiousness: 80, extraversion: 65, agreeableness: 85, neuroticism: 35 },
          viaIs: { creativity: 80, curiosity: 75, judgment: 70, love_of_learning: 85, perspective: 75 }
        },
        submittedAt: new Date(Date.now() - 5000).toISOString(),
        completedAt: new Date().toISOString(),
        tokensDeducted: 2,
        completionBonus: 5,
      };
    }

    // Verify job belongs to user
    if (job.userId !== userId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied to this assessment job',
        },
      }, { status: 403 });
    }

    console.log(`Mock API: Status check for job ${jobId}: ${job.status}`);

    return NextResponse.json({
      success: true,
      data: {
        jobId: jobId,
        status: job.status,
        submittedAt: job.submittedAt,
        completedAt: job.completedAt,
        tokenInfo: {
          tokensDeducted: job.tokensDeducted,
          completionBonus: job.completionBonus,
          previousBalance: job.previousBalance,
          newBalance: job.newBalance,
          finalBalance: job.finalBalance,
        },
        ...(job.status === 'completed' && {
          message: 'Assessment processing completed successfully',
        }),
        ...(job.status === 'processing' && {
          message: 'Assessment is being processed. Please check again in a few moments.',
        }),
      },
    });

  } catch (error) {
    console.error('Mock API: Status check error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    }, { status: 500 });
  }
}
