import { NextRequest, NextResponse } from 'next/server';

const REAL_API_BASE_URL = 'https://api.futureguide.id';

export async function POST(request: NextRequest) {
  try {
    console.log('Auth Register Proxy: Forwarding register request to real API');

    const body = await request.json();

    // Log the request body for debugging (without sensitive data)
    console.log('Auth Register Proxy: Request body:', {
      email: body.email,
      hasPassword: !!body.password,
      passwordLength: body.password?.length || 0
    });

    // Validate request body
    if (!body.email || !body.password) {
      console.error('Auth Register Proxy: Missing required fields');
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required'
        }
      }, {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      console.error('Auth Register Proxy: Invalid email format');
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid email format'
        }
      }, {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Validate password length
    if (body.password.length < 6) {
      console.error('Auth Register Proxy: Password too short');
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password must be at least 6 characters long'
        }
      }, {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Generate username from email if not provided
    // The external API requires a username field
    const username = body.username || body.email.split('@')[0];

    // Prepare the request body with required fields for external API
    const requestBody = {
      email: body.email,
      password: body.password,
      username: username
    };

    console.log('Auth Register Proxy: Sending to external API:', {
      email: requestBody.email,
      username: requestBody.username,
      hasPassword: !!requestBody.password
    });

    const response = await fetch(`${REAL_API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PetaTalenta-Frontend/1.0',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(15000), // 15 seconds
    });

    const data = await response.json();

    console.log(`Auth Register Proxy: External API responded with status ${response.status}`, {
      success: data.success,
      message: data.message,
      error: data.error,
      hasData: !!data.data
    });

    // Handle specific error cases for better user experience
    if (!response.ok) {
      let errorMessage = 'Registration failed';
      let errorCode = 'REGISTRATION_ERROR';

      if (response.status === 400) {
        if (data.error?.message) {
          errorMessage = data.error.message;
          errorCode = data.error.code || 'VALIDATION_ERROR';
        } else if (data.message) {
          errorMessage = data.message;
        } else {
          // Common 400 errors for registration
          errorMessage = 'Invalid registration data. Please check your email and password.';
          errorCode = 'VALIDATION_ERROR';
        }
      } else if (response.status === 409) {
        errorMessage = 'Email already exists. Please use a different email or try logging in.';
        errorCode = 'EMAIL_EXISTS';
      } else if (response.status === 422) {
        errorMessage = 'Invalid data format. Please check your input.';
        errorCode = 'INVALID_FORMAT';
      } else if (response.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
        errorCode = 'SERVER_ERROR';
      }

      return NextResponse.json({
        success: false,
        error: {
          code: errorCode,
          message: errorMessage
        }
      }, {
        status: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('Auth Register Proxy: Error forwarding register request:', error);
    
    let errorMessage = 'Unknown error';
    let errorType = 'UNKNOWN_ERROR';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        errorType = 'TIMEOUT';
        errorMessage = 'Request timeout (15s)';
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        errorType = 'NETWORK_ERROR';
        errorMessage = 'Network connection failed';
      }
    }

    return NextResponse.json({
      success: false,
      error: {
        code: errorType,
        message: errorMessage,
      },
      timestamp: Date.now(),
    }, {
      status: 503,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
