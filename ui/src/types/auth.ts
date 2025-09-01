export interface WorkOSUser {
  object: 'user'
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  email_verified?: boolean
  profile_picture_url?: string | null
  last_sign_in_at?: string | null
  created_at?: string | null
  updated_at?: string | null
  external_id?: string | null
  metadata: Record<string, unknown>
}

export interface MeResponse {
  authenticated: boolean
  user: WorkOSUser
}


