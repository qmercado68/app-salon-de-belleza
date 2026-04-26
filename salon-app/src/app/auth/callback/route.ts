import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { parseFullName } from '@/lib/name'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'email' | 'recovery' | 'invite' | null
  const salonId = searchParams.get('salon_id')
  const next = searchParams.get('next') ?? '/'

  const supabase = await createClient()
  let authError = null

  if (token_hash && type) {
    // Magic link / OTP flow — does not require PKCE state cookie, works across browsers
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    authError = error
  } else if (code) {
    // PKCE flow — requires state cookie from the same browser session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    authError = error
  } else {
    return NextResponse.redirect(`${origin}/auth/auth-error?error=callback_failed`)
  }

  if (authError) {
    console.error('Auth callback error:', authError)
    return NextResponse.redirect(`${origin}/auth/auth-error?error=callback_failed`)
  }

  // Auth succeeded — handle profile creation/association
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, salon_id')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code === 'PGRST116') {
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })

      const derivedFullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Nuevo Usuario'
      const nameParts = parseFullName(derivedFullName)

      await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
        full_name: derivedFullName,
        first_name: nameParts.firstName || null,
        second_name: nameParts.secondName || null,
        last_name: nameParts.lastName || null,
        second_last_name: nameParts.secondLastName || null,
        role: (count === 0) ? 'admin' : 'client',
      })
    }

    if (salonId && (!profile || !profile.salon_id)) {
      await supabase
        .from('profiles')
        .update({ salon_id: salonId })
        .eq('id', user.id)
    }
  }

  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'
  if (isLocalEnv) {
    return NextResponse.redirect(`${origin}${next}`)
  } else if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`)
  } else {
    return NextResponse.redirect(`${origin}${next}`)
  }
}
