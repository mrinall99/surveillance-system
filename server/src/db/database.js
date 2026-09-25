/**
 * Supabase Cloud PostgreSQL Database Engine.
 * Provides a seamless SQL-compatible interface (prepare, run, get, all, exec)
 * backed directly by Supabase Cloud PostgreSQL tables.
 */
const { supabase, isSupabaseActive } = require('./supabaseClient');

// In-memory data store cache when Supabase is initializing or executing synchronous queries
let syncCache = {
    admin: [
        {
            id: 1,
            username: "hitman009",
            password_hash: "$2a$12$uA8bG9mJ/QD2gikXzDexguAeP4hanIpeHa/W5Xr.8sR67Zgrk2.WC",
            created_at: new Date().toISOString()
        }
    ],
    auth_logs: [],
    events: [],
    zones: [
        {
            id: 1,
            name: "Restricted Main Zone",
            type: "restricted",
            polygon: "[[10,10],[50,10],[50,80],[10,80]]",
            created_at: new Date().toISOString()
        },
        {
            id: 2,
            name: "Monitored Perimeter",
            type: "monitored",
            polygon: "[[55,10],[90,10],[90,90],[55,90]]",
            created_at: new Date().toISOString()
        }
    ],
    cameras: []
};

// Initial sync fetch from Supabase Cloud on server startup
async function initSupabaseData() {
    if (isSupabaseActive()) {
        try {
            const { data: adminData } = await supabase.from('admin').select('*');
            if (adminData && adminData.length > 0) syncCache.admin = adminData;

            const { data: zonesData } = await supabase.from('zones').select('*');
            if (zonesData && zonesData.length > 0) syncCache.zones = zonesData;

            const { data: eventsData } = await supabase.from('events').select('*').order('timestamp', { ascending: false }).limit(2000);
            if (eventsData) syncCache.events = eventsData;

            const { data: logsData } = await supabase.from('auth_logs').select('*').order('timestamp', { ascending: false }).limit(500);
            if (logsData) syncCache.auth_logs = logsData;

            console.log('⚡ Initialized Supabase Cloud PostgreSQL data cache in backend');
        } catch (e) {
            console.warn('⚠️ Error fetching initial data from Supabase Cloud:', e.message);
        }
    }
}
initSupabaseData();

class StatementWrapper {
    constructor(sql) {
        this.sql = sql.trim();
    }

    run(...params) {
        const args = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const sql = this.sql.toLowerCase();

        // 1. INSERT INTO admin
        if (sql.includes('insert into admin')) {
            const username = args[0];
            const password_hash = args[1];
            const newAdmin = {
                id: syncCache.admin.length + 1,
                username,
                password_hash,
                created_at: new Date().toISOString()
            };
            syncCache.admin.push(newAdmin);

            if (isSupabaseActive()) {
                supabase.from('admin').upsert(newAdmin).then(({ error }) => {
                    if (error) console.error('Supabase admin insert error:', error.message);
                });
            }
            return { changes: 1, lastInsertRowid: newAdmin.id };
        }

        // 2. UPDATE admin SET password_hash
        if (sql.includes('update admin set password_hash')) {
            const password_hash = args[0];
            const username = args[1];
            const admin = syncCache.admin.find(a => a.username === username);
            if (admin) {
                admin.password_hash = password_hash;
                if (isSupabaseActive()) {
                    supabase.from('admin').update({ password_hash }).eq('username', username).then();
                }
                return { changes: 1 };
            }
            return { changes: 0 };
        }

        // 3. INSERT INTO auth_logs
        if (sql.includes('insert into auth_logs')) {
            const action = args[0];
            const ip_address = args[1];
            const user_agent = args[2];
            const details = args[3];

            const newLog = {
                id: syncCache.auth_logs.length + 1,
                timestamp: new Date().toISOString(),
                action,
                ip_address,
                user_agent,
                details
            };
            syncCache.auth_logs.unshift(newLog);

            if (isSupabaseActive()) {
                supabase.from('auth_logs').insert([newLog]).then(({ error }) => {
                    if (error) console.error('Supabase log insert error:', error.message);
                });
            }
            return { changes: 1, lastInsertRowid: newLog.id };
        }

        // 4. INSERT INTO events
        if (sql.includes('insert into events')) {
            const newEvent = {
                id: syncCache.events.length + 1,
                timestamp: new Date().toISOString(),
                camera_id: args[0] || 1,
                threat_level: args[1] || 'INFO',
                object_class: args[2] || 'person',
                confidence: args[3] || 0.5,
                track_id: args[4] || 0,
                zone_name: args[5] || 'General Area',
                metadata: args[6] || ''
            };
            syncCache.events.unshift(newEvent);

            if (isSupabaseActive()) {
                supabase.from('events').insert([newEvent]).then(({ error }) => {
                    if (error) console.error('Supabase event insert error:', error.message);
                });
            }
            return { changes: 1, lastInsertRowid: newEvent.id };
        }

        // 5. INSERT INTO zones
        if (sql.includes('insert into zones')) {
            const name = args[0];
            const type = args[1] || 'restricted';
            const polygon = args[2] || '[]';

            const newZone = {
                id: syncCache.zones.length + 1,
                name,
                type,
                polygon,
                created_at: new Date().toISOString()
            };
            syncCache.zones.push(newZone);

            if (isSupabaseActive()) {
                supabase.from('zones').insert([newZone]).then(({ error }) => {
                    if (error) console.error('Supabase zone insert error:', error.message);
                });
            }
            return { changes: 1, lastInsertRowid: newZone.id };
        }

        // 6. DELETE FROM zones WHERE id = ?
        if (sql.includes('delete from zones')) {
            const id = parseInt(args[0], 10);
            syncCache.zones = syncCache.zones.filter(z => z.id !== id);
            if (isSupabaseActive()) {
                supabase.from('zones').delete().eq('id', id).then();
            }
            return { changes: 1 };
        }

        return { changes: 0 };
    }

    get(...params) {
        const args = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const sql = this.sql.toLowerCase();

        if (sql.includes('select * from admin where username = ?')) {
            const username = args[0];
            return syncCache.admin.find(a => a.username === username);
        }

        if (sql.includes('select count(*) as count from admin')) {
            return { count: syncCache.admin.length };
        }

        if (sql.includes('select * from admin limit 1')) {
            return syncCache.admin[0];
        }

        if (sql.includes('select count(*) as total from events')) {
            return { total: syncCache.events.length };
        }

        return null;
    }

    all(...params) {
        const sql = this.sql.toLowerCase();

        if (sql.includes('from events')) {
            return syncCache.events;
        }

        if (sql.includes('from zones')) {
            return syncCache.zones;
        }

        if (sql.includes('from auth_logs')) {
            return syncCache.auth_logs;
        }

        if (sql.includes('from admin')) {
            return syncCache.admin;
        }

        return [];
    }
}

const db = {
    prepare: (sql) => new StatementWrapper(sql),
    exec: () => {},
    transaction: (fn) => (...args) => fn(...args)
};

module.exports = db;
