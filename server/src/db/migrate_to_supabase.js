/**
 * Automated Data Migration Script: Local JSON (surveillance.json) -> Supabase Cloud PostgreSQL
 * Run with: node server/src/db/migrate_to_supabase.js
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl === 'YOUR_SUPABASE_URL_HERE') {
    console.error('❌ ERROR: SUPABASE_URL and SUPABASE_KEY must be set in server/.env before running migration!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const jsonPath = path.join(__dirname, '../../data/surveillance.json');

async function migrateData() {
    console.log('🚀 Starting Data Migration to Supabase Cloud PostgreSQL...');
    
    if (!fs.existsSync(jsonPath)) {
        console.error('❌ surveillance.json file not found at:', jsonPath);
        process.exit(1);
    }

    const raw = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(raw);

    // 1. Migrate Admin Users
    if (data.admin && data.admin.length > 0) {
        console.log(`📦 Migrating ${data.admin.length} Admin User(s)...`);
        for (const user of data.admin) {
            const { error } = await supabase.from('admin').upsert({
                id: user.id,
                username: user.username,
                password_hash: user.password_hash,
                created_at: user.created_at || new Date().toISOString(),
                last_login: user.last_login || null,
                failed_attempts: user.failed_attempts || 0,
                locked_until: user.locked_until || null,
                must_change_pw: user.must_change_pw || 0
            });
            if (error) console.error('  ⚠️ Error migrating admin:', error.message);
        }
        console.log('✅ Admin Users migrated successfully!');
    }

    // 2. Migrate Auth Logs
    if (data.auth_logs && data.auth_logs.length > 0) {
        console.log(`📦 Migrating ${data.auth_logs.length} Auth Logs...`);
        const batchSize = 100;
        for (let i = 0; i < data.auth_logs.length; i += batchSize) {
            const batch = data.auth_logs.slice(i, i + batchSize).map(log => ({
                id: log.id,
                timestamp: log.timestamp || new Date().toISOString(),
                action: log.action || 'LOG',
                ip_address: log.ip_address || '::1',
                user_agent: log.user_agent || '',
                details: typeof log.details === 'object' ? JSON.stringify(log.details) : (log.details || '')
            }));
            const { error } = await supabase.from('auth_logs').upsert(batch);
            if (error) console.error('  ⚠️ Error migrating auth logs batch:', error.message);
        }
        console.log('✅ Auth Logs migrated successfully!');
    }

    // 3. Migrate Threat Events
    if (data.events && data.events.length > 0) {
        console.log(`📦 Migrating ${data.events.length} Threat Event Records...`);
        const batchSize = 250;
        for (let i = 0; i < data.events.length; i += batchSize) {
            const batch = data.events.slice(i, i + batchSize).map(evt => ({
                id: evt.id,
                timestamp: evt.timestamp || new Date().toISOString(),
                camera_id: evt.camera_id || 1,
                threat_level: evt.threat_level || 'INFO',
                object_class: evt.object_class || 'person',
                confidence: typeof evt.confidence === 'number' ? evt.confidence : 0.5,
                track_id: evt.track_id || 0,
                zone_name: evt.zone_name || 'General Area',
                metadata: typeof evt.metadata === 'object' ? JSON.stringify(evt.metadata) : (evt.metadata || '')
            }));
            const { error } = await supabase.from('events').upsert(batch);
            if (error) console.error(`  ⚠️ Error migrating events batch ${i}-${i + batchSize}:`, error.message);
        }
        console.log('✅ Threat Event Records migrated successfully!');
    }

    // 4. Seed Default Zones if empty
    console.log('📦 Verifying Spatial Security Zones...');
    const { data: existingZones } = await supabase.from('zones').select('id');
    if (!existingZones || existingZones.length === 0) {
        await supabase.from('zones').insert([
            { id: 1, name: 'Restricted Main Zone', type: 'restricted', polygon: '[[10,10],[50,10],[50,80],[10,80]]' },
            { id: 2, name: 'Monitored Perimeter', type: 'monitored', polygon: '[[55,10],[90,10],[90,90],[55,90]]' }
        ]);
        console.log('✅ Default spatial zones created in Supabase!');
    }

    console.log('🎉 ALL DATA SUCCESSFULLY MIGRATED TO SUPABASE CLOUD POSTGRESQL!');
}

migrateData().catch(err => {
    console.error('❌ Migration failed:', err);
});
