export const passwordRequirements = [
   {
      id: 'minLength',
      label: 'At least 8 characters',
      validate: (password: string) => password.length >= 8,
   },
   {
      id: 'uppercase',
      label: 'One uppercase letter',
      validate: (password: string) => /[A-Z]/.test(password),
   },
   {
      id: 'lowercase',
      label: 'One lowercase letter',
      validate: (password: string) => /[a-z]/.test(password),
   },
   {
      id: 'number',
      label: 'One number',
      validate: (password: string) => /[0-9]/.test(password),
   },
   {
      id: 'special',
      label: 'One special character',
      validate: (password: string) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
   },
]

export function validatePassword(password: string) {
   return passwordRequirements.map((req) => ({
      ...req,
      isValid: req.validate(password),
   }))
}

export function isPasswordValid(password: string) {
   return passwordRequirements.every((req) => req.validate(password))
}

export function isEmailValid(email: string): boolean {
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
   return emailRegex.test(email)
}

export function isOTPValid(otp: string): boolean {
   return /^[0-9]{6}$/.test(otp)
}