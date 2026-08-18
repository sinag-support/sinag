const isBuild = process.env.NEXT_PHASE === 'phase-production-build'

export async function safeQuery<T>(
   queryFn: () => Promise<T>,
   fallback: T
): Promise<T> {
   try {
      return await queryFn()
   } catch (error: any) {
      // During build or if DB is unreachable, return fallback instead of crashing
      if (
         isBuild ||
         error?.code === 'P1001' ||
         error?.message?.includes("Can't reach database server")
      ) {
         console.warn('⚠️ Database unavailable during build, using fallback data.')
         return fallback
      }
      // Re-throw any other errors
      throw error
   }
}