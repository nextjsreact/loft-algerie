-- =====================================================
-- DONNÉES DE TEST POUR L'ENVIRONNEMENT DE TEST
-- =====================================================
-- Ce script insère des données d'exemple pour tester l'application

-- Insérer des zones géographiques de test
INSERT INTO zone_areas (id, name, description) VALUES
  (gen_random_uuid(), 'Centre-ville Alger', 'Zone centrale d''Alger avec forte demande'),
  (gen_random_uuid(), 'Hydra', 'Quartier résidentiel haut de gamme'),
  (gen_random_uuid(), 'Bab Ezzouar', 'Zone universitaire et technologique'),
  (gen_random_uuid(), 'Oran Centre', 'Centre-ville d''Oran'),
  (gen_random_uuid(), 'Constantine Plateau', 'Plateau de Constantine')
ON CONFLICT (name) DO NOTHING;

-- Insérer des types de connexion internet de test
INSERT INTO internet_connection_types (id, name, type, speed, provider, status, cost) VALUES
  (gen_random_uuid(), 'Fibre Djezzy 100M', 'Fiber', '100 Mbps', 'Djezzy', 'active', 3500.00),
  (gen_random_uuid(), 'ADSL Algérie Télécom 20M', 'ADSL', '20 Mbps', 'Algérie Télécom', 'active', 2000.00),
  (gen_random_uuid(), '4G Mobilis Illimité', '4G', '50 Mbps', 'Mobilis', 'active', 4000.00),
  (gen_random_uuid(), 'Fibre Ooredoo 200M', 'Fiber', '200 Mbps', 'Ooredoo', 'active', 5000.00)
ON CONFLICT (name) DO NOTHING;

-- Insérer des propriétaires de test
INSERT INTO loft_owners (id, name, email, phone, address, ownership_type) VALUES
  (gen_random_uuid(), 'Société Immobilière Alger', 'contact@sia-alger.dz', '+213 21 123 456', '15 Rue Didouche Mourad, Alger', 'company'),
  (gen_random_uuid(), 'Ahmed Benali', 'ahmed.benali@email.dz', '+213 555 123 456', '25 Avenue de l''Indépendance, Oran', 'third_party'),
  (gen_random_uuid(), 'Fatima Khelifi', 'fatima.khelifi@email.dz', '+213 666 789 012', '10 Rue des Frères Mentouri, Constantine', 'third_party'),
  (gen_random_uuid(), 'Groupe Immobilier Moderne', 'info@gim-dz.com', '+213 21 987 654', '50 Boulevard Zighout Youcef, Alger', 'company')
ON CONFLICT (name) DO NOTHING;

-- Insérer des lofts de test avec données de facturation
WITH zone_ids AS (
  SELECT id, name FROM zone_areas LIMIT 5
),
owner_ids AS (
  SELECT id, name FROM loft_owners LIMIT 4
),
internet_ids AS (
  SELECT id, name FROM internet_connection_types LIMIT 4
)
INSERT INTO lofts (
  id, name, address, price_per_month, status, description,
  owner_id, zone_area_id, internet_connection_type_id,
  company_percentage, owner_percentage,
  -- Informations utilitaires
  water_customer_code, electricity_customer_number, gas_customer_number, phone_number,
  -- Fréquences de facturation
  frequence_paiement_eau, prochaine_echeance_eau,
  frequence_paiement_energie, prochaine_echeance_energie,
  frequence_paiement_telephone, prochaine_echeance_telephone,
  frequence_paiement_internet, prochaine_echeance_internet,
  frequence_paiement_tv, prochaine_echeance_tv
) VALUES
  (
    gen_random_uuid(), 'Loft Moderne Centre Alger', '123 Rue Larbi Ben M''hidi, Alger',
    85000, 'available', 'Loft moderne avec vue sur la baie d''Alger',
    (SELECT id FROM owner_ids WHERE name = 'Société Immobilière Alger' LIMIT 1),
    (SELECT id FROM zone_ids WHERE name = 'Centre-ville Alger' LIMIT 1),
    (SELECT id FROM internet_ids WHERE name LIKE '%Djezzy%' LIMIT 1),
    60.00, 40.00,
    'EAU-ALG-001', 'ELEC-ALG-001', 'GAZ-ALG-001', '+213 21 123 001',
    'mensuel', CURRENT_DATE + INTERVAL '15 days',
    'bimestriel', CURRENT_DATE + INTERVAL '25 days',
    'mensuel', CURRENT_DATE + INTERVAL '10 days',
    'mensuel', CURRENT_DATE + INTERVAL '20 days',
    'mensuel', CURRENT_DATE + INTERVAL '5 days'
  ),
  (
    gen_random_uuid(), 'Studio Hydra Premium', '45 Chemin des Glycines, Hydra',
    120000, 'occupied', 'Studio haut de gamme dans le quartier d''Hydra',
    (SELECT id FROM owner_ids WHERE name = 'Ahmed Benali' LIMIT 1),
    (SELECT id FROM zone_ids WHERE name = 'Hydra' LIMIT 1),
    (SELECT id FROM internet_ids WHERE name LIKE '%Ooredoo%' LIMIT 1),
    50.00, 50.00,
    'EAU-HYD-002', 'ELEC-HYD-002', 'GAZ-HYD-002', '+213 21 123 002',
    'mensuel', CURRENT_DATE + INTERVAL '8 days',
    'bimestriel', CURRENT_DATE + INTERVAL '18 days',
    'mensuel', CURRENT_DATE + INTERVAL '12 days',
    'mensuel', CURRENT_DATE + INTERVAL '22 days',
    'trimestriel', CURRENT_DATE + INTERVAL '30 days'
  ),
  (
    gen_random_uuid(), 'Loft Étudiant Bab Ezzouar', '78 Cité Universitaire, Bab Ezzouar',
    45000, 'available', 'Loft adapté aux étudiants, proche de l''université',
    (SELECT id FROM owner_ids WHERE name = 'Fatima Khelifi' LIMIT 1),
    (SELECT id FROM zone_ids WHERE name = 'Bab Ezzouar' LIMIT 1),
    (SELECT id FROM internet_ids WHERE name LIKE '%ADSL%' LIMIT 1),
    70.00, 30.00,
    'EAU-BEZ-003', 'ELEC-BEZ-003', 'GAZ-BEZ-003', '+213 21 123 003',
    'mensuel', CURRENT_DATE - INTERVAL '5 days', -- En retard
    'mensuel', CURRENT_DATE + INTERVAL '7 days',
    'mensuel', CURRENT_DATE + INTERVAL '14 days',
    'mensuel', CURRENT_DATE + INTERVAL '21 days',
    'mensuel', CURRENT_DATE - INTERVAL '2 days' -- En retard
  ),
  (
    gen_random_uuid(), 'Penthouse Oran Vue Mer', '12 Front de Mer, Oran',
    150000, 'maintenance', 'Penthouse avec vue panoramique sur la mer',
    (SELECT id FROM owner_ids WHERE name = 'Groupe Immobilier Moderne' LIMIT 1),
    (SELECT id FROM zone_ids WHERE name = 'Oran Centre' LIMIT 1),
    (SELECT id FROM internet_ids WHERE name LIKE '%Mobilis%' LIMIT 1),
    55.00, 45.00,
    'EAU-ORA-004', 'ELEC-ORA-004', 'GAZ-ORA-004', '+213 41 123 004',
    'trimestriel', CURRENT_DATE + INTERVAL '45 days',
    'bimestriel', CURRENT_DATE + INTERVAL '35 days',
    'mensuel', CURRENT_DATE + INTERVAL '16 days',
    'mensuel', CURRENT_DATE + INTERVAL '26 days',
    'mensuel', CURRENT_DATE + INTERVAL '6 days'
  ),
  (
    gen_random_uuid(), 'Loft Familial Constantine', '33 Rue Benbadis, Constantine',
    75000, 'available', 'Loft spacieux pour famille, quartier calme',
    (SELECT id FROM owner_ids WHERE name = 'Ahmed Benali' LIMIT 1),
    (SELECT id FROM zone_ids WHERE name = 'Constantine Plateau' LIMIT 1),
    (SELECT id FROM internet_ids WHERE name LIKE '%Djezzy%' LIMIT 1),
    65.00, 35.00,
    'EAU-CST-005', 'ELEC-CST-005', 'GAZ-CST-005', '+213 31 123 005',
    'mensuel', CURRENT_DATE + INTERVAL '3 days', -- Bientôt dû
    'mensuel', CURRENT_DATE + INTERVAL '13 days',
    'mensuel', CURRENT_DATE + INTERVAL '23 days',
    'mensuel', CURRENT_DATE + INTERVAL '28 days',
    'bimestriel', CURRENT_DATE + INTERVAL '40 days'
  );

-- Insérer des catégories de transactions de test
INSERT INTO categories (id, name, description, type) VALUES
  (gen_random_uuid(), 'Loyer', 'Revenus de location des lofts', 'income'),
  (gen_random_uuid(), 'Facture Eau', 'Paiement des factures d''eau', 'expense'),
  (gen_random_uuid(), 'Facture Électricité', 'Paiement des factures d''électricité', 'expense'),
  (gen_random_uuid(), 'Facture Gaz', 'Paiement des factures de gaz', 'expense'),
  (gen_random_uuid(), 'Facture Téléphone', 'Paiement des factures de téléphone', 'expense'),
  (gen_random_uuid(), 'Facture Internet', 'Paiement des factures d''internet', 'expense'),
  (gen_random_uuid(), 'Abonnement TV', 'Paiement des abonnements TV', 'expense'),
  (gen_random_uuid(), 'Maintenance', 'Frais de maintenance et réparations', 'expense'),
  (gen_random_uuid(), 'Assurance', 'Primes d''assurance', 'expense'),
  (gen_random_uuid(), 'Taxe Foncière', 'Paiement des taxes foncières', 'expense')
ON CONFLICT (name) DO NOTHING;

-- Insérer des devises de test
INSERT INTO currencies (id, code, name, symbol, is_default, ratio) VALUES
  (gen_random_uuid(), 'DZD', 'Dinar Algérien', 'د.ج', true, 1.0000),
  (gen_random_uuid(), 'EUR', 'Euro', '€', false, 0.0067),
  (gen_random_uuid(), 'USD', 'Dollar Américain', '$', false, 0.0074)
ON CONFLICT (code) DO NOTHING;

-- Insérer des méthodes de paiement de test
INSERT INTO payment_methods (id, name, type, details) VALUES
  (gen_random_uuid(), 'Espèces', 'cash', '{"description": "Paiement en espèces"}'),
  (gen_random_uuid(), 'Virement Bancaire', 'bank_transfer', '{"bank": "BNA", "account": "001234567890"}'),
  (gen_random_uuid(), 'Chèque', 'check', '{"description": "Paiement par chèque"}'),
  (gen_random_uuid(), 'Carte Bancaire', 'card', '{"type": "visa", "last4": "1234"}')
ON CONFLICT (name) DO NOTHING;

-- Insérer quelques transactions de test
WITH loft_ids AS (
  SELECT id, name FROM lofts LIMIT 3
),
category_ids AS (
  SELECT id, name FROM categories WHERE type = 'income' LIMIT 1
),
currency_ids AS (
  SELECT id, code FROM currencies WHERE code = 'DZD' LIMIT 1
),
payment_ids AS (
  SELECT id, name FROM payment_methods LIMIT 2
)
INSERT INTO transactions (
  id, amount, description, transaction_type, status, date,
  category, loft_id, currency_id, payment_method_id
) VALUES
  (
    gen_random_uuid(), 85000.00, 'Loyer mensuel - Janvier 2025',
    'income', 'completed', CURRENT_DATE - INTERVAL '5 days',
    'Loyer',
    (SELECT id FROM loft_ids WHERE name LIKE '%Centre Alger%' LIMIT 1),
    (SELECT id FROM currency_ids LIMIT 1),
    (SELECT id FROM payment_ids WHERE name = 'Virement Bancaire' LIMIT 1)
  ),
  (
    gen_random_uuid(), 120000.00, 'Loyer mensuel - Janvier 2025',
    'income', 'completed', CURRENT_DATE - INTERVAL '3 days',
    'Loyer',
    (SELECT id FROM loft_ids WHERE name LIKE '%Hydra%' LIMIT 1),
    (SELECT id FROM currency_ids LIMIT 1),
    (SELECT id FROM payment_ids WHERE name = 'Virement Bancaire' LIMIT 1)
  ),
  (
    gen_random_uuid(), 2500.00, 'Facture d''eau - Janvier 2025',
    'expense', 'pending', CURRENT_DATE - INTERVAL '1 day',
    'Facture Eau',
    (SELECT id FROM loft_ids WHERE name LIKE '%Centre Alger%' LIMIT 1),
    (SELECT id FROM currency_ids LIMIT 1),
    (SELECT id FROM payment_ids WHERE name = 'Espèces' LIMIT 1)
  );

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '🌱 Données de test insérées avec succès!';
  RAISE NOTICE '📊 Données créées:';
  RAISE NOTICE '• 5 zones géographiques';
  RAISE NOTICE '• 4 types de connexion internet';
  RAISE NOTICE '• 4 propriétaires';
  RAISE NOTICE '• 5 lofts avec facturation complète';
  RAISE NOTICE '• 10 catégories de transactions';
  RAISE NOTICE '• 3 devises';
  RAISE NOTICE '• 4 méthodes de paiement';
  RAISE NOTICE '• 3 transactions d''exemple';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Votre environnement de test est prêt!';
END $$;