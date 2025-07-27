import { NextRequest, NextResponse } from 'next/server';

const REAL_API_BASE_URL = 'https://api.chhrone.web.id';

export async function GET(request: NextRequest) {
  try {
    console.log('Auth Schools Proxy: Forwarding GET schools request to real API');
    
    const authHeader = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    
    // Build query string from search params
    const queryString = searchParams.toString();
    const endpoint = `/api/auth/schools${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(`${REAL_API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PetaTalenta-Frontend/1.0',
        ...(authHeader && { 'Authorization': authHeader }),
      },
      signal: AbortSignal.timeout(15000), // 15 seconds
    });

    const data = await response.json();
    console.log('Auth Schools Proxy: Real API responded with status:', response.status);
    console.log('Auth Schools Proxy: Response data:', data);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Auth Schools Proxy: Error forwarding GET schools request:', error);
    
    // Return mock data for development
    if (process.env.NODE_ENV === 'development') {
      console.log('Auth Schools Proxy: Real API failed, using mock data in development');
      
      const mockSchools = [
        { id: 1, name: "SMA Negeri 1 Jakarta", location: "Jakarta", province: "DKI Jakarta", city: "Jakarta Pusat", type: "SMA" },
        { id: 2, name: "SMA Negeri 2 Jakarta", location: "Jakarta", province: "DKI Jakarta", city: "Jakarta Selatan", type: "SMA" },
        { id: 3, name: "SMA Negeri 3 Bandung", location: "Bandung", province: "Jawa Barat", city: "Bandung", type: "SMA" },
        { id: 4, name: "SMA Negeri 1 Surabaya", location: "Surabaya", province: "Jawa Timur", city: "Surabaya", type: "SMA" },
        { id: 5, name: "SMA Negeri 1 Medan", location: "Medan", province: "Sumatera Utara", city: "Medan", type: "SMA" },
        { id: 6, name: "SMA Negeri 1 Yogyakarta", location: "Yogyakarta", province: "DI Yogyakarta", city: "Yogyakarta", type: "SMA" },
        { id: 7, name: "SMA Negeri 1 Semarang", location: "Semarang", province: "Jawa Tengah", city: "Semarang", type: "SMA" },
        { id: 8, name: "SMA Negeri 1 Makassar", location: "Makassar", province: "Sulawesi Selatan", city: "Makassar", type: "SMA" },
        { id: 9, name: "SMA Negeri 1 Denpasar", location: "Denpasar", province: "Bali", city: "Denpasar", type: "SMA" },
        { id: 10, name: "SMA Negeri 1 Palembang", location: "Palembang", province: "Sumatera Selatan", city: "Palembang", type: "SMA" },
      ];

      return NextResponse.json({
        success: true,
        data: mockSchools
      }, { status: 200 });
    }

    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to fetch schools' 
        } 
      },
      { status: 500 }
    );
  }
}
