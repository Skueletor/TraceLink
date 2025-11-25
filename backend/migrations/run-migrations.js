#!/usr/bin/env node

/**
 * Migration Runner para TraceLink
 * Ejecuta las migraciones de base de datos en orden secuencial
 * 
 * Uso:
 *   node run-migrations.js
 *   node run-migrations.js --reset  (para recrear toda la base)
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
// Cargar .env desde el directorio backend
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Configuración de base de datos
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'tracelink_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Orden de ejecución de migraciones
const MIGRATION_ORDER = [
  '000_initial_schema.sql',    // Tablas principales del sistema
  '001_auth.sql',              // Sistema de autenticación
  '002_add_user_to_movements.sql', // Agregar user_id a movements
  '003_one_tool_per_worker.sql',    // Restricción una herramienta por trabajador
  '004_loan_monitoring_system.sql', // Sistema de monitoreo de préstamos con alertas
  '005_fix_data_types.sql',         // Parche: corregir tipos de datos NUMERIC
  '006_fix_all_data_types.sql'      // Parche: corregir todos los tipos de datos TEXT/VARCHAR
];

class MigrationRunner {
  constructor() {
    this.migrationsDir = __dirname;
    this.executedMigrations = [];
  }

  async init() {
    // Crear tabla de control de migraciones si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        success BOOLEAN DEFAULT true,
        error_message TEXT
      )
    `);
    
    // Cargar migraciones ya ejecutadas
    const result = await pool.query(
      'SELECT migration_name FROM schema_migrations WHERE success = true ORDER BY executed_at'
    );
    this.executedMigrations = result.rows.map(row => row.migration_name);
  }

  async executeMigration(filename) {
    const filePath = path.join(this.migrationsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Migration file not found: ${filename}`);
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`📁 Ejecutando migración: ${filename}`);
    
    try {
      // Ejecutar el SQL
      await pool.query(sql);
      
      // Registrar como exitosa
      await pool.query(
        'INSERT INTO schema_migrations (migration_name, success) VALUES ($1, $2) ON CONFLICT (migration_name) DO UPDATE SET executed_at = CURRENT_TIMESTAMP, success = $2',
        [filename, true]
      );
      
      console.log(`✅ Migración completada: ${filename}`);
      return true;
    } catch (error) {
      // Registrar el error
      await pool.query(
        'INSERT INTO schema_migrations (migration_name, success, error_message) VALUES ($1, $2, $3) ON CONFLICT (migration_name) DO UPDATE SET executed_at = CURRENT_TIMESTAMP, success = $2, error_message = $3',
        [filename, false, error.message]
      );
      
      console.error(`❌ Error en migración ${filename}:`, error.message);
      throw error;
    }
  }

  async runAllMigrations() {
    console.log('🔄 Iniciando proceso de migraciones...\n');
    
    let executed = 0;
    let skipped = 0;

    for (const migration of MIGRATION_ORDER) {
      if (this.executedMigrations.includes(migration)) {
        console.log(`⏭️  Saltando migración ya ejecutada: ${migration}`);
        skipped++;
        continue;
      }

      try {
        await this.executeMigration(migration);
        executed++;
      } catch (error) {
        console.error(`\n🚨 Migración falló: ${migration}`);
        console.error('Deteniendo proceso de migraciones.');
        throw error;
      }
    }

    console.log(`\n📊 Resumen de migraciones:`);
    console.log(`   ✅ Ejecutadas: ${executed}`);
    console.log(`   ⏭️  Saltadas: ${skipped}`);
    console.log(`   📁 Total: ${MIGRATION_ORDER.length}`);
  }

  async resetDatabase() {
    console.log('🔄 Reseteando base de datos...');
    
    // Eliminar todas las tablas (en orden inverso por dependencias)
    const dropSQL = `
      DROP TABLE IF EXISTS schema_migrations CASCADE;
      DROP TABLE IF EXISTS refresh_tokens CASCADE;
      DROP TABLE IF EXISTS movements CASCADE;
      DROP TABLE IF EXISTS tool_assignments CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS tools CASCADE;
      DROP TABLE IF EXISTS workers CASCADE;
      DROP TABLE IF EXISTS buildings CASCADE;
      DROP TABLE IF EXISTS roles CASCADE;
      
      -- Eliminar funciones y índices personalizados
      DROP FUNCTION IF EXISTS check_worker_has_active_tool(INTEGER);
      DROP FUNCTION IF EXISTS get_worker_active_tool(INTEGER);
      DROP INDEX IF EXISTS idx_one_active_tool_per_worker;
    `;
    
    try {
      await pool.query(dropSQL);
      console.log('✅ Base de datos reseteada correctamente');
      
      // Reinicializar el runner
      this.executedMigrations = [];
      await this.init();
      
    } catch (error) {
      console.error('❌ Error reseteando base de datos:', error.message);
      throw error;
    }
  }

  async showStatus() {
    console.log('📋 Estado de migraciones:\n');
    
    for (const migration of MIGRATION_ORDER) {
      const isExecuted = this.executedMigrations.includes(migration);
      const status = isExecuted ? '✅' : '⏳';
      console.log(`   ${status} ${migration}`);
    }
    
    console.log(`\nTotal ejecutadas: ${this.executedMigrations.length}/${MIGRATION_ORDER.length}`);
  }
}

// Script principal
async function main() {
  const args = process.argv.slice(2);
  const runner = new MigrationRunner();
  
  try {
    await runner.init();
    
    if (args.includes('--reset')) {
      await runner.resetDatabase();
      await runner.runAllMigrations();
    } else if (args.includes('--status')) {
      await runner.showStatus();
    } else {
      await runner.runAllMigrations();
    }
    
    console.log('\n🎉 Proceso completado exitosamente!');
    
  } catch (error) {
    console.error('\n💥 Error durante la ejecución:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { MigrationRunner };