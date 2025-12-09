-- ============================================
-- SCRIPT SQL PARA CARGAR DATOS DE PRUEBA
-- ============================================
-- Este script crea 3 usuarios, todos los puntos de venta
-- y asigna aleatoriamente los PDVs a los usuarios

-- ============================================
-- PASO 1: Crear 3 usuarios
-- ============================================
-- Nota: Las contraseñas están hasheadas con bcrypt para "password123"
-- Hash bcrypt de "password123": $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
-- Si necesitas otras contraseñas, puedes generarlas en: https://bcrypt-generator.com/

INSERT INTO "User" (email, nickname, password, role, "createdAt", "updatedAt")
VALUES 
  ('usuario1@test.com', 'Usuario Uno', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'user', NOW(), NOW()),
  ('usuario2@test.com', 'Usuario Dos', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'user', NOW(), NOW()),
  ('usuario3@test.com', 'Usuario Tres', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'user', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- PASO 2: Crear todos los puntos de venta
-- ============================================

INSERT INTO "PointOfSale" ("pointNumberId", name, location, "isActive", "createdAt", "updatedAt")
VALUES 
  (137002, 'PDV 137002', 'Sucursal Central', true, NOW(), NOW()),
  (137012, 'PDV 137012', 'Sucursal Norte', true, NOW(), NOW()),
  (137015, 'PDV 137015', 'Sucursal Sur', true, NOW(), NOW()),
  (137016, 'PDV 137016', 'Sucursal Este', true, NOW(), NOW()),
  (137018, 'PDV 137018', 'Sucursal Oeste', true, NOW(), NOW()),
  (137019, 'PDV 137019', 'Sucursal Centro', true, NOW(), NOW()),
  (137020, 'PDV 137020', 'Sucursal Plaza', true, NOW(), NOW()),
  (137021, 'PDV 137021', 'Sucursal Mall', true, NOW(), NOW()),
  (137022, 'PDV 137022', 'Sucursal Comercial', true, NOW(), NOW()),
  (137023, 'PDV 137023', 'Sucursal Principal', true, NOW(), NOW()),
  (137024, 'PDV 137024', 'Sucursal Secundaria', true, NOW(), NOW()),
  (137025, 'PDV 137025', 'Sucursal Terciaria', true, NOW(), NOW()),
  (137026, 'PDV 137026', 'Sucursal A', true, NOW(), NOW()),
  (137030, 'PDV 137030', 'Sucursal B', true, NOW(), NOW()),
  (137031, 'PDV 137031', 'Sucursal C', true, NOW(), NOW()),
  (137032, 'PDV 137032', 'Sucursal D', true, NOW(), NOW()),
  (137034, 'PDV 137034', 'Sucursal E', true, NOW(), NOW()),
  (137356, 'PDV 137356', 'Sucursal F', true, NOW(), NOW()),
  (137357, 'PDV 137357', 'Sucursal G', true, NOW(), NOW()),
  (137362, 'PDV 137362', 'Sucursal H', true, NOW(), NOW()),
  (137363, 'PDV 137363', 'Sucursal I', true, NOW(), NOW()),
  (138685, 'PDV 138685', 'Sucursal J', true, NOW(), NOW()),
  (138687, 'PDV 138687', 'Sucursal K', true, NOW(), NOW()),
  (138701, 'PDV 138701', 'Sucursal L', true, NOW(), NOW()),
  (138702, 'PDV 138702', 'Sucursal M', true, NOW(), NOW()),
  (138704, 'PDV 138704', 'Sucursal N', true, NOW(), NOW()),
  (138706, 'PDV 138706', 'Sucursal O', true, NOW(), NOW()),
  (138708, 'PDV 138708', 'Sucursal P', true, NOW(), NOW()),
  (138710, 'PDV 138710', 'Sucursal Q', true, NOW(), NOW()),
  (138983, 'PDV 138983', 'Sucursal R', true, NOW(), NOW()),
  (138984, 'PDV 138984', 'Sucursal S', true, NOW(), NOW()),
  (139044, 'PDV 139044', 'Sucursal T', true, NOW(), NOW()),
  (139075, 'PDV 139075', 'Sucursal U', true, NOW(), NOW()),
  (139101, 'PDV 139101', 'Sucursal V', true, NOW(), NOW()),
  (139190, 'PDV 139190', 'Sucursal W', true, NOW(), NOW()),
  (139193, 'PDV 139193', 'Sucursal X', true, NOW(), NOW()),
  (139316, 'PDV 139316', 'Sucursal Y', true, NOW(), NOW()),
  (139462, 'PDV 139462', 'Sucursal Z', true, NOW(), NOW()),
  (139477, 'PDV 139477', 'Sucursal AA', true, NOW(), NOW()),
  (139478, 'PDV 139478', 'Sucursal AB', true, NOW(), NOW()),
  (139519, 'PDV 139519', 'Sucursal AC', true, NOW(), NOW()),
  (139662, 'PDV 139662', 'Sucursal AD', true, NOW(), NOW()),
  (139664, 'PDV 139664', 'Sucursal AE', true, NOW(), NOW()),
  (139670, 'PDV 139670', 'Sucursal AF', true, NOW(), NOW()),
  (139704, 'PDV 139704', 'Sucursal AG', true, NOW(), NOW()),
  (139731, 'PDV 139731', 'Sucursal AH', true, NOW(), NOW()),
  (139733, 'PDV 139733', 'Sucursal AI', true, NOW(), NOW()),
  (139801, 'PDV 139801', 'Sucursal AJ', true, NOW(), NOW()),
  (139999, 'PDV 139999', 'Sucursal AK', true, NOW(), NOW()),
  (140393, 'PDV 140393', 'Sucursal AL', true, NOW(), NOW()),
  (140394, 'PDV 140394', 'Sucursal AM', true, NOW(), NOW()),
  (140396, 'PDV 140396', 'Sucursal AN', true, NOW(), NOW()),
  (140397, 'PDV 140397', 'Sucursal AO', true, NOW(), NOW()),
  (140399, 'PDV 140399', 'Sucursal AP', true, NOW(), NOW()),
  (140460, 'PDV 140460', 'Sucursal AQ', true, NOW(), NOW()),
  (140461, 'PDV 140461', 'Sucursal AR', true, NOW(), NOW()),
  (140462, 'PDV 140462', 'Sucursal AS', true, NOW(), NOW()),
  (140463, 'PDV 140463', 'Sucursal AT', true, NOW(), NOW()),
  (140464, 'PDV 140464', 'Sucursal AU', true, NOW(), NOW()),
  (140465, 'PDV 140465', 'Sucursal AV', true, NOW(), NOW()),
  (140466, 'PDV 140466', 'Sucursal AW', true, NOW(), NOW()),
  (140469, 'PDV 140469', 'Sucursal AX', true, NOW(), NOW()),
  (140494, 'PDV 140494', 'Sucursal AY', true, NOW(), NOW()),
  (140496, 'PDV 140496', 'Sucursal AZ', true, NOW(), NOW()),
  (140500, 'PDV 140500', 'Sucursal BA', true, NOW(), NOW()),
  (140621, 'PDV 140621', 'Sucursal BB', true, NOW(), NOW()),
  (140622, 'PDV 140622', 'Sucursal BC', true, NOW(), NOW()),
  (140623, 'PDV 140623', 'Sucursal BD', true, NOW(), NOW()),
  (140670, 'PDV 140670', 'Sucursal BE', true, NOW(), NOW()),
  (140672, 'PDV 140672', 'Sucursal BF', true, NOW(), NOW()),
  (140673, 'PDV 140673', 'Sucursal BG', true, NOW(), NOW()),
  (140676, 'PDV 140676', 'Sucursal BH', true, NOW(), NOW()),
  (140826, 'PDV 140826', 'Sucursal BI', true, NOW(), NOW()),
  (141069, 'PDV 141069', 'Sucursal BJ', true, NOW(), NOW()),
  (141070, 'PDV 141070', 'Sucursal BK', true, NOW(), NOW()),
  (141110, 'PDV 141110', 'Sucursal BL', true, NOW(), NOW()),
  (141163, 'PDV 141163', 'Sucursal BM', true, NOW(), NOW()),
  (141164, 'PDV 141164', 'Sucursal BN', true, NOW(), NOW()),
  (141165, 'PDV 141165', 'Sucursal BO', true, NOW(), NOW()),
  (141167, 'PDV 141167', 'Sucursal BP', true, NOW(), NOW()),
  (141168, 'PDV 141168', 'Sucursal BQ', true, NOW(), NOW()),
  (141169, 'PDV 141169', 'Sucursal BR', true, NOW(), NOW()),
  (141196, 'PDV 141196', 'Sucursal BS', true, NOW(), NOW()),
  (141197, 'PDV 141197', 'Sucursal BT', true, NOW(), NOW()),
  (141198, 'PDV 141198', 'Sucursal BU', true, NOW(), NOW()),
  (141201, 'PDV 141201', 'Sucursal BV', true, NOW(), NOW()),
  (141234, 'PDV 141234', 'Sucursal BW', true, NOW(), NOW()),
  (141324, 'PDV 141324', 'Sucursal BX', true, NOW(), NOW()),
  (141412, 'PDV 141412', 'Sucursal BY', true, NOW(), NOW()),
  (141413, 'PDV 141413', 'Sucursal BZ', true, NOW(), NOW()),
  (141414, 'PDV 141414', 'Sucursal CA', true, NOW(), NOW()),
  (141616, 'PDV 141616', 'Sucursal CB', true, NOW(), NOW()),
  (141617, 'PDV 141617', 'Sucursal CC', true, NOW(), NOW()),
  (141620, 'PDV 141620', 'Sucursal CD', true, NOW(), NOW()),
  (141621, 'PDV 141621', 'Sucursal CE', true, NOW(), NOW()),
  (141623, 'PDV 141623', 'Sucursal CF', true, NOW(), NOW()),
  (141624, 'PDV 141624', 'Sucursal CG', true, NOW(), NOW()),
  (141625, 'PDV 141625', 'Sucursal CH', true, NOW(), NOW()),
  (141626, 'PDV 141626', 'Sucursal CI', true, NOW(), NOW()),
  (141633, 'PDV 141633', 'Sucursal CJ', true, NOW(), NOW()),
  (141634, 'PDV 141634', 'Sucursal CK', true, NOW(), NOW()),
  (141635, 'PDV 141635', 'Sucursal CL', true, NOW(), NOW()),
  (141687, 'PDV 141687', 'Sucursal CM', true, NOW(), NOW()),
  (141690, 'PDV 141690', 'Sucursal CN', true, NOW(), NOW()),
  (141691, 'PDV 141691', 'Sucursal CO', true, NOW(), NOW()),
  (141696, 'PDV 141696', 'Sucursal CP', true, NOW(), NOW()),
  (141698, 'PDV 141698', 'Sucursal CQ', true, NOW(), NOW()),
  (141700, 'PDV 141700', 'Sucursal CR', true, NOW(), NOW()),
  (141703, 'PDV 141703', 'Sucursal CS', true, NOW(), NOW()),
  (141848, 'PDV 141848', 'Sucursal CT', true, NOW(), NOW()),
  (141974, 'PDV 141974', 'Sucursal CU', true, NOW(), NOW()),
  (141983, 'PDV 141983', 'Sucursal CV', true, NOW(), NOW()),
  (141984, 'PDV 141984', 'Sucursal CW', true, NOW(), NOW()),
  (141985, 'PDV 141985', 'Sucursal CX', true, NOW(), NOW()),
  (141986, 'PDV 141986', 'Sucursal CY', true, NOW(), NOW()),
  (141987, 'PDV 141987', 'Sucursal CZ', true, NOW(), NOW()),
  (141988, 'PDV 141988', 'Sucursal DA', true, NOW(), NOW()),
  (141989, 'PDV 141989', 'Sucursal DB', true, NOW(), NOW()),
  (141992, 'PDV 141992', 'Sucursal DC', true, NOW(), NOW()),
  (141993, 'PDV 141993', 'Sucursal DD', true, NOW(), NOW()),
  (141995, 'PDV 141995', 'Sucursal DE', true, NOW(), NOW()),
  (141997, 'PDV 141997', 'Sucursal DF', true, NOW(), NOW()),
  (141998, 'PDV 141998', 'Sucursal DG', true, NOW(), NOW()),
  (142001, 'PDV 142001', 'Sucursal DH', true, NOW(), NOW()),
  (142007, 'PDV 142007', 'Sucursal DI', true, NOW(), NOW()),
  (142011, 'PDV 142011', 'Sucursal DJ', true, NOW(), NOW()),
  (142013, 'PDV 142013', 'Sucursal DK', true, NOW(), NOW()),
  (142561, 'PDV 142561', 'Sucursal DL', true, NOW(), NOW()),
  (142564, 'PDV 142564', 'Sucursal DM', true, NOW(), NOW()),
  (142565, 'PDV 142565', 'Sucursal DN', true, NOW(), NOW()),
  (142567, 'PDV 142567', 'Sucursal DO', true, NOW(), NOW()),
  (142569, 'PDV 142569', 'Sucursal DP', true, NOW(), NOW()),
  (142572, 'PDV 142572', 'Sucursal DQ', true, NOW(), NOW()),
  (142573, 'PDV 142573', 'Sucursal DR', true, NOW(), NOW()),
  (142574, 'PDV 142574', 'Sucursal DS', true, NOW(), NOW()),
  (142576, 'PDV 142576', 'Sucursal DT', true, NOW(), NOW()),
  (142577, 'PDV 142577', 'Sucursal DU', true, NOW(), NOW()),
  (142582, 'PDV 142582', 'Sucursal DV', true, NOW(), NOW()),
  (143203, 'PDV 143203', 'Sucursal DW', true, NOW(), NOW()),
  (143207, 'PDV 143207', 'Sucursal DX', true, NOW(), NOW()),
  (143233, 'PDV 143233', 'Sucursal DY', true, NOW(), NOW()),
  (143360, 'PDV 143360', 'Sucursal DZ', true, NOW(), NOW()),
  (143361, 'PDV 143361', 'Sucursal EA', true, NOW(), NOW()),
  (143362, 'PDV 143362', 'Sucursal EB', true, NOW(), NOW()),
  (143364, 'PDV 143364', 'Sucursal EC', true, NOW(), NOW()),
  (143365, 'PDV 143365', 'Sucursal ED', true, NOW(), NOW()),
  (143438, 'PDV 143438', 'Sucursal EE', true, NOW(), NOW()),
  (143439, 'PDV 143439', 'Sucursal EF', true, NOW(), NOW()),
  (143440, 'PDV 143440', 'Sucursal EG', true, NOW(), NOW()),
  (143607, 'PDV 143607', 'Sucursal EH', true, NOW(), NOW()),
  (143618, 'PDV 143618', 'Sucursal EI', true, NOW(), NOW()),
  (143620, 'PDV 143620', 'Sucursal EJ', true, NOW(), NOW()),
  (143621, 'PDV 143621', 'Sucursal EK', true, NOW(), NOW()),
  (143736, 'PDV 143736', 'Sucursal EL', true, NOW(), NOW()),
  (143738, 'PDV 143738', 'Sucursal EM', true, NOW(), NOW()),
  (143790, 'PDV 143790', 'Sucursal EN', true, NOW(), NOW()),
  (143831, 'PDV 143831', 'Sucursal EO', true, NOW(), NOW()),
  (143832, 'PDV 143832', 'Sucursal EP', true, NOW(), NOW()),
  (143834, 'PDV 143834', 'Sucursal EQ', true, NOW(), NOW()),
  (143835, 'PDV 143835', 'Sucursal ER', true, NOW(), NOW()),
  (143837, 'PDV 143837', 'Sucursal ES', true, NOW(), NOW()),
  (143838, 'PDV 143838', 'Sucursal ET', true, NOW(), NOW()),
  (143842, 'PDV 143842', 'Sucursal EU', true, NOW(), NOW()),
  (143844, 'PDV 143844', 'Sucursal EV', true, NOW(), NOW()),
  (143845, 'PDV 143845', 'Sucursal EW', true, NOW(), NOW()),
  (143846, 'PDV 143846', 'Sucursal EX', true, NOW(), NOW()),
  (143847, 'PDV 143847', 'Sucursal EY', true, NOW(), NOW()),
  (144020, 'PDV 144020', 'Sucursal EZ', true, NOW(), NOW()),
  (144028, 'PDV 144028', 'Sucursal FA', true, NOW(), NOW()),
  (144029, 'PDV 144029', 'Sucursal FB', true, NOW(), NOW()),
  (144126, 'PDV 144126', 'Sucursal FC', true, NOW(), NOW()),
  (144133, 'PDV 144133', 'Sucursal FD', true, NOW(), NOW()),
  (144134, 'PDV 144134', 'Sucursal FE', true, NOW(), NOW()),
  (144135, 'PDV 144135', 'Sucursal FF', true, NOW(), NOW()),
  (144194, 'PDV 144194', 'Sucursal FG', true, NOW(), NOW()),
  (144195, 'PDV 144195', 'Sucursal FH', true, NOW(), NOW()),
  (144202, 'PDV 144202', 'Sucursal FI', true, NOW(), NOW()),
  (144271, 'PDV 144271', 'Sucursal FJ', true, NOW(), NOW()),
  (144273, 'PDV 144273', 'Sucursal FK', true, NOW(), NOW()),
  (144274, 'PDV 144274', 'Sucursal FL', true, NOW(), NOW()),
  (144275, 'PDV 144275', 'Sucursal FM', true, NOW(), NOW()),
  (144276, 'PDV 144276', 'Sucursal FN', true, NOW(), NOW()),
  (144284, 'PDV 144284', 'Sucursal FO', true, NOW(), NOW()),
  (144287, 'PDV 144287', 'Sucursal FP', true, NOW(), NOW()),
  (144490, 'PDV 144490', 'Sucursal FQ', true, NOW(), NOW()),
  (144491, 'PDV 144491', 'Sucursal FR', true, NOW(), NOW()),
  (144492, 'PDV 144492', 'Sucursal FS', true, NOW(), NOW()),
  (144497, 'PDV 144497', 'Sucursal FT', true, NOW(), NOW()),
  (144498, 'PDV 144498', 'Sucursal FU', true, NOW(), NOW()),
  (144499, 'PDV 144499', 'Sucursal FV', true, NOW(), NOW()),
  (144500, 'PDV 144500', 'Sucursal FW', true, NOW(), NOW()),
  (144501, 'PDV 144501', 'Sucursal FX', true, NOW(), NOW()),
  (144637, 'PDV 144637', 'Sucursal FY', true, NOW(), NOW()),
  (144638, 'PDV 144638', 'Sucursal FZ', true, NOW(), NOW()),
  (144640, 'PDV 144640', 'Sucursal GA', true, NOW(), NOW()),
  (144644, 'PDV 144644', 'Sucursal GB', true, NOW(), NOW()),
  (144646, 'PDV 144646', 'Sucursal GC', true, NOW(), NOW()),
  (144648, 'PDV 144648', 'Sucursal GD', true, NOW(), NOW()),
  (144649, 'PDV 144649', 'Sucursal GE', true, NOW(), NOW()),
  (144650, 'PDV 144650', 'Sucursal GF', true, NOW(), NOW()),
  (144651, 'PDV 144651', 'Sucursal GG', true, NOW(), NOW()),
  (144652, 'PDV 144652', 'Sucursal GH', true, NOW(), NOW()),
  (144653, 'PDV 144653', 'Sucursal GI', true, NOW(), NOW()),
  (144654, 'PDV 144654', 'Sucursal GJ', true, NOW(), NOW()),
  (144655, 'PDV 144655', 'Sucursal GK', true, NOW(), NOW()),
  (144678, 'PDV 144678', 'Sucursal GL', true, NOW(), NOW()),
  (144679, 'PDV 144679', 'Sucursal GM', true, NOW(), NOW()),
  (144680, 'PDV 144680', 'Sucursal GN', true, NOW(), NOW()),
  (144686, 'PDV 144686', 'Sucursal GO', true, NOW(), NOW()),
  (144712, 'PDV 144712', 'Sucursal GP', true, NOW(), NOW()),
  (144713, 'PDV 144713', 'Sucursal GQ', true, NOW(), NOW()),
  (144843, 'PDV 144843', 'Sucursal GR', true, NOW(), NOW()),
  (144848, 'PDV 144848', 'Sucursal GS', true, NOW(), NOW()),
  (144849, 'PDV 144849', 'Sucursal GT', true, NOW(), NOW()),
  (144859, 'PDV 144859', 'Sucursal GU', true, NOW(), NOW()),
  (144861, 'PDV 144861', 'Sucursal GV', true, NOW(), NOW()),
  (144862, 'PDV 144862', 'Sucursal GW', true, NOW(), NOW()),
  (144863, 'PDV 144863', 'Sucursal GX', true, NOW(), NOW()),
  (144865, 'PDV 144865', 'Sucursal GY', true, NOW(), NOW()),
  (144866, 'PDV 144866', 'Sucursal GZ', true, NOW(), NOW()),
  (144886, 'PDV 144886', 'Sucursal HA', true, NOW(), NOW()),
  (144887, 'PDV 144887', 'Sucursal HB', true, NOW(), NOW()),
  (144898, 'PDV 144898', 'Sucursal HC', true, NOW(), NOW()),
  (144901, 'PDV 144901', 'Sucursal HD', true, NOW(), NOW()),
  (144903, 'PDV 144903', 'Sucursal HE', true, NOW(), NOW()),
  (144906, 'PDV 144906', 'Sucursal HF', true, NOW(), NOW()),
  (145170, 'PDV 145170', 'Sucursal HG', true, NOW(), NOW()),
  (145299, 'PDV 145299', 'Sucursal HH', true, NOW(), NOW())
ON CONFLICT ("pointNumberId") DO NOTHING;

-- ============================================
-- PASO 3: Asignar aleatoriamente los PDVs a los usuarios
-- ============================================
-- Distribuye los puntos de venta entre los 3 usuarios de forma aleatoria y equitativa

WITH user_ids AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) - 1 as user_index
  FROM "User" 
  WHERE email IN ('usuario1@test.com', 'usuario2@test.com', 'usuario3@test.com')
  ORDER BY id
),
pdv_list AS (
  SELECT 
    "pointNumberId",
    ROW_NUMBER() OVER (ORDER BY RANDOM()) - 1 as row_num
  FROM "PointOfSale" 
  WHERE "pointNumberId" IN (
    137002, 137012, 137015, 137016, 137018, 137019, 137020, 137021, 137022, 137023, 137024, 137025, 137026, 137030, 137031, 137032, 137034, 137356, 137357, 137362, 137363, 138685, 138687, 138701, 138702, 138704, 138706, 138708, 138710, 138983, 138984, 139044, 139075, 139101, 139190, 139193, 139316, 139462, 139477, 139478, 139519, 139662, 139664, 139670, 139704, 139731, 139733, 139801, 139999, 140393, 140394, 140396, 140397, 140399, 140460, 140461, 140462, 140463, 140464, 140465, 140466, 140469, 140494, 140496, 140500, 140621, 140622, 140623, 140670, 140672, 140673, 140676, 140826, 141069, 141070, 141110, 141163, 141164, 141165, 141167, 141168, 141169, 141196, 141197, 141198, 141201, 141234, 141324, 141412, 141413, 141414, 141616, 141617, 141620, 141621, 141623, 141624, 141625, 141626, 141633, 141634, 141635, 141687, 141690, 141691, 141696, 141698, 141700, 141703, 141848, 141974, 141983, 141984, 141985, 141986, 141987, 141988, 141989, 141992, 141993, 141995, 141997, 141998, 142001, 142007, 142011, 142013, 142561, 142564, 142565, 142567, 142569, 142572, 142573, 142574, 142576, 142577, 142582, 143203, 143207, 143233, 143360, 143361, 143362, 143364, 143365, 143438, 143439, 143440, 143607, 143618, 143620, 143621, 143736, 143738, 143790, 143831, 143832, 143834, 143835, 143837, 143838, 143842, 143844, 143845, 143846, 143847, 144020, 144028, 144029, 144126, 144133, 144134, 144135, 144194, 144195, 144202, 144271, 144273, 144274, 144275, 144276, 144284, 144287, 144490, 144491, 144492, 144497, 144498, 144499, 144500, 144501, 144637, 144638, 144640, 144644, 144646, 144648, 144649, 144650, 144651, 144652, 144653, 144654, 144655, 144678, 144679, 144680, 144686, 144712, 144713, 144843, 144848, 144849, 144859, 144861, 144862, 144863, 144865, 144866, 144886, 144887, 144898, 144901, 144903, 144906, 145170, 145299
  )
),
user_pdv_assignments AS (
  SELECT 
    (SELECT id FROM user_ids WHERE user_index = (pdv.row_num % 3)) as user_id,
    pdv."pointNumberId" as point_of_sale_id
  FROM pdv_list pdv
)
INSERT INTO "UserPointOfSale" ("userId", "pointOfSaleId", "assignedAt")
SELECT user_id, point_of_sale_id, NOW()
FROM user_pdv_assignments
WHERE user_id IS NOT NULL
ON CONFLICT ("userId", "pointOfSaleId") DO NOTHING;

-- ============================================
-- VERIFICACIÓN (Opcional - puedes ejecutarlo para verificar)
-- ============================================
-- SELECT 
--   u.nickname,
--   COUNT(upos.id) as puntos_asignados
-- FROM "User" u
-- LEFT JOIN "UserPointOfSale" upos ON u.id = upos."userId"
-- WHERE u.email IN ('usuario1@test.com', 'usuario2@test.com', 'usuario3@test.com')
-- GROUP BY u.id, u.nickname
-- ORDER BY u.id;

-- ============================================
-- QUERY ADICIONAL: Agregar nuevos PDVs y asignarlos aleatoriamente
-- ============================================

-- PASO 1: Insertar los nuevos puntos de venta
INSERT INTO "PointOfSale" ("pointNumberId", name, location, "isActive", "createdAt", "updatedAt")
VALUES 
  (11773, 'PDV 11773', 'Sucursal Nueva 1', true, NOW(), NOW()),
  (13331, 'PDV 13331', 'Sucursal Nueva 2', true, NOW(), NOW()),
  (13336, 'PDV 13336', 'Sucursal Nueva 3', true, NOW(), NOW()),
  (11948, 'PDV 11948', 'Sucursal Nueva 4', true, NOW(), NOW()),
  (13367, 'PDV 13367', 'Sucursal Nueva 5', true, NOW(), NOW()),
  (11949, 'PDV 11949', 'Sucursal Nueva 6', true, NOW(), NOW()),
  (13360, 'PDV 13360', 'Sucursal Nueva 7', true, NOW(), NOW()),
  (13359, 'PDV 13359', 'Sucursal Nueva 8', true, NOW(), NOW()),
  (11952, 'PDV 11952', 'Sucursal Nueva 9', true, NOW(), NOW()),
  (13366, 'PDV 13366', 'Sucursal Nueva 10', true, NOW(), NOW())
ON CONFLICT ("pointNumberId") DO NOTHING;

-- PASO 2: Asignar aleatoriamente los nuevos PDVs a los usuarios existentes
WITH user_ids AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) - 1 as user_index
  FROM "User" 
  WHERE email IN ('usuario1@test.com', 'usuario2@test.com', 'usuario3@test.com')
  ORDER BY id
),
new_pdv_list AS (
  SELECT 
    "pointNumberId",
    ROW_NUMBER() OVER (ORDER BY RANDOM()) - 1 as row_num
  FROM "PointOfSale" 
  WHERE "pointNumberId" IN (11773, 13331, 13336, 11948, 13367, 11949, 13360, 13359, 11952, 13366)
),
new_user_pdv_assignments AS (
  SELECT 
    (SELECT id FROM user_ids WHERE user_index = (pdv.row_num % 3)) as user_id,
    pdv."pointNumberId" as point_of_sale_id
  FROM new_pdv_list pdv
)
INSERT INTO "UserPointOfSale" ("userId", "pointOfSaleId", "assignedAt")
SELECT user_id, point_of_sale_id, NOW()
FROM new_user_pdv_assignments
WHERE user_id IS NOT NULL
ON CONFLICT ("userId", "pointOfSaleId") DO NOTHING;

