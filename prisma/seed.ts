import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
   // Create admin user
   const admin = await prisma.user.upsert({
      where: { email: 'admin@sinag.com' },
      update: {},
      create: {
         email: 'admin@sinag.com',
         name: 'Admin User',
         role: 'ADMIN',
      },
   })
   console.log('✅ Created admin:', admin)

   // Create sample staff
   const staff = await prisma.user.upsert({
      where: { email: 'staff@sinag.com' },
      update: {},
      create: {
         email: 'staff@sinag.com',
         name: 'Staff User',
         role: 'STAFF',
      },
   })
   console.log('✅ Created staff:', staff)

   // Create sample rider
   const rider = await prisma.user.upsert({
      where: { email: 'rider@sinag.com' },
      update: {},
      create: {
         email: 'rider@sinag.com',
         name: 'Rider User',
         role: 'RIDER',
      },
   })
   console.log('✅ Created rider:', rider)

   // Create regular user
   const user = await prisma.user.upsert({
      where: { email: 'user@sinag.com' },
      update: {},
      create: {
         email: 'user@sinag.com',
         name: 'Regular User',
         role: 'USER',
      },
   })
   console.log('✅ Created user:', user)

   console.log('\n🎉 Database seeded successfully!')
   console.log('\n📝 Test accounts:')
   console.log('  Admin: admin@sinag.com')
   console.log('  Staff: staff@sinag.com')
   console.log('  Rider: rider@sinag.com')
   console.log('  User:  user@sinag.com')
   console.log('\n⚠️  Note: These accounts exist in your database, but you\'ll need to create them in Supabase Auth with the same emails and passwords.')
}

main()
   .catch((e) => {
      console.error(e)
      process.exit(1)
   })
   .finally(async () => {
      await prisma.$disconnect()
   })