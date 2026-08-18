import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
   console.error('Missing environment variables!')
   console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl)
   console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing')
   process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createUsers() {
   const users = [
      { email: 'admin@sinag.com', password: 'Admin@1234', role: 'ADMIN', name: 'Admin User' },
      { email: 'staff@sinag.com', password: 'Staff@1234', role: 'STAFF', name: 'Staff User' },
      { email: 'rider@sinag.com', password: 'Rider@1234', role: 'RIDER', name: 'Rider User' },
      { email: 'user@sinag.com', password: 'User@1234', role: 'USER', name: 'Regular User' },
   ]

   for (const user of users) {
      try {
         const { data, error } = await supabase.auth.admin.createUser({
            email: user.email,
            password: user.password,
            email_confirm: true,
            user_metadata: {
               name: user.name,
               role: user.role,
            },
         })

         if (error) {
            if (error.message.includes('already exists')) {
               console.log(`⚠️  User ${user.email} already exists, skipping...`)
            } else {
               console.error(`❌ Error creating ${user.role}:`, error.message)
            }
         } else {
            console.log(`✅ Created ${user.role}: ${user.email} (Password: ${user.password})`)
         }
      } catch (error) {
         console.error(`❌ Error creating ${user.role}:`, error)
      }
   }

   console.log('\n🎉 All users processed!')
   console.log('\n📝 Test Accounts:')
   console.log('  Admin: admin@sinag.com / Admin@1234')
   console.log('  Staff: staff@sinag.com / Staff@1234')
   console.log('  Rider: rider@sinag.com / Rider@1234')
   console.log('  User:  user@sinag.com / User@1234')
}

createUsers()