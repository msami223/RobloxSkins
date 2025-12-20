'use server';

import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import {IMAGE_URL} from '../lib/api'



export async function getToken() {
  try {
    const cookieStore = await cookies();
    const tokenCookie =  cookieStore.get('session_token');

    if (!tokenCookie) {
      return null;
    }

    return tokenCookie.value;
  } catch (error) {
    console.error('Failed to get token from cookies:', error.message);
    return null;
  }
}


export async function getUserId() {
  try {
    const cookieStore = await
     cookies();
    const tokenCookie =  cookieStore.get('session_token');

    if (!tokenCookie) {
      return null;
    }

    const token = tokenCookie.value;
    const secret = "secret";

    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set.');
    }

    const decodedPayload = jwt.verify(token, secret);

    if (typeof decodedPayload === 'string' || !decodedPayload._id) {
      return null;
    }

    return decodedPayload._id;

  } catch (error) {

    console.error('Failed to validate session token:', error.message);
    return null;
  }
}



export async function getUserData() {
  try {
    const token = await getToken();

    if (!token) {
      return null;
    }

    const secret = "secret";

    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set.');
    }

    const decodedPayload = jwt.verify(token, secret);

    if (typeof decodedPayload === 'string') {
      return null;
    }

    return decodedPayload;

  } catch (error) {
    console.error('Failed to get user data from token:', error.message);
    return null;
  }
}


export const getUserApiData = async (userId) => {
  const token = getToken();

  if (!userId ) {
    console.warn("Attempted to fetch user data without ID or Token.");
    return null;
  }
  try {
    const apiUrl = `${IMAGE_URL}/auth/${userId}`;

    const response = await fetch(apiUrl, {
      method: 'GET', 
      headers: {
        'Content-Type': 'application/json',
        
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }
    const userData = await response.json();
    return userData;

  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
};


export async function logout() {
  try {
    const cookieStore = cookies();
    cookieStore.set('session_token', '', {
      httpOnly: true,
      secure: true,
      path: '/',
      expires: new Date(0), // immediately expire
    });
    return { success: true };
  } catch (error) {
    console.error('Error logging out:', error.message);
    return { success: false, error: error.message };
  }
}


// export async function logout() { 
//   try { 
//     const cookieStore = cookies(); 
//     cookieStore.set('session_token', '', { 
//       httpOnly: true, 
//       secure: true, 
//       sameSite: "none",           // Must match what you used when setting
//       domain: ".voxelvalues.com",   // Must match what you used when setting
//       path: '/', 
//       expires: new Date(0),
//     }); 
//     return { success: true }; 
//   } catch (error) { 
//     console.error('Error logging out:', error.message); 
//     return { success: false, error: error.message }; 
//   } 
// }