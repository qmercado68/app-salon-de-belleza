import { NextResponse, type NextRequest } from 'next/server'
// The client you created in Step 1
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const salonId = searchParams.get('salon_id')
  // if "next" is in search params, use it as the redirection URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // If the magic link carried a salon_id, associate the client with that salon.
      // Only update if the profile does not already have a salon_id (idempotent).
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Wait a small moment or perform a check to ensure the trigger...
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, salon_id')
          .eq('id', user.id)
          .single()

        if (profileError && profileError.code === 'PGRST116') {
          // If profile doesn't exist yet, we try to create it manually as a fallback 
          // (though the trigger should handle it, this is for maximum robustness)
          await supabase.from('profiles').insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || 'Nuevo Usuario',
            role: 'client'
          })
        }

        if (salonId && (!profile || !profile.salon_id)) {
          await supabase
            .from('profiles')
            .update({ salon_id: salonId })
            .eq('id', user.id)
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host') // if available, use it to ensure the correct domain
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can safely direct to the origin
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
    console.error('Auth callback error:', error)
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-error?error=callback_failed`)
}
