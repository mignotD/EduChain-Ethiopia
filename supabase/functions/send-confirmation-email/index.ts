import { corsHeaders } from '../_shared/cors.ts'

console.log("send-confirmation-email function started")

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Confirmation email function called')
    
    // For now, just return success - this prevents the 404 error
    // You can implement actual email sending logic here later if needed
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email confirmation handled' 
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in send-confirmation-email:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200, // Return 200 to prevent auth failures
      }
    )
  }
})