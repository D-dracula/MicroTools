import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/client";
import { 
  withAdminMiddleware, 
  type AdminContext 
} from '@/lib/admin/admin-middleware';

/**
 * POST /api/admin/confirm-user
 * Admin endpoint to confirm a user's email (for fixing users created before auto-confirm)
 * 
 * Requirements: 4.4, 11.1, 11.2, 11.3, 11.4
 */
async function confirmUserHandler(request: NextRequest, context: AdminContext): Promise<NextResponse> {
  const { userEmail: adminEmail, requestId } = context;

  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ 
        success: false,
        error: 'Email is required',
        requestId,
      }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();
    
    // Get user by email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      return NextResponse.json({ 
        success: false,
        error: listError.message,
        requestId,
      }, { status: 500 });
    }
    
    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'User not found',
        requestId,
      }, { status: 404 });
    }
    
    if (user.email_confirmed_at) {
      return NextResponse.json({ 
        success: true,
        message: 'User email already confirmed',
        user: { id: user.id, email: user.email },
        requestId,
      });
    }
    
    // Update user to confirm email
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    });
    
    if (error) {
      return NextResponse.json({ 
        success: false,
        error: error.message,
        requestId,
      }, { status: 500 });
    }
    
    console.log(`✅ Confirmed email for user: ${email} by admin: ${adminEmail}`);
    
    return NextResponse.json({
      success: true,
      message: 'User email confirmed successfully',
      user: { id: data.user.id, email: data.user.email },
      requestId,
    });
    
  } catch (error) {
    console.error('Error confirming user:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      requestId,
    }, { status: 500 });
  }
}

// Export handler with admin middleware
// Requirements: 11.1, 11.2, 11.3, 11.4
export const POST = withAdminMiddleware(confirmUserHandler, {
  endpoint: '/api/admin/confirm-user',
  action: 'confirm_user_email',
  rateLimit: true,
  logRequests: true,
});
