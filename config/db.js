const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase external connections
  }
});

const initDb = async () => {
  const client = await pool.connect();
  try {
    console.log('🔄 Initializing database tables...');

    // 1. Create profiles table (linked to Supabase auth.users)
    await client.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        role TEXT DEFAULT 'staff',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Create generations table with detailed structured fields
    await client.query(`
      CREATE TABLE IF NOT EXISTS generations (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
        staff_name TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        destination TEXT NOT NULL,
        travel_date TEXT,
        trip_duration TEXT,
        budget TEXT,
        vehicle_type TEXT,
        num_passengers INTEGER,
        purpose TEXT,
        luxury_level TEXT,
        special_requests TEXT,
        addons TEXT,
        current_package TEXT,
        current_vehicle TEXT,
        current_price TEXT,
        current_addons TEXT,
        recommended_upgrade TEXT,
        why_upgrade JSONB,
        suggested_script TEXT,
        expected_benefits JSONB,
        confidence_score TEXT,
        token_cost INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Create feedback table
    await client.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        generation_id INTEGER REFERENCES generations(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Create templates table using JSONB for form flexibility
    await client.query(`
      CREATE TABLE IF NOT EXISTS templates (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Create prompt_versions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS prompt_versions (
        id SERIAL PRIMARY KEY,
        version INTEGER NOT NULL,
        prompt_template TEXT NOT NULL,
        is_active BOOLEAN DEFAULT false,
        created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Create audit_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        details TEXT,
        ip_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed default templates if the table is empty
    const { rows: existing } = await client.query('SELECT COUNT(*) FROM templates');
    if (parseInt(existing[0].count, 10) === 0) {
      const defaultTemplates = [
        {
          name: 'Airport Transfer',
          data: {
            customerName: 'Aditya Sen',
            destination: 'RGIA Airport',
            travelDate: '2026-07-01',
            tripDuration: '1 Day',
            budget: 'Medium',
            vehicleType: 'Sedan',
            numPassengers: '2',
            purpose: 'Business',
            luxuryLevel: 'Premium',
            specialRequests: 'Flight departs at 4 PM, needs on-time pickup',
            addons: ['Airport Pickup'],
            currentPackage: 'Standard Airport Drop',
            currentVehicle: 'Maruti Suzuki Dzire',
            currentPrice: '1500',
            currentAddons: 'None'
          }
        },
        {
          name: 'Weekend Trip',
          data: {
            customerName: 'Meera Nair',
            destination: 'Ananthagiri Hills',
            travelDate: '2026-07-04',
            tripDuration: '2 Days',
            budget: 'Medium',
            vehicleType: 'SUV',
            numPassengers: '5',
            purpose: 'Tourism',
            luxuryLevel: 'Premium',
            specialRequests: 'Travelling with kids, needs extra boot space',
            addons: ['Hotel', 'Guide'],
            currentPackage: 'Self-drive Weekend rental',
            currentVehicle: 'Hyundai Creta',
            currentPrice: '6000',
            currentAddons: 'None'
          }
        },
        {
          name: 'Wedding',
          data: {
            customerName: 'Karthik Reddy',
            destination: 'Gachibowli Convention Centre',
            travelDate: '2026-08-15',
            tripDuration: '3 Days',
            budget: 'High',
            vehicleType: 'Luxury Sedan',
            numPassengers: '4',
            purpose: 'Wedding',
            luxuryLevel: 'Luxury',
            specialRequests: 'Decorated car, chauffeur in uniform',
            addons: ['Guide', 'Meals'],
            currentPackage: 'Standard Wedding Transport',
            currentVehicle: 'Toyota Camry',
            currentPrice: '25000',
            currentAddons: 'Chauffeur'
          }
        },
        {
          name: 'Corporate',
          data: {
            customerName: 'TechCorp Solutions (HR)',
            destination: 'HITEC City Tour',
            travelDate: '2026-07-10',
            tripDuration: '5 Days',
            budget: 'High',
            vehicleType: 'Premium SUV',
            numPassengers: '6',
            purpose: 'Business',
            luxuryLevel: 'Luxury',
            specialRequests: 'VIP guests, onboard Wi-Fi and refreshments required',
            addons: ['Airport Pickup', 'Hotel', 'Guide'],
            currentPackage: 'Executive Daily Commute',
            currentVehicle: 'Toyota Innova Crysta',
            currentPrice: '35000',
            currentAddons: 'Wi-Fi'
          }
        },
        {
          name: 'Outstation',
          data: {
            customerName: 'Sanjay Sharma',
            destination: 'Srisailam Temple',
            travelDate: '2026-07-12',
            tripDuration: '3 Days',
            budget: 'Medium',
            vehicleType: 'SUV',
            numPassengers: '7',
            purpose: 'Tourism',
            luxuryLevel: 'Basic',
            specialRequests: 'Elderly parents, needs comfortable suspension',
            addons: ['Guide', 'Meals'],
            currentPackage: 'Outstation Round Trip',
            currentVehicle: 'Mahindra Scorpio',
            currentPrice: '12000',
            currentAddons: 'None'
          }
        },
        {
          name: 'Luxury Tour',
          data: {
            customerName: 'Rohan Kapoor',
            destination: 'Hyderabad Heritage Tour',
            travelDate: '2026-07-20',
            tripDuration: '1 Day',
            budget: 'High',
            vehicleType: 'Luxury SUV',
            numPassengers: '3',
            purpose: 'Tourism',
            luxuryLevel: 'Luxury',
            specialRequests: 'Wants the absolute best experience with premium snacks and premium guide',
            addons: ['Airport Pickup', 'Guide', 'Meals'],
            currentPackage: 'Day City Tour',
            currentVehicle: 'Toyota Fortuner',
            currentPrice: '18000',
            currentAddons: 'Guide'
          }
        }
      ];

      for (const t of defaultTemplates) {
        await client.query(
          'INSERT INTO templates (name, data) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
          [t.name, JSON.stringify(t.data)]
        );
      }
      console.log('✅ Default templates seeded');
    }

    // Seed additional example templates (always runs, ON CONFLICT handles duplicates)
    const exampleTemplates = [
      {
        name: 'Temple Pilgrimage',
        data: {
          customerName: 'Venkateswara Rao',
          destination: 'Tirumala Tirupati',
          travelDate: '2026-08-05',
          tripDuration: '2 Days',
          budget: 'Medium',
          vehicleType: 'SUV',
          numPassengers: '4',
          purpose: 'Family',
          luxuryLevel: 'Premium',
          specialRequests: 'Elderly parents, need darshan assistance and comfortable seating',
          addons: ['Hotel', 'Meals'],
          currentPackage: 'Basic Temple Visit Drop',
          currentVehicle: 'Mahindra XUV700',
          currentPrice: '5500',
          currentAddons: 'None'
        }
      },
      {
        name: 'Airport Pickup VIP',
        data: {
          customerName: 'Neha Agarwal',
          destination: 'RGIA Airport → Banjara Hills',
          travelDate: '2026-07-15',
          tripDuration: '1 Day',
          budget: 'High',
          vehicleType: 'Luxury Sedan',
          numPassengers: '2',
          purpose: 'Business',
          luxuryLevel: 'Luxury',
          specialRequests: 'Meet & greet at arrival gate with name board, chilled water, Wi-Fi',
          addons: ['Airport Pickup'],
          currentPackage: 'Standard Airport Pickup',
          currentVehicle: 'Honda City',
          currentPrice: '2500',
          currentAddons: 'None'
        }
      },
      {
        name: 'Honeymoon Special',
        data: {
          customerName: 'Arun & Priya Sharma',
          destination: 'Araku Valley',
          travelDate: '2026-09-20',
          tripDuration: '4 Days',
          budget: 'High',
          vehicleType: 'Luxury SUV',
          numPassengers: '2',
          purpose: 'Wedding',
          luxuryLevel: 'Luxury',
          specialRequests: 'Romantic setup, flower decorations, photographer, premium resorts',
          addons: ['Hotel', 'Guide', 'Meals'],
          currentPackage: 'Standard Couple Getaway',
          currentVehicle: 'Toyota Innova Crysta',
          currentPrice: '22000',
          currentAddons: 'Hotel'
        }
      },
      {
        name: 'Group Adventure',
        data: {
          customerName: 'Ravi Teja (Trip Coordinator)',
          destination: 'Kodaikanal',
          travelDate: '2026-10-12',
          tripDuration: '5 Days',
          budget: 'Medium',
          vehicleType: 'Van',
          numPassengers: '10',
          purpose: 'Tourism',
          luxuryLevel: 'Basic',
          specialRequests: 'Group of college friends, need trekking gear stops, music system in vehicle',
          addons: ['Guide', 'Meals'],
          currentPackage: 'Group Self-drive',
          currentVehicle: 'Tempo Traveller 12-seater',
          currentPrice: '18000',
          currentAddons: 'None'
        }
      },
      {
        name: 'Medical Appointment',
        data: {
          customerName: 'Srinivas Reddy',
          destination: 'Apollo Hospitals, Jubilee Hills',
          travelDate: '2026-07-08',
          tripDuration: '1 Day',
          budget: 'Medium',
          vehicleType: 'Sedan',
          numPassengers: '3',
          purpose: 'Family',
          luxuryLevel: 'Premium',
          specialRequests: 'Patient with back pain — needs comfortable suspension, wheelchair assistance',
          addons: ['Airport Pickup'],
          currentPackage: 'Standard City Ride',
          currentVehicle: 'Maruti Suzuki Swift Dzire',
          currentPrice: '800',
          currentAddons: 'None'
        }
      },
      {
        name: 'Heritage Walk',
        data: {
          customerName: 'Jennifer Mathews',
          destination: 'Hyderabad Heritage Tour (Golconda, Charminar, Chowmahalla)',
          travelDate: '2026-11-05',
          tripDuration: '1 Day',
          budget: 'Medium',
          vehicleType: 'Sedan',
          numPassengers: '3',
          purpose: 'Tourism',
          luxuryLevel: 'Premium',
          specialRequests: 'English-speaking guide, photography stops at sunset points',
          addons: ['Guide', 'Meals'],
          currentPackage: 'City Cab Rental',
          currentVehicle: 'Toyota Etios',
          currentPrice: '2800',
          currentAddons: 'None'
        }
      },
      {
        name: 'Corporate Conference',
        data: {
          customerName: 'Priyanka Mehta (TechCorp)',
          destination: 'HICC Novotel',
          travelDate: '2026-08-25',
          tripDuration: '3 Days',
          budget: 'High',
          vehicleType: 'Luxury Sedan',
          numPassengers: '1',
          purpose: 'Corporate',
          luxuryLevel: 'Luxury',
          specialRequests: 'CEO VIP transport, onboard Wi-Fi, suit carrier, punctual pickup/return',
          addons: ['Airport Pickup', 'Hotel', 'Meals'],
          currentPackage: 'Executive Commute',
          currentVehicle: 'Skoda Superb',
          currentPrice: '15000',
          currentAddons: 'Wi-Fi, Chauffeur'
        }
      },
      {
        name: 'Beach Getaway',
        data: {
          customerName: 'Sneha & Vikram',
          destination: 'Visakhapatnam (Rishikonda, Rushikonda)',
          travelDate: '2026-12-15',
          tripDuration: '3 Days',
          budget: 'Medium',
          vehicleType: 'SUV',
          numPassengers: '5',
          purpose: 'Family',
          luxuryLevel: 'Premium',
          specialRequests: 'Kids aged 4 and 7, need extra boot for beach gear, stop at VMRDA park',
          addons: ['Hotel', 'Guide', 'Meals'],
          currentPackage: 'Outstation Round Trip',
          currentVehicle: 'Hyundai Creta',
          currentPrice: '12000',
          currentAddons: 'None'
        }
      }
    ];

    for (const t of exampleTemplates) {
      await client.query(
        'INSERT INTO templates (name, data) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
        [t.name, JSON.stringify(t.data)]
      );
    }
    console.log('✅ Example templates seeded');

    // Add new columns for the enhanced prompt (idempotent)
    await client.query(`
      ALTER TABLE generations 
      ADD COLUMN IF NOT EXISTS upgrade_price TEXT,
      ADD COLUMN IF NOT EXISTS pricing_comparison TEXT,
      ADD COLUMN IF NOT EXISTS objection_handling JSONB;
    `);

    console.log('✅ Database tables initialized successfully');
  } catch (err) {
    console.error('❌ Error initializing database:', err);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { pool, initDb };
