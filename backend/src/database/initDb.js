const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function initializeDatabase() {
  console.log('🔄 Initialisation du schéma de base de données VogCar ERP...');
  const schemaPath = path.join(__dirname, '../../database/schema.sql');

  try {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schemaSql);
    console.log('✅ Schéma de base de données et données initiales créés avec succès !');

    // Vérification des tables créées
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\n📋 Tables présentes dans la base de données :');
    res.rows.forEach((r) => console.log(`   - ${r.table_name}`));

    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation de la base de données :", error.message);
    process.exit(1);
  }
}

initializeDatabase();
