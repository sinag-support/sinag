import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
   return twMerge(clsx(inputs))
}

export function isVariableValid(value: any): boolean {
   return value !== null && value !== undefined && value !== ''
}

export function validateBoolean(value: any): boolean {
   return value === true || value === 'true'
}

export function isEmailValid(email: string): boolean {
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
   return emailRegex.test(email)
}