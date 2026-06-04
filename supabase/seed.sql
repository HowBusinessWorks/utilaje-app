-- =============================================
-- FleetOps — Demo Seed Data
-- Run AFTER schema.sql
-- =============================================

INSERT INTO categorii (id, nume, culoare) VALUES
  (1, 'Excavatoare',    '#5b8af0'),
  (2, 'Buldozere',      '#f0a500'),
  (3, 'Macarale',       '#9b6dff'),
  (4, 'Compactoare',    '#2dd4a0'),
  (5, 'Autobasculante', '#ff6b35');

INSERT INTO locatii (id, nume, adresa, lat, lng, tip) VALUES
  (1, 'Baza Cluj',              'Cluj-Napoca, Str. Fabricii 20',        46.7712, 23.6236, 'baza'),
  (2, 'Bloc Titan',             'Cluj-Napoca, Calea Turzii 145',        46.7489, 23.6140, 'lucrare'),
  (3, 'Santier Nord',           'Cluj-Napoca, Str. Dorobantilor 14',    46.7890, 23.5980, 'lucrare'),
  (4, 'Parc Industrial Tetarom','Cluj-Napoca, Tetarom III',             46.8012, 23.7100, 'lucrare'),
  (5, 'Autostrada A3',          'Autostrada A3, km 45',                 46.8500, 23.5000, 'lucrare');

INSERT INTO persoane (id, nume, telefon, categorie) VALUES
  (1, 'Ion Popescu',          '0740 123 456', 'angajat'),
  (2, 'Mihai Radu',           '0741 234 567', 'angajat'),
  (3, 'George Dan',           '0742 345 678', 'angajat'),
  (4, 'SC Meca SRL',          '0264 100 200', 'subcontractant'),
  (5, 'Pavel Muresan',        '0743 456 789', 'angajat'),
  (6, 'Alexandru Ionescu',    '0744 567 890', 'angajat'),
  (7, 'SC TehnoService SRL',  '0264 200 300', 'subcontractant');

INSERT INTO lucrari (id, nume, locatie_id, data_start, status) VALUES
  (1, 'Bloc Titan',                 2, '2025-04-15', 'activa'),
  (2, 'Santier Nord',               3, '2025-05-01', 'activa'),
  (3, 'Parc Industrial Tetarom',    4, '2025-03-10', 'activa'),
  (4, 'Autostrada A3',              5, '2025-01-20', 'activa'),
  (5, 'Proiect Finalizat Exemplu',  2, '2024-10-01', 'finalizata');

INSERT INTO utilaje (id, denumire, alias, serie, nr_inventar, responsabil_id, locatie_baza_id, producator, proprietate, garantie_exp, data_achizitie, status, categorie_id, chirie_zi, ore_contor) VALUES
  (1,  'Excavator CAT 320',            'EXC-01', 'CAT320-2019-1042',  '10042', 1, 1, 'Caterpillar', 'propriu',   '2026-03-14', '2019-03-14', 'disponibil',   1, 850,  2840),
  (2,  'Macara Liebherr LTM 1050',     'MAC-02', 'LTM-2020-0081',     '10067', 2, 1, 'Liebherr',    'propriu',   '2025-01-20', '2020-01-20', 'service',      3, 1200, 1520),
  (3,  'Buldozer Caterpillar D6T',     'BLD-03', 'D6T-2018-5522',     '10033', 3, 1, 'Caterpillar', 'propriu',   NULL,         '2018-06-10', 'disponibil',   2, 720,  4210),
  (4,  'Compactor BOMAG BW 213',       'CMP-04', 'BW213-2021-0991',   '10089', 5, 1, 'BOMAG',       'leasing',   '2026-08-15', '2021-08-15', 'indisponibil', 4, 480,  980),
  (5,  'Autobasculanta Volvo FMX',     'ABS-05', 'FMX-2022-1107',     '10112', 1, 1, 'Volvo',       'propriu',   '2027-02-20', '2022-02-20', 'disponibil',   5, 650,  3120),
  (6,  'Incarcator Frontal JCB 456',   'INC-06', 'JCB456-2020-3301',  '10098', 3, 1, 'JCB',         'propriu',   NULL,         '2020-11-05', 'disponibil',   1, 390,  1870),
  (7,  'Excavator Komatsu PC210',      'EXC-07', 'PC210-2021-8810',   '10145', 6, 1, 'Komatsu',     'propriu',   '2027-06-15', '2021-06-15', 'disponibil',   1, 780,  1560),
  (8,  'Buldozer Liebherr PR 736',     'BLD-08', 'PR736-2020-2211',   '10133', 2, 1, 'Liebherr',    'propriu',   '2025-09-10', '2020-09-10', 'disponibil',   2, 850,  3900),
  (9,  'Macara Turn Potain MDT 178',   'MAC-09', 'MDT178-2022-0055',  '10167', 5, 1, 'Potain',      'inchiriat', '2028-03-20', '2022-03-20', 'disponibil',   3, 950,  890),
  (10, 'Autobasculanta Mercedes Arocs','ABS-10', 'AROCS-2023-0421',   '10188', 6, 1, 'Mercedes',    'leasing',   '2028-07-01', '2023-07-01', 'disponibil',   5, 580,  420);

INSERT INTO planificari (utilaj_id, lucrare_id, persoana_id, data_start, data_sfarsit) VALUES
  (1,  1,    1, '2025-06-02', '2025-06-14'),
  (3,  2,    3, '2025-06-05', '2025-06-20'),
  (5,  1,    1, '2025-06-01', '2025-06-12'),
  (2,  NULL, 2, '2025-06-01', '2025-06-06'),
  (7,  3,    6, '2025-06-03', '2025-06-18'),
  (8,  4,    2, '2025-05-28', '2025-06-15'),
  (9,  2,    5, '2025-06-10', '2025-06-25'),
  (6,  4,    3, '2025-06-01', '2025-06-08'),
  (10, 3,    6, '2025-06-05', '2025-06-20');

INSERT INTO fise_motorina (utilaj_id, lucrare_id, persoana_id, data_consum, nr_litri, furnizor, ore_contor) VALUES
  (1,  1, 1, '2025-06-03', 320, 'Rompetrol', 2870),
  (3,  2, 3, '2025-06-02', 180, 'OMV',       4240),
  (5,  1, 1, '2025-06-01',  95, 'Rompetrol', 3145),
  (7,  3, 6, '2025-06-04', 210, 'MOL',       1580),
  (8,  4, 2, '2025-06-03', 290, 'Rompetrol', 3920),
  (1,  1, 1, '2025-05-28', 350, 'OMV',       2820),
  (3,  2, 3, '2025-05-30', 165, 'Rompetrol', 4220),
  (6,  4, 3, '2025-06-02', 120, 'MOL',       1885),
  (5,  1, 1, '2025-05-25',  88, 'OMV',       3120),
  (7,  3, 6, '2025-05-27', 195, 'Rompetrol', 1560),
  (10, 3, 6, '2025-06-06', 145, 'MOL',        440),
  (9,  2, 5, '2025-06-12',  75, 'Rompetrol',  910),
  (1,  1, 1, '2025-04-15', 310, 'OMV',       2780),
  (3,  2, 3, '2025-04-20', 175, 'Rompetrol', 4180),
  (5,  1, 1, '2025-04-10',  92, 'MOL',       3090),
  (8,  4, 2, '2025-04-25', 280, 'OMV',       3870),
  (7,  3, 6, '2025-04-18', 205, 'Rompetrol', 1530),
  (1,  1, 1, '2025-03-10', 340, 'OMV',       2750),
  (3,  2, 3, '2025-03-15', 190, 'Rompetrol', 4150),
  (5,  1, 1, '2025-03-20',  98, 'MOL',       3060);

INSERT INTO fise_reparatii (utilaj_id, data_reparatie, furnizor, descriere, cost_total, ore_contor, durata_zile) VALUES
  (3, '2025-06-02', 'SC Meca SRL',          'Inlocuire garnituri hidraulice si ulei hidraulic', 4200,  4210, 3),
  (2, '2025-05-15', 'SC TehnoService SRL',  'Revizie completa motor si schimb filtre',          8500,  1510, 7),
  (4, '2025-04-20', 'SC Meca SRL',          'Reparatie sistem de compactare',                   2800,   975, 2),
  (1, '2025-03-10', 'Caterpillar Service',  'Inlocuire lanturi de rulare',                     12400,  2800, 5),
  (8, '2025-05-20', 'SC TehnoService SRL',  'Reparatie sistem hidraulic brat',                  5600,  3890, 4),
  (6, '2025-04-05', 'SC Meca SRL',          'Inlocuire anvelope si frane',                      3200,  1850, 2),
  (7, '2025-02-14', 'Komatsu Service',      'Revizie motor la 1500 ore',                        6800,  1550, 3),
  (5, '2025-01-22', 'SC Meca SRL',          'Reparatie sistem pneumatic',                       1900,  3050, 1);

INSERT INTO procese_verbale
  (utilaj_id, lucrare_id, data_predare, persoana_primire_id, responsabil_predare,
   ore_contor_predare, motorina_predare, stare_predare, observatii_predare, status)
VALUES
  (1, 1, '2025-06-02', 1, 'Mihai Radu',  2840, 200, 'buna',       'Utilaj in stare buna, fara defectiuni', 'deschis'),
  (5, 1, '2025-06-01', 1, 'George Dan',  3120, 150, 'buna',       NULL,                                    'deschis'),
  (3, 5, '2025-05-01', 3, 'Ion Popescu', 4100, 180, 'acceptabila','Zgarieturi minore pe caroserie',        'inchis');

INSERT INTO utilaje_poze (id, utilaj_id, url, is_primary) VALUES
  (1,  1,  'https://picsum.photos/seed/excavator-cat/600/400',       1),
  (2,  2,  'https://picsum.photos/seed/liebherr-crane/600/400',      1),
  (3,  3,  'https://picsum.photos/seed/caterpillar-d6t/600/400',     1),
  (4,  4,  'https://picsum.photos/seed/bomag-compactor/600/400',     1),
  (5,  5,  'https://picsum.photos/seed/volvo-fmx-truck/600/400',     1),
  (6,  6,  'https://picsum.photos/seed/jcb-frontloader/600/400',     1),
  (7,  7,  'https://picsum.photos/seed/komatsu-pc210/600/400',       1),
  (8,  8,  'https://picsum.photos/seed/liebherr-pr736/600/400',      1),
  (9,  9,  'https://picsum.photos/seed/potain-tower-crane/600/400',  1),
  (10, 10, 'https://picsum.photos/seed/mercedes-arocs-dump/600/400', 1);

UPDATE utilaje SET thumbnail_url = 'https://picsum.photos/seed/excavator-cat/600/400'       WHERE id = 1;
UPDATE utilaje SET thumbnail_url = 'https://picsum.photos/seed/liebherr-crane/600/400'      WHERE id = 2;
UPDATE utilaje SET thumbnail_url = 'https://picsum.photos/seed/caterpillar-d6t/600/400'     WHERE id = 3;
UPDATE utilaje SET thumbnail_url = 'https://picsum.photos/seed/bomag-compactor/600/400'     WHERE id = 4;
UPDATE utilaje SET thumbnail_url = 'https://picsum.photos/seed/volvo-fmx-truck/600/400'     WHERE id = 5;
UPDATE utilaje SET thumbnail_url = 'https://picsum.photos/seed/jcb-frontloader/600/400'     WHERE id = 6;
UPDATE utilaje SET thumbnail_url = 'https://picsum.photos/seed/komatsu-pc210/600/400'       WHERE id = 7;
UPDATE utilaje SET thumbnail_url = 'https://picsum.photos/seed/liebherr-pr736/600/400'      WHERE id = 8;
UPDATE utilaje SET thumbnail_url = 'https://picsum.photos/seed/potain-tower-crane/600/400'  WHERE id = 9;
UPDATE utilaje SET thumbnail_url = 'https://picsum.photos/seed/mercedes-arocs-dump/600/400' WHERE id = 10;

-- Reset sequences so new inserts get correct IDs
SELECT setval('categorii_id_seq',    (SELECT MAX(id) FROM categorii));
SELECT setval('locatii_id_seq',      (SELECT MAX(id) FROM locatii));
SELECT setval('persoane_id_seq',     (SELECT MAX(id) FROM persoane));
SELECT setval('lucrari_id_seq',      (SELECT MAX(id) FROM lucrari));
SELECT setval('utilaje_id_seq',      (SELECT MAX(id) FROM utilaje));
SELECT setval('utilaje_poze_id_seq', (SELECT MAX(id) FROM utilaje_poze));
