export const ACCESS_TOKEN_OPTIONS = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 1000 * 60 * 60 * 1,
    path: '/'
  }
export const REFRESH_TOKEN_OPTIONS = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 1000 * 60 * 60 * 24,
    path: '/'
  }
  
