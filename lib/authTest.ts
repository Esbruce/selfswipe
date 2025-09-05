import { supabase } from './supabase';

/**
 * Test authentication status and provide debugging information
 */
export async function testAuthentication() {
  try {
    console.log('🔍 Testing authentication...');
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return {
        success: false,
        error: `Session error: ${sessionError.message}`,
        details: {
          hasSession: false,
          userId: null,
          userEmail: null,
        }
      };
    }
    
    if (!session) {
      console.log('❌ No active session found');
      return {
        success: false,
        error: 'No active session. User needs to sign in.',
        details: {
          hasSession: false,
          userId: null,
          userEmail: null,
        }
      };
    }
    
    console.log('✅ Active session found');
    console.log('👤 User ID:', session.user.id);
    console.log('📧 User Email:', session.user.email);
    console.log('🔑 Access Token exists:', !!session.access_token);
    console.log('⏰ Token expires at:', new Date(session.expires_at! * 1000));
    
    // Test storage access
    console.log('🗄️ Testing storage access...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Storage access error:', bucketsError);
      return {
        success: false,
        error: `Storage access error: ${bucketsError.message}`,
        details: {
          hasSession: true,
          userId: session.user.id,
          userEmail: session.user.email,
          canAccessStorage: false,
        }
      };
    }
    
    console.log('✅ Storage access successful');
    console.log('📦 Available buckets:', buckets?.map(b => b.name) || []);
    
    return {
      success: true,
      details: {
        hasSession: true,
        userId: session.user.id,
        userEmail: session.user.email,
        canAccessStorage: true,
        availableBuckets: buckets?.map(b => b.name) || [],
      }
    };
    
  } catch (error: any) {
    console.error('❌ Authentication test failed:', error);
    return {
      success: false,
      error: `Test failed: ${error.message}`,
      details: {
        hasSession: false,
        userId: null,
        userEmail: null,
      }
    };
  }
}

/**
 * Test if user can create storage buckets
 */
export async function testBucketCreation() {
  try {
    console.log('🧪 Testing bucket creation permissions...');
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return {
        success: false,
        error: 'Authentication required to test bucket creation',
      };
    }
    
    // Try to create a test bucket (we'll delete it immediately)
    const testBucketName = `test-bucket-${Date.now()}`;
    
    const { data: newBucket, error: createError } = await supabase.storage.createBucket(testBucketName, {
      public: false,
      allowedMimeTypes: ['image/jpeg'],
      fileSizeLimit: 1024000, // 1MB
    });
    
    if (createError) {
      console.error('❌ Bucket creation failed:', createError);
      return {
        success: false,
        error: createError.message,
        canCreateBuckets: false,
      };
    }
    
    console.log('✅ Bucket creation successful');
    
    // Clean up - delete the test bucket
    const { error: deleteError } = await supabase.storage.deleteBucket(testBucketName);
    
    if (deleteError) {
      console.warn('⚠️ Could not delete test bucket:', deleteError);
    } else {
      console.log('🧹 Test bucket cleaned up');
    }
    
    return {
      success: true,
      canCreateBuckets: true,
    };
    
  } catch (error: any) {
    console.error('❌ Bucket creation test failed:', error);
    return {
      success: false,
      error: `Test failed: ${error.message}`,
      canCreateBuckets: false,
    };
  }
}
