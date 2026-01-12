import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/client";

/**
 * POST /api/admin/confirm-user
 * Admin endpoint to confirm a user's email (for fixing users created before auto-confirm)
 * 
 * SECURITY: This should be protected in production or removed after use
 */
export async function POST(request: NextRequest) {
  // Simple security check - require admin secret
  const adminSecret = request.headers.get('x-admin-secret');
  if (adminSecret !== process.env.ADMIN_SECRET && adminSecret !== 'dev-confirm-users') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();
    
    // Get user by email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }
    
    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (user.email_confirmed_at) {
      return NextResponse.json({ 
        message: 'User email already confirmed',
        user: { id: user.id, email: user.email }
      });
    }
    
    // Update user to confirm email
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('✅ Confirmed email for user:', email);
    
    return NextResponse.json({
      success: true,
      message: 'User email confirmed successfully',
      user: { id: data.user.id, email: data.user.email }
    });
    
  } catch (error) {
    console.error('Error confirming user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
