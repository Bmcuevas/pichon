import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import column_index_from_string

wb = openpyxl.Workbook()
ws = wb.active
ws.title = 'Mapping'

BLUE_FILL   = PatternFill('solid', start_color='1F4E79')
GREEN_FILL  = PatternFill('solid', start_color='375623')

thin = Side(style='thin', color='BBBBBB')
border = Border(left=thin, right=thin, top=thin, bottom=thin)

def cs(ws, row, col, value, font=None, fill=None, align='left', wrap=False):
    c = ws.cell(row=row, column=col, value=value)
    if font: c.font = font
    if fill: c.fill = fill
    c.alignment = Alignment(horizontal=align, vertical='center', wrap_text=wrap)
    c.border = border
    return c

# Title
ws.merge_cells('A1:F1')
c = ws.cell(row=1, column=1, value='MAPPING DE RUBROS  |  Rubros Propios  vs  Generador de Precios CYPE Argentina')
c.font = Font(name='Arial', bold=True, size=14, color='FFFFFF')
c.fill = PatternFill('solid', start_color='1F4E79')
c.alignment = Alignment(horizontal='center', vertical='center')
ws.row_dimensions[1].height = 28

ws.merge_cells('A2:F2')
c = ws.cell(row=2, column=1, value='Fuente 1: Rubros_Argentina_Propios_v1.xls   |   Fuente 2: Rubros_Argentina_GeneradorPrecios_v4.xlsx')
c.font = Font(name='Arial', italic=True, size=9)
c.alignment = Alignment(horizontal='center', vertical='center')
ws.row_dimensions[2].height = 16

ws.row_dimensions[3].height = 6

cols_cfg = [('A',35),('B',46),('C',10),('D',40),('E',13),('F',44)]
headers = ['RUBRO (Propios)', 'SUB-RUBRO (Propios)', 'Cod.Cap', 'CAPITULO (Generador)', 'Cod.Sub', 'SUBRUBRO (Generador)']
fills = [BLUE_FILL, BLUE_FILL, GREEN_FILL, GREEN_FILL, GREEN_FILL, GREEN_FILL]
for idx, ((letter, width), header, fill) in enumerate(zip(cols_cfg, headers, fills), start=1):
    ws.column_dimensions[letter].width = width
    c = ws.cell(row=4, column=idx, value=header)
    c.font = Font(name='Arial', bold=True, color='FFFFFF', size=10)
    c.fill = fill
    c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    c.border = border
ws.row_dimensions[4].height = 32

rows = [
    ('1. TRABAJOS PRELIMINARES','1.1 DEMOLICIONES','D','Demoliciones','DC/DD/DE/DF/DP/DL/DH/DI/DN/DQ/DR/DS/DU/DM','Edificio, Cimentaciones, Estructuras, Fachadas, Particiones, Carpintería, Remates, Instalaciones, Aislamientos, Cubiertas, Revestimientos, Equipamiento, Urbanización, Firmes'),
    ('1. TRABAJOS PRELIMINARES','1.2 LIMPIEZA DEL TERRENO','A','Acondicionamiento del terreno','AD','Movimiento de tierras en edificación'),
    ('1. TRABAJOS PRELIMINARES','1.3 VALLA PROVISORIA','Y','Seguridad y salud','YC','Sistemas de protección colectiva'),
    ('1. TRABAJOS PRELIMINARES','1.4 CASILLA PARA OBRADOR','Y','Seguridad y salud','YP','Instalaciones provisionales de higiene y bienestar'),
    ('1. TRABAJOS PRELIMINARES','1.5 SANITARIOS DE OBRA','Y','Seguridad y salud','YP','Instalaciones provisionales de higiene y bienestar'),
    ('1. TRABAJOS PRELIMINARES','1.6 OFICINA DE OBRA','Y','Seguridad y salud','YP','Instalaciones provisionales de higiene y bienestar'),
    ('1. TRABAJOS PRELIMINARES','1.7 CARTEL DE OBRA','Y','Seguridad y salud','YS','Señalización provisional de obras'),
    ('1. TRABAJOS PRELIMINARES','1.8 ARME Y DESARME DE ANDAMIOS','0','Actuaciones previas','0X','Andamios y maquinaria de elevación'),
    ('1. TRABAJOS PRELIMINARES','1.9 REPLANTEO','A','Acondicionamiento del terreno','AN','Nivelación'),
    ('1. TRABAJOS PRELIMINARES','1.10 ENSAYO DE SUELOS','X','Control de calidad y ensayos','XS','Estudios geotécnicos'),
    ('1. TRABAJOS PRELIMINARES','1.11 NIVELACION CON AGRIMENSOR','A','Acondicionamiento del terreno','AN','Nivelación'),
    ('1. TRABAJOS PRELIMINARES','1.12 DOCUMENTACION DE OBRA','X','Control de calidad y ensayos','XO','Control técnico'),
    ('1. TRABAJOS PRELIMINARES','1.13 AGUA DE CONSTRUCCION','Y','Seguridad y salud','YP','Instalaciones provisionales de higiene y bienestar'),
    ('1. TRABAJOS PRELIMINARES','1.14 LUZ DE OBRA','Y','Seguridad y salud','YP','Instalaciones provisionales de higiene y bienestar'),
    ('2. MOVIMIENTO DE TIERRA','2.1 DESMONTE GENERAL','A','Acondicionamiento del terreno','AD','Movimiento de tierras en edificación'),
    ('2. MOVIMIENTO DE TIERRA','2.2 RELLENO Y TERRAPLENAMIENTO','A','Acondicionamiento del terreno','AD','Movimiento de tierras en edificación'),
    ('2. MOVIMIENTO DE TIERRA','2.3 EXCAVACION PARA SOTANOS','A','Acondicionamiento del terreno','AD','Movimiento de tierras en edificación'),
    ('2. MOVIMIENTO DE TIERRA','2.4 VACIADO Y LLENADO DE POZOS NEGROS','A','Acondicionamiento del terreno','AS','Red de saneamiento horizontal'),
    ('2. MOVIMIENTO DE TIERRA','2.5 EXCAVACION PARA BASES','C','Fundaciones','CS','Superficiales'),
    ('2. MOVIMIENTO DE TIERRA','2.6 EXCAVACION PARA PILOTINES','C','Fundaciones','CP','Profundas'),
    ('2. MOVIMIENTO DE TIERRA','2.7 EXCAVACION PARA VIGAS DE FUNDACION','C','Fundaciones','CS','Superficiales'),
    ('2. MOVIMIENTO DE TIERRA','2.8 EXCAVACION PARA SOTANOS','A','Acondicionamiento del terreno','AD','Movimiento de tierras en edificación'),
    ('2. MOVIMIENTO DE TIERRA','2.9 ZANJAS PARA CIMIENTOS DE MURO','C','Fundaciones','CS','Superficiales'),
    ('2. MOVIMIENTO DE TIERRA','2.10 RELLENO DE BASES','C','Fundaciones','CS','Superficiales'),
    ('2. MOVIMIENTO DE TIERRA','2.11 RETIRO DE TIERRA DENTRO DEL PREDIO','A','Acondicionamiento del terreno','AD','Movimiento de tierras en edificación'),
    ('2. MOVIMIENTO DE TIERRA','2.12 RETIRO DE TIERRA CON CAMION','A','Acondicionamiento del terreno','AD','Movimiento de tierras en edificación'),
    ('2. MOVIMIENTO DE TIERRA','2.13 CAJA PARA PAVIMENTOS','A','Acondicionamiento del terreno','AM','Mejoras del terreno'),
    ('3. ESTRUCTURA RESISTENTE','3.1 DE HORMIGON ARMADO','E','Estructuras','EH','Hormigón armado'),
    ('3. ESTRUCTURA RESISTENTE','3.2 DE HORMIGON ARMADO A LA VISTA','E','Estructuras','EH','Hormigón armado'),
    ('3. ESTRUCTURA RESISTENTE','3.3 DE HORMIGON ARMADO PREMOLDEADO','E','Estructuras','EP','Hormigón prefabricado'),
    ('3. ESTRUCTURA RESISTENTE','3.4 DE H° PREMOLDEADO GRANDES LUCES','E','Estructuras','EP','Hormigón prefabricado'),
    ('3. ESTRUCTURA RESISTENTE','3.5 DE VIGUETAS DE H° PREMOLDEADO','E','Estructuras','EP','Hormigón prefabricado'),
    ('3. ESTRUCTURA RESISTENTE','3.6 METALICA','E','Estructuras','EA','Acero'),
    ('3. ESTRUCTURA RESISTENTE','3.7 MADERA','E','Estructuras','EM','Madera'),
    ('3. ESTRUCTURA RESISTENTE','3.8 MIXTOS','E','Estructuras','EX','Mixtas'),
    ('3. ESTRUCTURA RESISTENTE','3.9 OTRAS','E','Estructuras','EW','Elementos especiales'),
    ('4. MAMPOSTERIA','4.1 DE LADRILLOS COMUNES','F','Fachadas y tabiques','FF','Fábrica no estructural'),
    ('4. MAMPOSTERIA','4.2 DE LADRILLOS A LA VISTA','F','Fachadas y tabiques','FF','Fábrica no estructural'),
    ('4. MAMPOSTERIA','4.3 DE LADRILLOS CERAMICOS HUECOS','F','Fachadas y tabiques','FI','Particiones ligeras'),
    ('4. MAMPOSTERIA','4.4 DE LADRILLOS CERAMICOS HUECOS PORTANTES','F','Fachadas y tabiques','FE','Fábrica estructural'),
    ('4. MAMPOSTERIA','4.5 DE BLOQUE DE HORMIGON','F','Fachadas y tabiques','FF','Fábrica no estructural'),
    ('4. MAMPOSTERIA','4.6 DE BLOQUE DE HORMIGON ROCA','F','Fachadas y tabiques','FF','Fábrica no estructural'),
    ('4. MAMPOSTERIA','4.7 DE LADRILLOS ENCOFRANTES (EPS)','F','Fachadas y tabiques','FB','Tabiquería de entramado autoportante'),
    ('4. MAMPOSTERIA','4.8 DE LADRILLOS REFRACTARIOS','E','Estructuras','EF','Fábrica'),
    ('4. MAMPOSTERIA','4.9 DE PIEDRA','E','Estructuras','EC','Cantería'),
    ('4. MAMPOSTERIA','4.10 DE VIDRIO','F','Fachadas y tabiques','FU','Cerramientos acristalados y particiones acristaladas'),
    ('4. MAMPOSTERIA','4.11 CORDONES','H','Remates y ayudas','HR','Remates de fachada'),
    ('5. CAPAS AISLADORAS','5.1 HIDROFUGAS','N','Aislamientos e impermeabilizaciones','NI','Impermeabilizaciones'),
    ('5. CAPAS AISLADORAS','5.2 TERMICAS','N','Aislamientos e impermeabilizaciones','NK/NR/NV','Aislamientos térmicos'),
    ('5. CAPAS AISLADORAS','5.3 TERMOACUSTICAS','N','Aislamientos e impermeabilizaciones','NB/NT','Aislamientos acústicos / Acondicionamiento acústico'),
    ('6. CUBIERTAS','6.1 DE TEJAS CERAMICAS','Q','Cubiertas','QT','Inclinadas'),
    ('6. CUBIERTAS','6.2 DE CHAPAS','Q','Cubiertas','QT','Inclinadas'),
    ('6. CUBIERTAS','6.3 DE VIDRIO','Q','Cubiertas','QL','Lucernarios'),
    ('6. CUBIERTAS','6.4 AZOTEA INACCESIBLE COMPLETA','Q','Cubiertas','QD','Planas no transitables, no ventiladas'),
    ('6. CUBIERTAS','6.5 AZOTEA ACCESIBLE COMPLETA','Q','Cubiertas','QA','Planas transitables, no ventiladas'),
    ('7. REVOQUES','7.1 GRUESOS','R','Revestimientos y trasdosados','RP','Conglomerados tradicionales'),
    ('7. REVOQUES','7.2 FINOS','R','Revestimientos y trasdosados','RP','Conglomerados tradicionales'),
    ('7. REVOQUES','7.3 COMPLETOS','R','Revestimientos y trasdosados','RB','Morteros industriales para revoco y enlucido'),
    ('7. REVOQUES','7.4 DE FRENTES','R','Revestimientos y trasdosados','RF','Pinturas en paramentos exteriores'),
    ('7. REVOQUES','7.5 PROYECTABLES','R','Revestimientos y trasdosados','RU','Sistemas de revestimiento con morteros industriales'),
    ('7. REVOQUES','7.6 CIELORRASOS','R','Revestimientos y trasdosados','RT','Falsos techos en interiores'),
    ('8. YESERIA','8.1-8.8 Cielorrasos, Vigas, Taparrollos, Molduras…','R','Revestimientos y trasdosados','RT/RD','Falsos techos en interiores / Decorativos'),
    ('8. YESERIA','8.9 PLACAS DE YESO (Durlock o similar)','F','Fachadas y tabiques','FT','Sistemas de tabiquería'),
    ('8. YESERIA','8.10 PANELES PREMOLDEADOS DE YESO','R','Revestimientos y trasdosados','RT','Falsos techos en interiores'),
    ('9. CIELORRASOS INDEPENDIENTES','9.1-9.7 Termoacúst., Metálicos, Aluminio, Madera, Tela, Yeso, PVC','R','Revestimientos y trasdosados','RT','Falsos techos en interiores'),
    ('10. CONTRAPISOS','10.1-10.4 Hormigón cascotes, Arcilla expandida, Celular, Carpetas','R','Revestimientos y trasdosados','RS','Pavimentos'),
    ('11. PISOS','11.1 DE MOSAICOS GRANITICOS','R','Revestimientos y trasdosados','RS','Pavimentos'),
    ('11. PISOS','11.2-11.5 Calcáreos, Cerámico, Porcelanatto, Cemento','R','Revestimientos y trasdosados','RS','Pavimentos'),
    ('11. PISOS','11.6-11.8 Madera, Piedras naturales, Mármoles','R','Revestimientos y trasdosados','RS','Pavimentos'),
    ('11. PISOS','11.8-11.13 Goma, PVC, Epóxido, Metálicos, Alfombras','R','Revestimientos y trasdosados','RS','Pavimentos'),
    ('11. PISOS','11.14 DE VIDRIO','R','Revestimientos y trasdosados','RV','Vidrios'),
    ('12. ZOCALOS','12.1-12.9 Graníticos, Calcáreos, Cemento, Madera, Piedra, Mármol, Plástico, Goma','R','Revestimientos y trasdosados','RE','Peldaños'),
    ('13. REVESTIMIENTOS','13.1-13.3 Azulejos, Cerámico, Porcelanatto','R','Revestimientos y trasdosados','RA','De piezas rígidas en paramentos verticales'),
    ('13. REVESTIMIENTOS','13.4-13.10 Cemento, Madera, Piedra, PVC, Plástico continuo, Placas, Papel','R','Revestimientos y trasdosados','RA','De piezas rígidas en paramentos verticales'),
    ('14. ESCALERAS','14.1-14.7 Cerámico, Porcelanatto, Cemento, Madera, Mármol, Goma, H° premoldeado','S','Señalización y equipamiento','SE','Escaleras prefabricadas'),
    ('14. ESCALERAS','14.7 Solías / 14.8 Umbral / 14.9 Antepechos','R','Revestimientos y trasdosados','RE','Peldaños'),
    ('15. CONDUCTOS Y VENTILACIONES','15.1 CONDUCTOS','I','Instalaciones','IV','Ventilación'),
    ('15. CONDUCTOS Y VENTILACIONES','15.2 VENTILACIONES','I','Instalaciones','IV','Ventilación'),
    ('16. CARPINTERIA DE MADERA','16.1-16.9 Puertas, P.Ventanas, Portones, Ventanas, Postigones, Cortinas, Barandas, Herrajes','L','Carpintería, placares, herrería, vidrios y prot. solares','LC/LP/LE','Carpintería / Puertas interiores / Puertas de entrada'),
    ('17. CARPINTERIA METALICA Y HERRERIA','17.1-17.9 Puertas, Portones, Barandas, Herrajes…','L','Carpintería, placares, herrería, vidrios y prot. solares','LC/LG/LI','Carpintería / Puertas de garaje / Uso industrial'),
    ('18. CARPINTERIA DE ALUMINIO','18.1-18.9 Puertas, Ventanas, Portones, Cortinas, Herrajes…','L','Carpintería, placares, herrería, vidrios y prot. solares','LC','Carpintería'),
    ('19. CARPINTERIA DE PVC','19.1-19.7 Puertas, Ventanas, Cortinas, Herrajes…','L','Carpintería, placares, herrería, vidrios y prot. solares','LC','Carpintería'),
    ('20. CARPINTERIA COMBINADA','20.1-20.10 Puertas, Ventanas, Portones, Frente roperos, Barandas, Herrajes…','L','Carpintería, placares, herrería, vidrios y prot. solares','LC/LA','Carpintería / Placares'),
    ('21. AMOBLAMIENTOS','21.1 DE COCINA','S','Señalización y equipamiento','SC','Cocinas/galerías'),
    ('21. AMOBLAMIENTOS','21.2 DE BAÑO','S','Señalización y equipamiento','SM','Baños'),
    ('21. AMOBLAMIENTOS','21.3 OTROS','S','Señalización y equipamiento','SZ','Zonas comunes'),
    ('22. INSTALACION ELECTRICA','22.1-22.5 Alimentación, Tableros, Bocas, Baja Tensión…','I','Instalaciones','IE','Eléctricas'),
    ('22. INSTALACION ELECTRICA','22.6 ARTEFACTOS (luminarias)','I','Instalaciones','II','Iluminación'),
    ('23. INSTALACION OBRAS SANITARIAS','23.1 AGUA FRIA Y CALIENTE','I','Instalaciones','IF','Fontanería'),
    ('23. INSTALACION OBRAS SANITARIAS','23.2 CLOACA PRIMARIA Y SECUNDARIA','I','Instalaciones','IS','Evacuación de aguas'),
    ('23. INSTALACION OBRAS SANITARIAS','23.3 DESAGUES INDUSTRIALES','I','Instalaciones','IS','Evacuación de aguas'),
    ('23. INSTALACION OBRAS SANITARIAS','23.4 PLUVIALES','I','Instalaciones','IS','Evacuación de aguas'),
    ('23. INSTALACION OBRAS SANITARIAS','23.5 ARTEFACTOS SANITARIOS','S','Señalización y equipamiento','SA','Aparatos sanitarios'),
    ('23. INSTALACION OBRAS SANITARIAS','23.6 BRONCERIAS','S','Señalización y equipamiento','SG','Griferías'),
    ('24. INSTALACION DE GAS','24.1-24.5 Alimentación, Cañería, Artefactos','I','Instalaciones','IG','Gases combustibles'),
    ('25. INSTALACION DE CALEFACCION','25.1-25.4 Cañería, Colector, Artefactos, Puesta en marcha','I','Instalaciones','IC','Calefacción, refrigeración, climatización y A.C.S.'),
    ('26. INSTALACION DE AIRE ACONDICIONADO','26.1-26.3 Equipos, Conductos, Puesta en marcha','I','Instalaciones','IB','Sistemas de climatización'),
    ('27. INSTALACION DE AIRE COMPRIMIDO','27.1-27.3 Equipos, Cañería, Puesta en marcha','I','Instalaciones','IX','Aire comprimido y gases medicinales'),
    ('28. INSTALACION CONTRA INCENDIO','28.1-28.5 Equipos, Cañería, Matafuegos, Puesta en marcha','I','Instalaciones','IO','Contra incendios'),
    ('29. ASCENSORES Y MONTACARGAS','29.1-29.3 Normales, Hidráulicos, Puesta en marcha','I','Instalaciones','IT','Transporte'),
    ('30. VIDRIOS','30.1-30.4 Float, Cristales, Espejos, Policarbonatos','L','Carpintería, placares, herrería, vidrios y prot. solares','LV','Vidrios'),
    ('31. PINTURA','31.1/31.3 Paredes y Cielorrasos Interiores','R','Revestimientos y trasdosados','RI','Pinturas en paramentos interiores'),
    ('31. PINTURA','31.2/31.4 Paredes y Cielorrasos Exteriores','R','Revestimientos y trasdosados','RF','Pinturas en paramentos exteriores'),
    ('31. PINTURA','31.5 CARPINTERIA METALICA','R','Revestimientos y trasdosados','RN','Pinturas sobre soporte metálico'),
    ('31. PINTURA','31.6 CARPINTERIA DE MADERA','R','Revestimientos y trasdosados','RM','Pinturas y tratamientos sobre soporte de madera'),
    ('31. PINTURA','31.7 VARIOS','R','Revestimientos y trasdosados','RO','Pinturas para uso específico'),
    ('32. MARMOLERIA','32.1 DE PIEDRAS NATURALES','R','Revestimientos y trasdosados','RA/RS','De piezas rígidas en paramentos / Pavimentos'),
    ('32. MARMOLERIA','32.2 MARMOLES','R','Revestimientos y trasdosados','RA/RS','De piezas rígidas en paramentos / Pavimentos'),
    ('32. MARMOLERIA','32.3 TRASFOROS','R','Revestimientos y trasdosados','RA','De piezas rígidas en paramentos verticales'),
    ('33. OBRAS VARIAS','33.1 AYUDA DE GREMIO','H','Remates y ayudas','HY','Ayudas de albañilería'),
    ('33. OBRAS VARIAS','33.2-33.5 Estufas, Equipamiento especial, Herramientas','S','Señalización y equipamiento','SS','Seguridad'),
    ('34. DERECHOS Y SEGUROS','34.1 SEGUROS','Y','Seguridad y salud','YI','Equipos de protección individual'),
    ('35. OTROS GASTOS','35.1 LIMPIEZAS','G','Gestión de residuos','GC','Tratamientos previos de los residuos'),
    ('35. OTROS GASTOS','35.2 MOVIMIENTO PERSONAL / EQUIPOS','—','—','—','Sin equivalencia directa en Generador de Precios'),
    ('35. OTROS GASTOS','35.3 HONORARIOS Y DOCUMENTACION','—','—','—','Sin equivalencia directa en Generador de Precios'),
    ('35. OTROS GASTOS','35.4 VARIOS','—','—','—','Sin equivalencia directa en Generador de Precios'),
    ('SIN EQUIV. EN PROPIOS','U. Urbanización interior del lote','U','Urbanización interior del lote','UA/UC/UD/UI/UJ/UR/UP/US/UG/UV/UX/UM','Alcantarillado, Estacionamientos, Pistas deportivas, Iluminación ext., Jardinería, Riego, Piletas, Cerramientos exteriores, Veredas, Mobiliario urbano…'),
    ('SIN EQUIV. EN PROPIOS','Z. Rehabilitación energética','Z','Rehabilitación energética','ZF/ZB/ZV/ZR/ZT/ZH/ZC/ZI/ZE','Cerramientos verticales, Cubiertas, Calefacción/ACS, Iluminación, Instalaciones eléctricas'),
]

FILL_A = PatternFill('solid', start_color='EBF5FF')
FILL_B = PatternFill('solid', start_color='E2EFDA')
FILL_X = PatternFill('solid', start_color='FFF2CC')

prev_rubro = None
alt = 0
for i, row_data in enumerate(rows, start=5):
    rubro = row_data[0]
    if rubro != prev_rubro:
        alt = 1 - alt
        prev_rubro = rubro
    is_no_match = '—' in str(row_data[2]) or rubro == 'SIN EQUIV. EN PROPIOS'
    fill = FILL_X if is_no_match else (FILL_A if alt == 0 else FILL_B)
    for col, val in enumerate(row_data, start=1):
        c = ws.cell(row=i, column=col, value=val)
        c.font = Font(name='Arial', size=10, bold=(col == 1))
        c.fill = fill
        c.border = border
        c.alignment = Alignment(horizontal='left', vertical='center', wrap_text=True)
    ws.row_dimensions[i].height = 28

ws.freeze_panes = 'A5'

legend_row = len(rows) + 7
ws.merge_cells(f'A{legend_row}:F{legend_row}')
c = ws.cell(row=legend_row, column=1, value='LEYENDA')
c.font = Font(name='Arial', bold=True, size=10)
c.fill = PatternFill('solid', start_color='D9D9D9')
c.alignment = Alignment(horizontal='left', vertical='center')
c.border = border

legend_items = [
    (FILL_A, 'Grupo A — coincidencia directa o equivalente en Generador de Precios'),
    (FILL_B, 'Grupo B — coincidencia directa o equivalente en Generador de Precios'),
    (FILL_X, 'Sin equivalencia directa — ítem sin capítulo correspondiente en CYPE / o capítulo CYPE sin ítem en Propios'),
]
for j, (fill, text) in enumerate(legend_items, start=legend_row+1):
    ws.cell(row=j, column=1, value='').fill = fill
    ws.cell(row=j, column=1).border = border
    ws.merge_cells(f'B{j}:F{j}')
    c = ws.cell(row=j, column=2, value=text)
    c.font = Font(name='Arial', size=9, italic=True)
    c.alignment = Alignment(horizontal='left', vertical='center')

output = r'C:\Users\bruno\Desktop\Pichon\Mapping_Rubros.xlsx'
wb.save(output)
print('OK:', output)
