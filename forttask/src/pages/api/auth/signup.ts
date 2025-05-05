import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('API received data:', {
    ...req.body,
    password: req.body.password ? '[REDACTED]' : undefined
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { firstName, lastName, email, password } = req.body;
    
    // Validate inputs
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }
    
    // Name validation - adjust regex as needed
    const nameRegex = /^[a-zA-Z\s'-]{2,50}$/;
    if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
      return res.status(400).json({ message: 'Names can only contain letters, spaces, hyphens and apostrophes' });
    }
    
    // Password validation - adjust as needed
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }
    
    // Here you'd typically store the user in your database
    // For this example, we'll just return success
    
    return res.status(201).json({ 
      success: true,
      message: 'User registered successfully' 
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Something went wrong during registration' });
  }
}