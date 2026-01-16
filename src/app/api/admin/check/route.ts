/**
 * Admin Check API Endpoint
 * Checks if a user is admin from database
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminDatabaseOperations } from '@/lib/supabase/database'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ isAdmin: false, error: 'not_authenticated' })
    }
    
    const userId = (session.user as any).id
    if (!userId) {
      return NextResponse.json({ isAdmin: false, error: 'no_user_id' })
    }
    
    const db = createAdminDatabaseOperations()
    const profile = await db.getUserById(userId)
    
    return NextResponse.json({ 
      isAdmin: profile?.is_admin === true,
      userId,
    })
  } catch (error) {
    console.error('Admin check error:', error)
    return NextResponse.json({ isAdmin: false, error: 'server_error' })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ isAdmin: false, error: 'no_user_id' })
    }
    
    const db = createAdminDatabaseOperations()
    const profile = await db.getUserById(userId)
    
    return NextResponse.json({ 
      isAdmin: profile?.is_admin === true,
      userId,
    })
  } catch (error) {
    console.error('Admin check error:', error)
    return NextResponse.json({ isAdmin: false, error: 'server_error' })
  }
}
