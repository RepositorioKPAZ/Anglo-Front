import { NextResponse } from 'next/server';
import { findUserByRutInDb } from '@/lib/services/database-service';
import { User } from '@/lib/types/user';

export async function GET() {
  try {
    const testCases = [
      {
        name: 'Admin Login',
        rut: '13.056.521-2',
        password: '218521',
        expectedResult: 'success'
      },
      {
        name: 'Regular User Login',
        rut: '76.322.146-6',
        password: 'MB6357632024',
        expectedResult: 'success'
      },
      {
        name: 'Invalid Credentials',
        rut: '76.322.146-6',
        password: 'wrong_password',
        expectedResult: 'failure'
      },
      {
        name: 'Non-existent User',
        rut: '99999999-9',
        password: 'any_password',
        expectedResult: 'failure'
      }
    ];

    const results = [];

    for (const testCase of testCases) {
      console.log(`\nTesting: ${testCase.name}`);
      
      // Try database first
      const dbUser = await findUserByRutInDb(testCase.rut);
      console.log('Database lookup:', dbUser ? 'Found' : 'Not found');
      
      const user = dbUser;
      const isValidPassword = user?.Empresa_C === testCase.password;
      
      const result = {
        testCase: testCase.name,
        expectedResult: testCase.expectedResult,
        actualResult: isValidPassword ? 'success' : 'failure',
        userFound: !!user,
        passwordValid: isValidPassword,
        source: dbUser ? 'database' : 'none'
      };
      
      results.push(result);
      console.log('Result:', result);
    }

    return NextResponse.json({ 
      success: true, 
      results 
    });
  } catch (error: any) {
    console.error('Test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'An unknown error occurred'
      }, 
      { status: 500 }
    );
  }
} 