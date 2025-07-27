/**
 * School API Service
 * Handles school-related operations including fetching available schools
 */

const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? '' // Use relative URLs in development (will use proxy)
  : 'https://api.chhrone.web.id';

// Types for school data
export interface School {
  id: number;
  name: string;
  location?: string;
  province?: string;
  city?: string;
  type?: string;
}

export interface SchoolsResponse {
  success: boolean;
  data?: School[];
  message?: string;
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * Make API request with proper error handling
 */
async function makeApiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ response: Response; apiSource: 'real' | 'mock' }> {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'User-Agent': 'PetaTalenta-Frontend/1.0',
  };

  const requestOptions: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    // Try real API first via proxy
    console.log(`School API: Making request to ${endpoint}`);
    const response = await fetch(`/api/proxy/auth${endpoint}`, requestOptions);
    
    return { response, apiSource: 'real' };
  } catch (error) {
    console.error('School API: Real API request failed:', error);
    
    // Return mock response for development
    if (process.env.NODE_ENV === 'development') {
      console.log('School API: Using mock data for development');
      return { response: await getMockResponse(endpoint, requestOptions), apiSource: 'mock' };
    }
    
    throw error;
  }
}

/**
 * Mock API responses for development
 */
async function getMockResponse(endpoint: string, options: RequestInit): Promise<Response> {
  // Mock schools data
  const mockSchools: School[] = [
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

  if (endpoint === '/schools') {
    return new Response(JSON.stringify({
      success: true,
      data: mockSchools
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (endpoint.startsWith('/schools/by-location')) {
    // Filter by location if query parameter is provided
    const url = new URL(`http://localhost${endpoint}`);
    const location = url.searchParams.get('location');
    const province = url.searchParams.get('province');
    
    let filteredSchools = mockSchools;
    
    if (location) {
      filteredSchools = filteredSchools.filter(school => 
        school.location?.toLowerCase().includes(location.toLowerCase()) ||
        school.city?.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    if (province) {
      filteredSchools = filteredSchools.filter(school => 
        school.province?.toLowerCase().includes(province.toLowerCase())
      );
    }

    return new Response(JSON.stringify({
      success: true,
      data: filteredSchools
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Default error response
  return new Response(JSON.stringify({
    success: false,
    error: { message: 'Endpoint not found' }
  }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Get all available schools
 */
export async function getSchools(token?: string): Promise<SchoolsResponse> {
  try {
    console.log('School API: Fetching all schools');

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const { response, apiSource } = await makeApiRequest('/schools', {
      method: 'GET',
      headers,
    });

    const data: SchoolsResponse = await response.json();
    
    console.log(`School API: Schools fetched from ${apiSource} API - Status: ${response.status}, Success: ${data.success}`);
    console.log(`School API: Found ${data.data?.length || 0} schools`);

    if (!response.ok) {
      console.error('School API: Failed to fetch schools with status:', response.status);
      console.error('School API: Error details:', data.error);
      return data;
    }

    return data;
  } catch (error) {
    console.error('School API: Error fetching schools:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch schools'
      }
    };
  }
}

/**
 * Get schools by location
 */
export async function getSchoolsByLocation(
  location?: string, 
  province?: string, 
  token?: string
): Promise<SchoolsResponse> {
  try {
    console.log('School API: Fetching schools by location:', { location, province });

    const params = new URLSearchParams();
    if (location) params.append('location', location);
    if (province) params.append('province', province);

    const queryString = params.toString();
    const endpoint = `/schools/by-location${queryString ? `?${queryString}` : ''}`;

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const { response, apiSource } = await makeApiRequest(endpoint, {
      method: 'GET',
      headers,
    });

    const data: SchoolsResponse = await response.json();
    
    console.log(`School API: Schools by location fetched from ${apiSource} API - Status: ${response.status}, Success: ${data.success}`);
    console.log(`School API: Found ${data.data?.length || 0} schools for location: ${location || 'all'}`);

    if (!response.ok) {
      console.error('School API: Failed to fetch schools by location with status:', response.status);
      console.error('School API: Error details:', data.error);
      return data;
    }

    return data;
  } catch (error) {
    console.error('School API: Error fetching schools by location:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch schools by location'
      }
    };
  }
}

/**
 * Validate if a school ID exists
 */
export async function validateSchoolId(schoolId: number, token?: string): Promise<boolean> {
  try {
    const schoolsResponse = await getSchools(token);
    
    if (!schoolsResponse.success || !schoolsResponse.data) {
      return false;
    }

    return schoolsResponse.data.some(school => school.id === schoolId);
  } catch (error) {
    console.error('School API: Error validating school ID:', error);
    return false;
  }
}

/**
 * Find school by ID
 */
export async function getSchoolById(schoolId: number, token?: string): Promise<School | null> {
  try {
    const schoolsResponse = await getSchools(token);
    
    if (!schoolsResponse.success || !schoolsResponse.data) {
      return null;
    }

    return schoolsResponse.data.find(school => school.id === schoolId) || null;
  } catch (error) {
    console.error('School API: Error finding school by ID:', error);
    return null;
  }
}
