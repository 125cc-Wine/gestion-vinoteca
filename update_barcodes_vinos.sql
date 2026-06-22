-- Actualizar codigo_barras en vinos existentes (sin tocar precios ni stock)
-- Solo actualiza si el producto ya existe en la tabla y no tiene barcode asignado

UPDATE productos SET codigo_barras = '894190055236'
WHERE nombre = 'Tinto Negro Limestone Block (P16)' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '894190055168'
WHERE nombre = 'Tinto Negro Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '894190055090'
WHERE nombre = 'Tinto Negro Sangiovese' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '891518001241'
WHERE nombre = 'Marchiori & Barraud Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '891518001234'
WHERE nombre = 'Marchiori & Barraud Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '877046001700'
WHERE nombre = 'Dorado Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '876155000314'
WHERE nombre = 'Gouguenheim Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '875210000030'
WHERE nombre = 'Rosell Boher Brut' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '859481003754'
WHERE nombre = 'Zaha Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '859481003624'
WHERE nombre = 'Teho Corte' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '859481003556'
WHERE nombre = 'Zaha Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '859481003419'
WHERE nombre = 'Tapiz Alta Collection Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '859481003402'
WHERE nombre = 'Tapiz Alta Collection Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '859481003150'
WHERE nombre = 'Manos Negras Quimay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '859481003082'
WHERE nombre = 'Anko Torrontes Los Cardones' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '859481003075'
WHERE nombre = 'Anko Flor de Cardón Malbec Cardones' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '859481003068'
WHERE nombre = 'Anko Malbec Los Cardones' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '852282002933'
WHERE nombre = 'Manos Negras Red Soil Pinot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '852282002926'
WHERE nombre = 'Manos Negras Stone Soil (P16)' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '852282002902'
WHERE nombre = 'Zaha Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '852282002896'
WHERE nombre = 'Teho Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '852282002780'
WHERE nombre = 'Lamadrid Reserva Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '852282002711'
WHERE nombre = 'Manos Negras Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '852282002360'
WHERE nombre = 'Manos Negras Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '852282002353'
WHERE nombre = 'Manos Negra Atrevida' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '852282002308'
WHERE nombre = 'Lamadrid Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '852282002292'
WHERE nombre = 'Lamadrid Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '852282002285'
WHERE nombre = 'Lamadrid Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '852282002094'
WHERE nombre = 'Lamadrid Gran Reserva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '852282002087'
WHERE nombre = 'Lamadrid Reserva Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '852282002063'
WHERE nombre = 'Lamadrid Reserva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '8410036009496'
WHERE nombre = 'Freixenet 200 Cc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '8410036009090'
WHERE nombre = 'Freixenet Cordon Negro' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '8410023000284'
WHERE nombre = 'Beronia Viura' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '8410013009761'
WHERE nombre = 'Anna Codorníu' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '835603001174'
WHERE nombre = 'Tikal Patriota Mal-Bon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '814876010090'
WHERE nombre = 'Chento Malbec Cuarto Dominio' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '814876010069'
WHERE nombre = 'Tolentino Pinot Gris Cuarto Dominio' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '8148760100522'
WHERE nombre = 'Tolentino Malbec Cuarto Dominio' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '814876010014'
WHERE nombre = 'Lote 44 Malbec Cuarto Dominio' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '814181010037'
WHERE nombre = 'Aguijon de Abeja Chardonnay-Semillon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '814181010020'
WHERE nombre = 'Durigutti Hd Rva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '814181010013'
WHERE nombre = 'Durigutti Hd Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '813198207263'
WHERE nombre = 'Bad Brother Mataca A. Lanús' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '810499010110'
WHERE nombre = 'Lamadrid Reserva Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '810499010011'
WHERE nombre = 'Matilde Lamadrid' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '8002062001607'
WHERE nombre = 'Masi Passo Doble Malbec Corvina' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '798190188164'
WHERE nombre = 'Flor de Manzano Champenoise' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '798190182742'
WHERE nombre = 'Flor de Manzano Demi Sec 710' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '798190152691'
WHERE nombre = 'Aguayo Malbec A. Lanús' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '798190101187'
WHERE nombre = 'Bad Brother Facón Tannat A. Lanús' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '798190101149'
WHERE nombre = 'Sunal Salvaje Pucará Malbec A. Lanús' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '798190101132'
WHERE nombre = 'Bad Brother Facón Cab. Franc A. Lanús' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7804303555037'
WHERE nombre = 'Kaiken Ultra Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7804303555020'
WHERE nombre = 'Kaiken Ultra Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7804303555013'
WHERE nombre = 'Kaiken Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7804303555006'
WHERE nombre = 'Kaiken Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7804303002524'
WHERE nombre = 'Kaiken Disobedience' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7804303002463'
WHERE nombre = 'Indomito Cabernet Franc Kaiken' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7804303002456'
WHERE nombre = 'Indomito Blend Kaiken' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7804303002302'
WHERE nombre = 'Kaiken Aventura Malbec Valle de Canota' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7804303002296'
WHERE nombre = 'Kaiken Aventura Malbec Los Chacayes Sur' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7804303002289'
WHERE nombre = 'Kaiken Aventura Malbec Los Chacayes Norte' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7804303002210'
WHERE nombre = 'Kaiken Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7804303002203'
WHERE nombre = 'Kaiken Ultra Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7804303001657'
WHERE nombre = 'Kaiken Ultra Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7804303001640'
WHERE nombre = 'Kaiken  White Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7804303001633'
WHERE nombre = 'Kaiken Brut Rose' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7804303000803'
WHERE nombre = 'Kaiken Obertura' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7804303000599'
WHERE nombre = 'Kaiken Terroir Sauvignon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7804303000384'
WHERE nombre = 'Kaiken Ultra Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7804303000322'
WHERE nombre = 'Kaiken Corte Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7804303000315'
WHERE nombre = 'Kaiken Brut' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7804303000292'
WHERE nombre = 'Kaiken Mai' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7804303000247'
WHERE nombre = 'Kaiken Corte Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7804303000124'
WHERE nombre = 'Kaiken Rose' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '77998125639399'
WHERE nombre = 'Mendel Petit Verdot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '779926001103'
WHERE nombre = 'Finca Ferrer Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '779856540022'
WHERE nombre = 'Ricominciare Altisimo Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '779838220256'
WHERE nombre = 'Sur de Los Andes Rva Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798374830073'
WHERE nombre = 'Alta-Yarí Gran Corte' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798353048888'
WHERE nombre = 'Vito Corleone Blend Mastrantonio' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798353048871'
WHERE nombre = 'Vito Corleone Malbec Mastrantonio' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798348710752'
WHERE nombre = 'Comahue Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798348710721'
WHERE nombre = 'Comahue Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798348710691'
WHERE nombre = 'Comahue Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798344040273'
WHERE nombre = 'Bonomo Montiel Dulce' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798314100075'
WHERE nombre = 'Casa Petrini Roca Volcánica' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798314100068'
WHERE nombre = 'Casa Petrini Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798309480014'
WHERE nombre = 'Peer Sidra de Pera' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798296330057'
WHERE nombre = 'Sposato Fresh Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798296330040'
WHERE nombre = 'Sposato Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798287390329'
WHERE nombre = 'Callejón  Del Crimen Rva Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798287390084'
WHERE nombre = 'Callejón Rva Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798287390039'
WHERE nombre = 'Callejón Del Crimen Gran Rva Petit (P17)' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798287390015'
WHERE nombre = 'Callejón Del Crimen Gran Rva Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798285330013'
WHERE nombre = 'Tajungapul' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798269720106'
WHERE nombre = 'Hey Rosé' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798260190144'
WHERE nombre = 'Vallisto Barbera' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798260190137'
WHERE nombre = 'Vallisto Criolla' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798254870021'
WHERE nombre = 'Collovati Castore Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798254870014'
WHERE nombre = 'Collovati Castore Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798198100116'
WHERE nombre = 'S. Uco Calcáreo Coluvio' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798198100109'
WHERE nombre = 'S. Uco Calcáreo Rio Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '779819810010'
WHERE nombre = 'S. Uco Calcáreo Granito' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798193470108'
WHERE nombre = 'El Presentador Malbec Wine & Circo' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798191780018'
WHERE nombre = 'Finca Ambrosia Malbec V. Unica' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798187890455'
WHERE nombre = 'Alchimia Gran Rva Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798187890400'
WHERE nombre = 'Alchimia Gran Rva. Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798187890363'
WHERE nombre = 'Alchimia Lujo Moderno Petit Verdot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798187890301'
WHERE nombre = 'Alchimia Lujo Moderno Red Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798187890240'
WHERE nombre = 'Alchimia Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798187890189'
WHERE nombre = 'Alchimia Limited Edition Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798187890172'
WHERE nombre = 'Alchimia Lujo Moderno Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798187890011'
WHERE nombre = 'Alchimia Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798187710166'
WHERE nombre = 'Exupery Blend Reinero' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798187710111'
WHERE nombre = 'Exupery Malbec Reinero' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798187710104'
WHERE nombre = 'Reinero Reserva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798187710029'
WHERE nombre = 'Nazareno Cabernet Sauvignon Reinero' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798187710012'
WHERE nombre = 'Nazareno Malbec Reinero' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798187140024'
WHERE nombre = 'Zorro y Arena Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798187140017'
WHERE nombre = 'Zorro y Arena Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798185960648'
WHERE nombre = 'Martir Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798185960631'
WHERE nombre = 'Martir Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798185960549'
WHERE nombre = 'Manos Negras Blend Blancas' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798185960501'
WHERE nombre = 'Manos Negras Artesanos Pinot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798185960495'
WHERE nombre = 'Zaha Marsanne' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798185960488'
WHERE nombre = 'Manos Negras Artesano Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798185960471'
WHERE nombre = 'Estancia Los Cardones Garnacha' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798185960440'
WHERE nombre = 'Desquiciado Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798185960426'
WHERE nombre = 'Desquiciado Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '779818596042'
WHERE nombre = 'Desquiciado Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798185960419'
WHERE nombre = 'Zaha Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798185960402'
WHERE nombre = 'Manos Negras Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798185960389'
WHERE nombre = 'Estancia Los Cardones Tigerstone' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798185960105'
WHERE nombre = 'Manos Negras Espumante' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798184350037'
WHERE nombre = 'Finca La Igriega Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798183210417'
WHERE nombre = 'Miras Brut Nature' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798183210301'
WHERE nombre = 'Miras Jovem Trousseau Nouveau' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798183210165'
WHERE nombre = 'Miras Jovem Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798183210134'
WHERE nombre = 'Miras Jovem Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798183210103'
WHERE nombre = 'Miras Jovem Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798181810251'
WHERE nombre = 'Aniello Soil Pinot Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798181810213'
WHERE nombre = 'Aniello 003 Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798181810077'
WHERE nombre = 'Aniello Soil Corte de Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798181810060'
WHERE nombre = 'Aniello Soil Corte de Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798181810053'
WHERE nombre = 'Aniello Soil Rose Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798181810046'
WHERE nombre = 'Aniello 006 Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798181810039'
WHERE nombre = 'Aniello 006 Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798181810022'
WHERE nombre = 'Aniello 006 Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798181810015'
WHERE nombre = 'Aniello 006 Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798173339654'
WHERE nombre = 'Mastrantonio 63 Gran Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798173339647'
WHERE nombre = 'Mastrantonio 63 Premium Red Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798173339630'
WHERE nombre = 'Mastrantonio 63  Premium Petit Verdot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798173339623'
WHERE nombre = 'Mastrantonio 63 Premium Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798173339616'
WHERE nombre = 'Mastrantonio 63 Premium Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798173337315'
WHERE nombre = 'D.J. Mastrantonio Red Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798173337308'
WHERE nombre = 'D. J. Mastrantonio Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798172810666'
WHERE nombre = 'Cruzat Cosecha Temprana Rosé Eb' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798172810611'
WHERE nombre = 'Cruzat Naranjo' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798172810581'
WHERE nombre = 'Cruzat Pet Nat Rose' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798172810574'
WHERE nombre = 'Cruzat Pet Nat Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798172810321'
WHERE nombre = 'Cruzat Millésime' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798172810253'
WHERE nombre = 'Cruzat Premier Demi Sec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798172810130'
WHERE nombre = 'Cruzat Premier Rose' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798172810123'
WHERE nombre = 'Cruzat Premier Extra Brut' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798172810031'
WHERE nombre = 'Cruzat Reserva Nature' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798172810024'
WHERE nombre = 'Cruzat Reserva Rose' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798172810017'
WHERE nombre = 'Cruzat Reserva Extra Brut' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798172190089'
WHERE nombre = 'Amaicha Tinto' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798171780056'
WHERE nombre = 'Finca Ambrosia Cab. Sau. V. Unica' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798163850121'
WHERE nombre = 'Venerable Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798163850114'
WHERE nombre = 'Venerable Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798163850107'
WHERE nombre = 'Venerable Tempranillo' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798163850084'
WHERE nombre = 'Venerable Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798162670201'
WHERE nombre = 'Sin Palabras Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798162670133'
WHERE nombre = 'Sin Palabras Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798162670089'
WHERE nombre = 'La Primavera Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798162670010'
WHERE nombre = 'La Primavera Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798161860030'
WHERE nombre = 'Castillejo Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798161860023'
WHERE nombre = 'Castillejo Torrontes' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798161860016'
WHERE nombre = 'Castillejo Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798161580198'
WHERE nombre = 'Montechez Limited Edition Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798161580082'
WHERE nombre = 'Vivo Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798161580068'
WHERE nombre = 'Montechez Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798161580020'
WHERE nombre = 'Montechez Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798161580013'
WHERE nombre = 'Montechez Limited Edition Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798161500011'
WHERE nombre = 'Penitente Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798161180640'
WHERE nombre = 'Malbecaster' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798161180015'
WHERE nombre = 'Mp Sol Fa Sol Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798160140140'
WHERE nombre = 'Nahuel Martinez Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798160140119'
WHERE nombre = 'Nahuel Martinez Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798159947057'
WHERE nombre = 'Contra Viento Fuego Blanco' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798159946104'
WHERE nombre = 'Fuego Blanco Nature' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798159946067'
WHERE nombre = 'Fuego Blanco Gewürztraminer' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798159945008'
WHERE nombre = 'Fuego Blanco Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798159944995'
WHERE nombre = 'Fuego Blanco Sauvignon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798159944711'
WHERE nombre = 'Fuego Blanco Cf-Mb' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798159944704'
WHERE nombre = 'Fuego Blanco Mb-Sy' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798159240769'
WHERE nombre = 'Bonnie And Clyde Blend de Tintas' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798159240752'
WHERE nombre = 'Bonnie And Clyde Blend de Blancas' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798159240745'
WHERE nombre = 'Bonnie And Clyde Moscatel' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798159240738'
WHERE nombre = 'Bonnie And Clyde Orange' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798159240707'
WHERE nombre = 'Estrella de Los Andes Tempranillo' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798159240073'
WHERE nombre = 'Estrella de Los Andes Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798159240066'
WHERE nombre = 'Estrella de Los Andes Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798157420057'
WHERE nombre = 'Las Nencias Reserve Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798157420040'
WHERE nombre = 'Las Nencias Family Selection' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798156540107'
WHERE nombre = 'Ricominciare Codice Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798156540091'
WHERE nombre = 'Ricominciare Altisimo Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798156540084'
WHERE nombre = 'Ricominciare Camporotondo' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798156540060'
WHERE nombre = 'Ricominciare Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798156540039'
WHERE nombre = 'Ricominciare Malbec Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798156540015'
WHERE nombre = 'Ricominciare Altisimo Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798156370247'
WHERE nombre = 'Tukma 2670 Sauvignon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798156370209'
WHERE nombre = 'Tukma Gran Corte (P16b)' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798156370162'
WHERE nombre = 'Tukma Tardio' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798156370155'
WHERE nombre = 'Tukma  Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798156370117'
WHERE nombre = 'Tukma Gran Torrontes' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798156370094'
WHERE nombre = 'Tukma Torrontes' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798156370070'
WHERE nombre = 'Tukma Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798155010762'
WHERE nombre = 'Eh 19 Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798155010731'
WHERE nombre = 'Eh 19 Torrontes' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798155010700'
WHERE nombre = 'Via Blanca Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798155010670'
WHERE nombre = 'Via Blanca Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798155010649'
WHERE nombre = 'Via Blanca Syrah Rose' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798155010588'
WHERE nombre = 'Iaccarini Via Blanca Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798155010496'
WHERE nombre = 'Eh 19 Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798155010250'
WHERE nombre = 'Via Blanca Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798155010229'
WHERE nombre = 'Via Blanca Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798155010199'
WHERE nombre = 'Iaccarini Via Blanca Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798155010168'
WHERE nombre = 'Iaccarini Via Blanca Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798155010137'
WHERE nombre = 'Iaccarini Via Blanca Cab. Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798153690089'
WHERE nombre = 'Adrian Rio Family Barrel' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798153600194'
WHERE nombre = 'Prisionero Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798152270312'
WHERE nombre = 'Giramundo Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798152262935'
WHERE nombre = 'Durigutti Pie de Monte Zarlenga' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798152262911'
WHERE nombre = 'Durigutti Pie de Monte Las Jarillas' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798152262898'
WHERE nombre = 'Durigutti Pie de Monte Ruano' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798152261372'
WHERE nombre = 'Durigutti Hd Gran Rva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798152261341'
WHERE nombre = 'Durigutti Carmela Rva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798152261334'
WHERE nombre = 'Durigutti Reserva Petit Verdot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798152261327'
WHERE nombre = 'Durigutti Petit Verdot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798152261310'
WHERE nombre = 'Durigutti Viognier' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798152261037'
WHERE nombre = 'Durigutti Reserva Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798152261013'
WHERE nombre = 'Durigutti Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798152260948'
WHERE nombre = 'Durigutti Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798152260863'
WHERE nombre = 'Durigutti Reserva Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798152260771'
WHERE nombre = 'Durigutti Reserva Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798152260450'
WHERE nombre = 'Aguijon de Abeja Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798152260443'
WHERE nombre = 'Aguijon de Abeja Rose' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798152260412'
WHERE nombre = 'Aguijon de Abeja Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798152260375'
WHERE nombre = 'Durigutti Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798152260351'
WHERE nombre = 'Durigutti Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798152260214'
WHERE nombre = 'Aguijon de Abeja Torrontes' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798152260191'
WHERE nombre = 'Aguijon de Abeja Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798152260177'
WHERE nombre = 'Aguijon de Abeja Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798152260078'
WHERE nombre = 'Durigutti Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798150220210'
WHERE nombre = 'Urraca Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798150220203'
WHERE nombre = 'Urraca Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798150220197'
WHERE nombre = 'Urraca Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798150220159'
WHERE nombre = 'Urraca Primera Reserva' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798149280225'
WHERE nombre = 'Lassia Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798149280218'
WHERE nombre = 'Lassia Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798149280201'
WHERE nombre = 'Lassia Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798149280058'
WHERE nombre = 'Primogenito Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798149280041'
WHERE nombre = 'Primogenito Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798148940441'
WHERE nombre = 'Zorzal Terroir Único Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798148940045'
WHERE nombre = 'Zorzal Eggo Bonaparte 2017' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798148940021'
WHERE nombre = 'Zorzal Eggo Blanc 2020' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798148940014'
WHERE nombre = 'Zorzal Terroir Único Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798147550023'
WHERE nombre = 'De Angeles Malbec Roble' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798147550016'
WHERE nombre = 'De Angeles Malbec Sin Roble' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798146691697'
WHERE nombre = 'Zedryc Apple' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798146691215'
WHERE nombre = 'Tierra Del Fuego Tardío' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798146690676'
WHERE nombre = 'Red Lady' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798146690164'
WHERE nombre = 'Zedryc Juicy' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798146690157'
WHERE nombre = 'Zedryc Dry' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798146410397'
WHERE nombre = 'Sin Fin Interminable Blend Me-Pn-Sangio' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798146410380'
WHERE nombre = 'Sin Fin Gg Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798145640184'
WHERE nombre = 'Aguma Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798145640177'
WHERE nombre = 'Aguma Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798145640160'
WHERE nombre = 'Aguma Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798145640153'
WHERE nombre = 'Aguma Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798145640146'
WHERE nombre = 'Aguma Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798145640139'
WHERE nombre = 'Aguma Tannat' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798145640122'
WHERE nombre = 'Aguma Sauvignon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798145640115'
WHERE nombre = 'Aguma Carmenere' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798145640092'
WHERE nombre = 'Aguma Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798145640047'
WHERE nombre = 'Aguma Reserva Tannat' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798145640030'
WHERE nombre = 'Aguma Reserva Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798145640023'
WHERE nombre = 'Aguma Reserva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798145640016'
WHERE nombre = 'Aguma Reserva Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798145411081'
WHERE nombre = 'Bo Bó Zorrito Cabernet Sauvignon Trapezio' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798145411050'
WHERE nombre = 'Bo Bó Zorritos Malbec Trapezio' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798145410992'
WHERE nombre = 'Trapezio Vs Rose' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798145410961'
WHERE nombre = 'Trapezio Vs Sauvignon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798145410930'
WHERE nombre = 'Trapezio Vs Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798145410886'
WHERE nombre = 'Finca Trapezio Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798145410589'
WHERE nombre = 'Petit Bo Bó Sauvignon Blanc Trapezio' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798145410558'
WHERE nombre = 'Petit Bo Bó Chardonnay Trapezio' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798145410527'
WHERE nombre = 'Petit Bo Bó Trapezio' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798145410381'
WHERE nombre = 'Trapezio Vs Cab. Sauv.' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798145410374'
WHERE nombre = 'Trapezio Vs Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798145140509'
WHERE nombre = 'Felino Malbec Magnun' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798145140424'
WHERE nombre = 'Cocodrilo 2014' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798145140264'
WHERE nombre = 'Felino Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798145140202'
WHERE nombre = 'Felino Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798145140172'
WHERE nombre = 'Felino Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798145140141'
WHERE nombre = 'Bramare Appelation Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798145140110'
WHERE nombre = 'Bramare Appelation Lujan Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798145140059'
WHERE nombre = 'Bramare Marchiori Vineyard Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798143900792'
WHERE nombre = 'La Espera Malbec Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798141877638'
WHERE nombre = 'Eugenio Bustos Tardio' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798141877560'
WHERE nombre = 'Eugenio Bustos Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798141877386'
WHERE nombre = 'Eugenio Bustos Leyenda Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798141877362'
WHERE nombre = 'Eugenio Bustos Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798141877058'
WHERE nombre = 'La Celia Reserva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798141874101'
WHERE nombre = 'La Celia Elite Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798141871490'
WHERE nombre = 'La Celia Haritage Cab. Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798141180578'
WHERE nombre = 'Diamandina Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798141180523'
WHERE nombre = 'Diamandina Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798141180400'
WHERE nombre = 'Diamandes Viognier' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798141180370'
WHERE nombre = 'Diamandes Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798141180257'
WHERE nombre = 'Diamandes Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798140660712'
WHERE nombre = 'Mantra Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798140660484'
WHERE nombre = 'Mantra Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798140660385'
WHERE nombre = 'Mantra Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798140660361'
WHERE nombre = 'Mantra Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798139500401'
WHERE nombre = 'Quieto Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798139500302'
WHERE nombre = 'Quieto Reserva Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798139500043'
WHERE nombre = 'Quieto Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798139450539'
WHERE nombre = 'Caligiore Nature´S Legacy (P16b)' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798139450225'
WHERE nombre = 'Cuatro Vacas Rosado' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798139450072'
WHERE nombre = 'Cuatro Vacas Gordas Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798139450034'
WHERE nombre = 'Caligiore Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798139450010'
WHERE nombre = 'Caligiore Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798138550131'
WHERE nombre = 'Cavas San Julian Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798138550117'
WHERE nombre = 'Cavas San Julian Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798138550056'
WHERE nombre = 'Cavas San Julian Tardio' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798138550018'
WHERE nombre = 'Cavas San Julian Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798138220911'
WHERE nombre = 'Sur de Los Andes Rva Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798138220317'
WHERE nombre = 'Sur de Los Andes Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798136981722'
WHERE nombre = 'Amor Seco' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798136980725'
WHERE nombre = 'Barda Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798136980701'
WHERE nombre = 'Chacra 55 Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798136451133'
WHERE nombre = 'Samchen Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798136451126'
WHERE nombre = 'Samchen Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798136451119'
WHERE nombre = 'Samchen Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798136451102'
WHERE nombre = 'Cuvelier Rosé Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798136451041'
WHERE nombre = 'Cuvelier Los Andes Grand Vin' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798136450976'
WHERE nombre = 'Cuvelier Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798136450969'
WHERE nombre = 'Cuvelier Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798136450952'
WHERE nombre = 'Cuvelier Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798136450570'
WHERE nombre = 'Cuvelier Colección Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798136200342'
WHERE nombre = 'Riglos Gran Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798136200311'
WHERE nombre = 'Quinto Malbec Riglos' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798136200304'
WHERE nombre = 'Quinto Sauvignon Blanc Riglos' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798136200212'
WHERE nombre = 'Riglos Gran Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798136150869'
WHERE nombre = 'Lamadrid Zun Zun Tinto' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798136150685'
WHERE nombre = 'Lamadrid Zun Zun Rosado' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798136150616'
WHERE nombre = 'Lamadrid Gran Reserva Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798136150586'
WHERE nombre = 'Lamadrid Gran Reserva Cab Sau' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798136150548'
WHERE nombre = 'Begani Premium Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798136150074'
WHERE nombre = 'Lamadrid Begani Special Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798133540540'
WHERE nombre = 'Ave Riserva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798133540489'
WHERE nombre = 'Ave Premium Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798133540458'
WHERE nombre = 'Memento Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798133540151'
WHERE nombre = 'Ave Cesar Iulius' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798132917701'
WHERE nombre = 'Urban Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798132917688'
WHERE nombre = 'Urban Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798132170052'
WHERE nombre = 'Tercos Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798132170045'
WHERE nombre = 'Tercos Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798131240022'
WHERE nombre = 'Naiara' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798131240015'
WHERE nombre = 'Naiara Reserva' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798130460506'
WHERE nombre = 'Umbral Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798130460391'
WHERE nombre = 'Umbral Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798130150049'
WHERE nombre = 'Domiciano Barrancas Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798130150032'
WHERE nombre = 'Domiciano Barrancas Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798130150018'
WHERE nombre = 'Domiciano Barrancas Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798128819798'
WHERE nombre = 'Chañarmuyo Gran Vino Tannat' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798128819781'
WHERE nombre = 'Chañarmuyo Gran Vino Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798128819767'
WHERE nombre = 'Chañarmuyo Gran Vino Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798128819750'
WHERE nombre = 'Chañarmuyo Estate Cab Franc Cab Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798128819736'
WHERE nombre = 'Chañarmuyo Estate Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798128810399'
WHERE nombre = 'Keo Roble Tannat' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798128810115'
WHERE nombre = 'Revancha Rey Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798128520311'
WHERE nombre = 'Punta de Flechas Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798128520144'
WHERE nombre = 'Punta Flechas Corte' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798128520014'
WHERE nombre = 'Flecha de Los Andes Gran Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798127728527'
WHERE nombre = 'Punto Final Naranjo Renacer' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798127726752'
WHERE nombre = 'Punto Final Cab. Sauv. Renacer' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798127724758'
WHERE nombre = 'Milamore Renacer' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798127721757'
WHERE nombre = 'Punto Final Malbec Renacer' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798127720774'
WHERE nombre = 'Punto Final Rva. Cab. Franc Renacer' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798127631575'
WHERE nombre = 'Dorado Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798127631568'
WHERE nombre = 'Dorado Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798127631452'
WHERE nombre = 'Barrabás By Judas' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798127631360'
WHERE nombre = 'Sottano Tardio Torrontes' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798127631322'
WHERE nombre = 'Sottano Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798127630417'
WHERE nombre = 'Sottano Reserva Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798127630196'
WHERE nombre = 'Sottano Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798127630042'
WHERE nombre = 'Sottano Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798127630011'
WHERE nombre = 'Sottano Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '77981272810352'
WHERE nombre = 'Cruzat Premier Nature' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126790457'
WHERE nombre = 'Desierto 25 Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126790396'
WHERE nombre = 'Desierto Pampa Late Harvest' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126790389'
WHERE nombre = 'Desierto 25 Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126790303'
WHERE nombre = 'Desierto 25 Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126790280'
WHERE nombre = 'Desierto Pampa' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126790266'
WHERE nombre = 'Desierto 25 Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126790259'
WHERE nombre = 'Desierto 25 Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126790242'
WHERE nombre = 'Desierto 25 Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126790228'
WHERE nombre = 'Desierto 25 Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126450207'
WHERE nombre = 'Secreto Rose Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126450184'
WHERE nombre = 'Secreto Roble Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126450177'
WHERE nombre = 'Secreto Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126450160'
WHERE nombre = 'Secreto Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126450153'
WHERE nombre = 'Secreto Roble Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126450146'
WHERE nombre = 'Secreto Roble Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126271253'
WHERE nombre = 'J. Alberto' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126084198'
WHERE nombre = 'Mara de Uco Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126084181'
WHERE nombre = 'Mara de Uco Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126084112'
WHERE nombre = 'Omaggio Viognier Stella Crinita' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126084105'
WHERE nombre = 'Omaggio Cab. Franc Stella Crinita' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126083979'
WHERE nombre = 'Mara de Uco Petit Verdot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126083948'
WHERE nombre = 'Stella Crinita Barbera' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126083924'
WHERE nombre = 'Stella Crinita Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126083917'
WHERE nombre = 'Stella Crinita Petit Verdot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126083894'
WHERE nombre = 'Alma Negra Orange' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126083832'
WHERE nombre = 'Amici Miei Stella Crinita' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126083825'
WHERE nombre = 'Animal Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126083733'
WHERE nombre = 'Padrillos Magnun' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126083382'
WHERE nombre = 'Alma Negra By Liniers 3' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126083351'
WHERE nombre = 'Alma Negra By Liniers 1' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126083344'
WHERE nombre = 'Alma Negra By Liniers 2' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126083061'
WHERE nombre = 'Animal Extra Brut' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126082743'
WHERE nombre = 'Alma Negra Blend 500 Cc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126082644'
WHERE nombre = 'La Posta Fazzio' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126082415'
WHERE nombre = 'Gran Enemigo' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126082309'
WHERE nombre = 'La Posta Blanco' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126082248'
WHERE nombre = 'La Posta Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126081708'
WHERE nombre = 'Animal Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126081463'
WHERE nombre = 'Siesta Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126080985'
WHERE nombre = 'Mara de Uco Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126080954'
WHERE nombre = 'Padrillos Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126080800'
WHERE nombre = 'Alma Negra Sparkling Magnun' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126080695'
WHERE nombre = 'Alma Negra Sparkling' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126080534'
WHERE nombre = 'Padrillos Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126080459'
WHERE nombre = 'Animal Colours Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126080411'
WHERE nombre = 'Animal Rose' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126080251'
WHERE nombre = 'Luca Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126080237'
WHERE nombre = 'Luca Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126080213'
WHERE nombre = 'Luca Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126080077'
WHERE nombre = 'Siesta Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126080053'
WHERE nombre = 'Siesta Syrah 07' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798126080015'
WHERE nombre = 'Alma Negra Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798125860366'
WHERE nombre = 'Ciruelo Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798125639313'
WHERE nombre = 'Revancha Peon  Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798125638231'
WHERE nombre = 'Revancha Torre Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798125637722'
WHERE nombre = 'Lunta Torrontes Mendel' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798125637364'
WHERE nombre = 'Lunta Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798125636718'
WHERE nombre = 'Mendel Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798125635414'
WHERE nombre = 'Lunta Malbec Mendel' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798125634813'
WHERE nombre = 'Mendel Semillon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798125633410'
WHERE nombre = 'Mendel Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798125632819'
WHERE nombre = 'Mendel Unus' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798125631317'
WHERE nombre = 'Lunta Tempranillo' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798125630976'
WHERE nombre = 'Mendel Rosadia' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798125630815'
WHERE nombre = 'Mendel Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798125585306'
WHERE nombre = 'Decero Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798125585276'
WHERE nombre = 'Decero Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798125585245'
WHERE nombre = 'Decero Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124863306'
WHERE nombre = 'Tupun Extra Brut' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124861166'
WHERE nombre = 'Alma Austral Torrontes' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124861159'
WHERE nombre = 'Alma Austral Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124861050'
WHERE nombre = 'Laderas Reserva Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124861043'
WHERE nombre = 'Laderas Reserva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124861005'
WHERE nombre = 'Alma Austral Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124860794'
WHERE nombre = 'Tupun Reserva Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124860770'
WHERE nombre = 'Tupun Reserva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124860756'
WHERE nombre = 'Tupun Singular Tinto' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124860664'
WHERE nombre = 'Vulcano Cab Sau - Cab Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124860350'
WHERE nombre = 'Laderas Del Valle Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124860343'
WHERE nombre = 'Miss Charlen Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124860275'
WHERE nombre = 'Tupun Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124860268'
WHERE nombre = 'Tupun Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124860237'
WHERE nombre = 'Tupun Reserva Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124860206'
WHERE nombre = 'Tupun Reserva Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124860176'
WHERE nombre = 'Tupun Torrontes' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124860114'
WHERE nombre = 'Tupun Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124860060'
WHERE nombre = 'Cuño Blend 2011' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124860039'
WHERE nombre = 'Vulcano Malbec - Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124860015'
WHERE nombre = 'Tupun Reserva Viognier' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124702186'
WHERE nombre = 'Staphyle Premium Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124701417'
WHERE nombre = 'Staphyle Part. Ltda. Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124701400'
WHERE nombre = 'Staphyle Part. Ltda. Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124701394'
WHERE nombre = 'Staphyle Part. Ltda. Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124701219'
WHERE nombre = 'Staphyle Premium Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124700939'
WHERE nombre = 'Iris Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124700236'
WHERE nombre = 'Staphyle Premium Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124700014'
WHERE nombre = 'Vastago de Gea Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124150239'
WHERE nombre = 'Doña Silvina Petit Verdot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124150086'
WHERE nombre = 'Doña Silvina Rosado' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124150079'
WHERE nombre = 'Doña Silvina Fresh' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124150031'
WHERE nombre = 'Doña Silvina Reserva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798124150024'
WHERE nombre = 'Doña Silvina Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798123974331'
WHERE nombre = 'Las Perdices Gewurztraminer' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798123972436'
WHERE nombre = 'Las Perdices Ya Lo Sabes' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798123972207'
WHERE nombre = 'Las Perdices Ala Colorada Tannat' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798123972115'
WHERE nombre = 'Partridge Blend Las Perdices' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798123971545'
WHERE nombre = 'Las Perdices Exploracion Gualtallary' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798123971422'
WHERE nombre = 'Las Perdices Victimas Del Cielo' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798123971415'
WHERE nombre = 'Las Perdices Brindando Por Nada' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798123971408'
WHERE nombre = 'Las Perdices Exploracion Casablanca' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798123971392'
WHERE nombre = 'Las Perdices Exploracion La Consulta' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798123971347'
WHERE nombre = 'Las Perdices Explorarion Altamira' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798123971323'
WHERE nombre = 'Partridge Chardonnay Las Perdices' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798123971309'
WHERE nombre = 'Partridge Malbec Las Perdices' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798123971187'
WHERE nombre = 'Las Perdices Exploración Riesling' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798123971170'
WHERE nombre = 'Las Perdices Red Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798123971149'
WHERE nombre = 'Las Perdices Ala Colorada Petit Verdot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798123970692'
WHERE nombre = 'Las Perdices Ala Colorada Ancelota' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798123970616'
WHERE nombre = 'Las Perdices Bib Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798123970593'
WHERE nombre = 'Las Perdices Ala Colorada Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798123970432'
WHERE nombre = 'Las Perdices Reserva Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798123970425'
WHERE nombre = 'Las Perdices Reserva Sauvignon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798123970395'
WHERE nombre = 'Las Perdices Exploración Albariño' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798123970388'
WHERE nombre = 'Las Perdices Reserva Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798123970319'
WHERE nombre = 'Las Perdices Extra Brut' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798123970302'
WHERE nombre = 'Las Perdices Champenoise Rose' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798123970296'
WHERE nombre = 'Las Perdices Reserva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798123970265'
WHERE nombre = 'Las Perdices Reserva Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798123970234'
WHERE nombre = 'Las Perdices Champenoise Extra Brut' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798123970197'
WHERE nombre = 'Las Perdices Viognier' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798123970166'
WHERE nombre = 'Las Perdices Sauvignon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798123970111'
WHERE nombre = 'Las Perdices Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798123970098'
WHERE nombre = 'Las Perdices Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798121941236'
WHERE nombre = 'Tomero Cabernet Franc Vistalba' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798121940994'
WHERE nombre = 'Tomero S.V Malbec Vistalba' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798121940604'
WHERE nombre = 'Tomero S.V Syrah Vistalba' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798121940314'
WHERE nombre = 'Tomero Rose de Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798121940123'
WHERE nombre = 'Tomero Malbec Vistalba' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798121940109'
WHERE nombre = 'Tomero Sauvignon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798121940031'
WHERE nombre = 'Vistalba Corte C' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798121940024'
WHERE nombre = 'Vistalba Corte B' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '779812190130'
WHERE nombre = 'Tomero Cabernet Sauvignon Vistalba' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798121461031'
WHERE nombre = 'Aruma' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798121461000'
WHERE nombre = 'Caro' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798119440345'
WHERE nombre = 'Barrandica Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798119111542'
WHERE nombre = 'Qaramy Finca Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798119111504'
WHERE nombre = 'Qaramy 600' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798119111498'
WHERE nombre = 'Qaramy Alto Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798119111481'
WHERE nombre = 'Qaramy Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798119111184'
WHERE nombre = 'Qaramy Latido Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798119111160'
WHERE nombre = 'Qaramy Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798119110927'
WHERE nombre = 'Altocedro El Turco Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798119110880'
WHERE nombre = 'Alandes Paradoux Blend 4 Ed' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798119110286'
WHERE nombre = 'Abras Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798119110088'
WHERE nombre = 'Altocedro Consulta Select Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798119110064'
WHERE nombre = 'Altocedro Tempranillo' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798119110040'
WHERE nombre = 'Altocedro Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798119110033'
WHERE nombre = 'Vago Rojo' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798118771822'
WHERE nombre = 'Uruco Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798118771785'
WHERE nombre = 'El Peral Sauv. Blanc Uruco' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798118770160'
WHERE nombre = 'Uruco Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798118770054'
WHERE nombre = 'El Peral Chardonnay Uruco' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798118770047'
WHERE nombre = 'El Peral Merlot Uruco' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798118770030'
WHERE nombre = 'El Peral Malbec Uruco' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798118770023'
WHERE nombre = 'El Peral Cab. Sauv. Uruco' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798118770016'
WHERE nombre = 'El Peral Rva. Blend Uruco' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798118530146'
WHERE nombre = 'Don Maza' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798118530122'
WHERE nombre = 'Flm Coleccion Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798118530115'
WHERE nombre = 'Flm Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798118530085'
WHERE nombre = 'Flm Coleccion Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798118530078'
WHERE nombre = 'Flm Colección Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798118050736'
WHERE nombre = 'El Hijo Prodigo Tempranillo Barrica' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798117950013'
WHERE nombre = 'Finca Los Amaya' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798117479798'
WHERE nombre = 'Tamari Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798117479699'
WHERE nombre = 'Tamari Ar' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798117472591'
WHERE nombre = 'Tamari Reserva Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798117472553'
WHERE nombre = 'Tamari Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798117472515'
WHERE nombre = 'Tamari Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798117471532'
WHERE nombre = 'Tamari Reserva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798117470184'
WHERE nombre = 'Tamari Reserva Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116930306'
WHERE nombre = 'Monteagrelo Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116930092'
WHERE nombre = 'Monteagrelo Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116930016'
WHERE nombre = 'Bressia Profundo' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116662597'
WHERE nombre = 'Andeluna Malbec Rose' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116662337'
WHERE nombre = 'Andeluna Semillon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116662290'
WHERE nombre = 'Andeluna Raices Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116662207'
WHERE nombre = 'Andeluna Raices Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116660661'
WHERE nombre = 'Pasionado Malbec Andeluna' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116660425'
WHERE nombre = 'Andeluna 1300 Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116660418'
WHERE nombre = 'Andeluna 1300 Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116660258'
WHERE nombre = 'Andeluna 1300 Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116660210'
WHERE nombre = 'Pasionado Cabernet Franc Andeluna' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116660173'
WHERE nombre = 'Pasionado Cuatro Cepas Andeluna' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116660135'
WHERE nombre = 'Andeluna Altitud Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116660098'
WHERE nombre = 'Andeluna Altitud Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116660050'
WHERE nombre = 'Andeluna Altitud Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116660012'
WHERE nombre = 'Andeluna Altitud Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116540888'
WHERE nombre = 'Melipal Supernova' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116540260'
WHERE nombre = 'Melipal Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116540239'
WHERE nombre = 'Melipal Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116540086'
WHERE nombre = 'Ikela Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116540055'
WHERE nombre = 'Melipal Rose' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116540017'
WHERE nombre = 'Melipal Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116490015'
WHERE nombre = 'Noble Del Sur Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116480290'
WHERE nombre = 'Gabrielli Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116480214'
WHERE nombre = 'Francesco' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116480122'
WHERE nombre = 'Gabrielli Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116480047'
WHERE nombre = 'Gabrielli Gran Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116201451'
WHERE nombre = 'Tapiz Alta Collection Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116201369'
WHERE nombre = 'Wapisa Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116201352'
WHERE nombre = 'Wapisa Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116201321'
WHERE nombre = 'Zolo White Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116201307'
WHERE nombre = 'Wapisa Sauvignon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116201246'
WHERE nombre = 'Zolo Malbec 375' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116201154'
WHERE nombre = 'Tapiz Las Notas de J.C.' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116201055'
WHERE nombre = 'Zolo Red Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116201000'
WHERE nombre = 'Zolo Black Petit Verdot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116200997'
WHERE nombre = 'Zolo Black Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116200744'
WHERE nombre = 'Tapiz Extra Brut Chard-Pinot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116200737'
WHERE nombre = 'Tapiz Extra Brut Torrontes' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116200720'
WHERE nombre = 'Tapiz Extra Brut Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116200690'
WHERE nombre = 'Zolo Reserva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116200614'
WHERE nombre = 'Zolo Torrontes' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116200577'
WHERE nombre = 'Zolo Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116200539'
WHERE nombre = 'Tapiz Alta Collection Sauvignon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116200508'
WHERE nombre = 'Tapiz Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116200423'
WHERE nombre = 'Tapiz Seleccion de Barricas' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116200362'
WHERE nombre = 'Tapiz Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116200324'
WHERE nombre = 'Zolo Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116200287'
WHERE nombre = 'Zolo Reserva Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116200263'
WHERE nombre = 'Zolo Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116200201'
WHERE nombre = 'Zolo Sauvignon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116200188'
WHERE nombre = 'Tapiz Reserva Cabernet Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116200171'
WHERE nombre = 'Tapiz Reserva Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116200164'
WHERE nombre = 'Tapiz Reserva Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116200157'
WHERE nombre = 'Tapiz Reserva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116200133'
WHERE nombre = 'Tapiz Torrontes' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116200119'
WHERE nombre = 'Tapiz Reserva Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116200058'
WHERE nombre = 'Tapiz Sauvignon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116200041'
WHERE nombre = 'Tapiz Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116200034'
WHERE nombre = 'Tapiz Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116200010'
WHERE nombre = 'Tapiz Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116197815'
WHERE nombre = 'Saurus Select Cabernets Franc Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116191707'
WHERE nombre = 'Saurus Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116191677'
WHERE nombre = 'Saurus Barrel Cab. Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116191615'
WHERE nombre = 'Saurus Rose de Pinot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116191486'
WHERE nombre = 'Deseado Rose Saurus' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116191059'
WHERE nombre = 'Saurus Barrel Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116191042'
WHERE nombre = 'Saurus Barrel Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116190540'
WHERE nombre = 'Familia Schroeder Blend Saurus' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116190519'
WHERE nombre = 'Deseado Saurus' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116190366'
WHERE nombre = 'Saurus Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116190335'
WHERE nombre = 'Saurus Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116190328'
WHERE nombre = 'Saurus Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116190311'
WHERE nombre = 'Saurus Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116190038'
WHERE nombre = 'Saurus Select Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116190021'
WHERE nombre = 'Saurus Select Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798116190014'
WHERE nombre = 'Saurus Select Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798115510660'
WHERE nombre = 'Bataraz Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798115510592'
WHERE nombre = 'Carinae Viognier' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798115510516'
WHERE nombre = 'Carinae Chin Chin' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798115510325'
WHERE nombre = 'Carinae Le Petit Ami Chachingo' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798115510295'
WHERE nombre = 'Carinae Finca Deneza Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798115510219'
WHERE nombre = 'Carinae Odile Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798115102001'
WHERE nombre = 'Rd Sauvignon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798115101035'
WHERE nombre = 'Doña Ascensión Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798115101028'
WHERE nombre = 'Rd Malbec Cabernet' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798114902015'
WHERE nombre = 'Sinfonia Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798114482067'
WHERE nombre = 'Pasion 4 Cab Franc P. Verdot Joffré' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798114482043'
WHERE nombre = 'Joffré Gran Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798114481985'
WHERE nombre = 'Joffré 4 Uvas' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798114481954'
WHERE nombre = 'Joffré Blend de Selección 2 Cscf' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798114481374'
WHERE nombre = 'Joffré Expresiones Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798114481350'
WHERE nombre = 'Joffré Expresiones Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798114481336'
WHERE nombre = 'Joffré Expresiones Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798114481091'
WHERE nombre = 'Pasión 4 Malbec Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798114480766'
WHERE nombre = 'Joffré Blend de Selección 2 Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798114480711'
WHERE nombre = 'Pasión 4 Rose de Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798114480650'
WHERE nombre = 'Rj Malbec Joffré' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798114480643'
WHERE nombre = 'Rj Distinto Joffré' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798114480476'
WHERE nombre = 'Joffré Gran Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798114480414'
WHERE nombre = 'Pasion 4 Chard-Chenin Joffré' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '779811448041'
WHERE nombre = 'Pasion 4 Torrontes Joffré' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798114480407'
WHERE nombre = 'Pasion 4 Bonarda Joffré' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798114480391'
WHERE nombre = 'Pasion 4 Merlot Joffré' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798114480384'
WHERE nombre = 'Pasion 4 Malbec Joffré' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798114480377'
WHERE nombre = 'Pasion 4 Cab. Sauvig. Joffré' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798114480346'
WHERE nombre = 'Joffré Blend de Selección Cab-Mer' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798114480254'
WHERE nombre = 'Joffré Premium Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798114480209'
WHERE nombre = 'Joffré Gran Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798114480056'
WHERE nombre = 'Joffré Premium Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798114480049'
WHERE nombre = 'Joffré Premium Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798114480032'
WHERE nombre = 'Joffré Gran Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798114480018'
WHERE nombre = 'Joffré Gran Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798113810885'
WHERE nombre = 'Loco Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798113810854'
WHERE nombre = 'Loco Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798113810793'
WHERE nombre = 'Vero Malbec 2009' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798113810625'
WHERE nombre = 'Tempus Syarh' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798113810618'
WHERE nombre = 'Tempus Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798113810601'
WHERE nombre = 'Tempus Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798113810465'
WHERE nombre = 'Tempus Tempranillo' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798113810090'
WHERE nombre = 'Tempus Pleno Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798113555861'
WHERE nombre = 'Luna Rosé Malbec La Anita' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798113551658'
WHERE nombre = 'Asado Club Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798111990763'
WHERE nombre = 'Rosell Boher 70 Meses' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798111990664'
WHERE nombre = 'Viñas de Narvaez Reserva' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798111990442'
WHERE nombre = 'Viñas de Narvaez  Estuche 2 Botellas' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798111990428'
WHERE nombre = 'Rosell Boher Brut Rose' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798111990121'
WHERE nombre = 'Viñas de Narvaez Cab. Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798111990107'
WHERE nombre = 'Viñas de Narvaez Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798111990091'
WHERE nombre = 'Viñas de Narvaez Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798111990077'
WHERE nombre = 'Viñas de Narvaez  Cabernet Sauvigon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798111990060'
WHERE nombre = 'Viñas de Narvaez Sauvignon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798111741389'
WHERE nombre = 'Quinto Cab. Franc Riglos' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798111741235'
WHERE nombre = 'Quinto Cab. Sauv. Riglos' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798111741174'
WHERE nombre = 'Riglos Gran Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798111741020'
WHERE nombre = 'Riglos Gran Corte' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798111740863'
WHERE nombre = 'Taymente S. Blanc Tardio Huarpe' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798111740702'
WHERE nombre = 'Huarpe Vista Flores Bonarda-P. Verdot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798111740672'
WHERE nombre = 'Huarpe Gualtallary Cab. Franc-Cab. Sauv.' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798111740641'
WHERE nombre = 'Huarpe Agrelo Malbec-Cab. Sauv.' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798111740580'
WHERE nombre = 'Taymente Bonarda Huarpe' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798111740146'
WHERE nombre = 'Taymente Pinot Noir Huarpe' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798111740078'
WHERE nombre = 'Taymente Cab. Sauvignon Huarpe' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798111740061'
WHERE nombre = 'Taymente Malbec Huarpe' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798111740016'
WHERE nombre = 'Lancatay Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798111240370'
WHERE nombre = 'Gouguenheim Merlot Reserva' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798111240363'
WHERE nombre = 'Gouguenheim Reserva Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798111240240'
WHERE nombre = 'Gouguenheim Valle Escondido Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798111240226'
WHERE nombre = 'Gouguemheim Reserva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798111240134'
WHERE nombre = 'Gouguemheim Bonarda Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798111240073'
WHERE nombre = 'Gouguemheim Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798111240059'
WHERE nombre = 'Gouguemheim Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798111240042'
WHERE nombre = 'Gouguemheim Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798111240035'
WHERE nombre = 'Gouguemheim Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798110990085'
WHERE nombre = 'Viña Alicia Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798110990078'
WHERE nombre = 'Viña Alicia Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798110240586'
WHERE nombre = 'Nietos Comañeros Rosado G. Riili' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798110240562'
WHERE nombre = 'Nietos Compañeros Blanco G. Riili' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798110240425'
WHERE nombre = 'T. D. Dioses Unico Malbec G. Riili' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798110240401'
WHERE nombre = 'Nietos Compañeros Tinto G. Riili' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798110240357'
WHERE nombre = 'Buenos Hnos. Merlot G. Riili' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798110240319'
WHERE nombre = 'Padres Ded. Malbec G. Riili' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798110240227'
WHERE nombre = 'Buenos Hnos. Malbec G. Riili' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '779811024022'
WHERE nombre = 'Buenos Hnos. Bonarda Valiente G. Riili' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798110240210'
WHERE nombre = 'T. D.  Dioses Mito Cab. Franc G. Riili' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798110240128'
WHERE nombre = 'Gimenez Riili Extra Brut' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798110240104'
WHERE nombre = 'Gimenez Riili Brut Nature' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798110240098'
WHERE nombre = 'T. D. Dioses Unico Cab. Franc G. Riili' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798110240067'
WHERE nombre = 'Buenos Hnos.Torrontes G. Riili' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798110240043'
WHERE nombre = 'Joyas de Familia Blend G. Riili' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798110240036'
WHERE nombre = 'T. D.  Dioses Mito Malbec G. Riili' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798110240012'
WHERE nombre = 'Padres Ded. Cab. Franc G. Riili' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798109189476'
WHERE nombre = 'Miras Reserva Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798109189469'
WHERE nombre = 'Miras Reserva Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798109189452'
WHERE nombre = 'Miras Reserva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798109180251'
WHERE nombre = 'Miras Reserva Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798108830638'
WHERE nombre = 'Callia Esperado' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798108830218'
WHERE nombre = 'Callia Syrah Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798108830201'
WHERE nombre = 'Callia Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798108620529'
WHERE nombre = 'Ayni Malbec Chakana' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798108620512'
WHERE nombre = 'Maipe' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798108620314'
WHERE nombre = 'Chakana Nuna Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798108620130'
WHERE nombre = 'Chakana Reserva Sauvignon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798108620079'
WHERE nombre = 'Chakana Reserva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798108620062'
WHERE nombre = 'Chakana Reserva Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798108620055'
WHERE nombre = 'Chakana Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798108620048'
WHERE nombre = 'Chakana Estate Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798108620031'
WHERE nombre = 'Chakana Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798108620024'
WHERE nombre = 'Chakana Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798108620017'
WHERE nombre = 'Nuna Malbec Chakana' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798108254403'
WHERE nombre = 'La Zulema Malbec Pulenta' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798108254366'
WHERE nombre = 'La Flor Malbec 375 Pulenta' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798108254335'
WHERE nombre = 'Pulenta Rose S´Ilvous Plait' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798108254090'
WHERE nombre = 'Pulenta Estate Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798108253741'
WHERE nombre = 'Pulenta Estate Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798108253666'
WHERE nombre = 'Pulenta Estate Pinot Gris' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798108253635'
WHERE nombre = 'Pulenta Estate Sauvignon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798108253574'
WHERE nombre = 'La Flor Sauv. Blanc Pulenta' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798108253529'
WHERE nombre = 'La Flor Cab. Sauv. Pulenta' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798108253512'
WHERE nombre = 'La Flor Malbec Pulenta' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798108253246'
WHERE nombre = 'Pulenta Estate Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798108253154'
WHERE nombre = 'La Flor Blend Pulenta' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798108252485'
WHERE nombre = 'Pulenta Estate Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798108240123'
WHERE nombre = 'Maula & Misery Mouse Sauvignon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798108240116'
WHERE nombre = 'Maula Pinot Noir Oak' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798108240055'
WHERE nombre = 'Maula & Misery Mouse Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798108240031'
WHERE nombre = 'Margot Champenoise Extra Brut' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798108240017'
WHERE nombre = 'Margot Extra Brut' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104769123'
WHERE nombre = 'Amalaya Magnun' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104769116'
WHERE nombre = 'Amalaya Gran Corte' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104769093'
WHERE nombre = 'Amalaya Blanco' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104764029'
WHERE nombre = 'Colome Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104763039'
WHERE nombre = 'Amalaya Tinto' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104762025'
WHERE nombre = 'Colome Torrontes' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104760496'
WHERE nombre = 'Colome Lote Especial Sauvignon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104760489'
WHERE nombre = 'Colome Lote Especial Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104760458'
WHERE nombre = 'Amalaya Brut Nature' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104760441'
WHERE nombre = 'Amalaya Corte Único' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104760373'
WHERE nombre = 'Amalaya Tardio' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104760342'
WHERE nombre = 'Colomé Autentico Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104760328'
WHERE nombre = 'Amalaya Rose' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104760281'
WHERE nombre = 'Colome Alturas' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104760236'
WHERE nombre = 'Colome Estuche X 2' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104760182'
WHERE nombre = 'Territorio Torrontes' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104760175'
WHERE nombre = 'Territorio Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104760168'
WHERE nombre = 'Territorio Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104410445'
WHERE nombre = 'Clos de Los Siete Magnun' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104410414'
WHERE nombre = 'Clos de Los Siete' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104390723'
WHERE nombre = 'Val de Fores Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104390709'
WHERE nombre = 'Mariflor Sauvignon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104390686'
WHERE nombre = 'Mariflor Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104390570'
WHERE nombre = 'Mariflor Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104282745'
WHERE nombre = 'Petit Fleur Torrontes' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104282578'
WHERE nombre = 'Festivo Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104282547'
WHERE nombre = 'Calypso  Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104282530'
WHERE nombre = 'Linda Flor Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104282462'
WHERE nombre = 'Festivo Torrontes' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104282363'
WHERE nombre = 'Monteviejo Segui Amistad' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104282332'
WHERE nombre = 'Petit Fleur Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104282264'
WHERE nombre = 'Festivo Rose' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104282110'
WHERE nombre = 'Petit Fleur Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104281878'
WHERE nombre = 'El Sensasional Equilibrista' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104281786'
WHERE nombre = 'El Joven Equilibrista' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104280987'
WHERE nombre = 'El Gran Equilibrista' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798104280949'
WHERE nombre = 'Monteviejo' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103869077'
WHERE nombre = 'Sophenia Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103862238'
WHERE nombre = 'Altosur Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103862221'
WHERE nombre = 'Altosur Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103861231'
WHERE nombre = 'Sophenia Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103861224'
WHERE nombre = 'Sophenia Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103861095'
WHERE nombre = 'Altosur Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103167715'
WHERE nombre = 'Lorca Poetico Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103166626'
WHERE nombre = 'Lorca Inspirado Cabernet-Cabernet' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103166121'
WHERE nombre = 'Lorca Fantasia El Mirador Criolla Dulce Natural' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103165841'
WHERE nombre = 'Lorca Inspirado Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103165728'
WHERE nombre = 'Foster Los Barrancos' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103165711'
WHERE nombre = 'Foster Los Altepes' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103165537'
WHERE nombre = 'Ique Bonarda Foster' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103165520'
WHERE nombre = 'Foster Reserva Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103165476'
WHERE nombre = 'Lorca Fantasia Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103164578'
WHERE nombre = 'Ique Malbec Magnun Foster' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103164400'
WHERE nombre = 'Lorca Bib Malbec 3 Litros' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103164004'
WHERE nombre = 'Lorca Fantasia Sauvignon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103163274'
WHERE nombre = 'Lorca Inspirado Red Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103161713'
WHERE nombre = 'Foster Reserva Malbec 1,5 Lts.' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103161683'
WHERE nombre = 'Foster Pink Malbec Rose' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103161362'
WHERE nombre = 'Lorca Gran Poetico Petit Verdot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103161300'
WHERE nombre = 'Lorca Poetico Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103161287'
WHERE nombre = 'Lorca Gran Poetico Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103161263'
WHERE nombre = 'Lorca Gran Opalo Red Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103160860'
WHERE nombre = 'Lorca Poetico Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103160631'
WHERE nombre = 'Lorca Fantasia Extra Brut' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103160457'
WHERE nombre = 'Foster Firmado Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103160372'
WHERE nombre = 'Lorca Poetico Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103160334'
WHERE nombre = 'Lorca Fantasia Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103160310'
WHERE nombre = 'Lorca Fantasia Malbec-Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103160273'
WHERE nombre = 'Lorca Fantasia Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103160150'
WHERE nombre = 'Lorca Opalo Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103160129'
WHERE nombre = 'Ique Malbec Foster' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798103160099'
WHERE nombre = 'Foster Limited Edition Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798102710554'
WHERE nombre = 'Conciliador Mal - Franc Los Maitenes' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798102710523'
WHERE nombre = 'Belico Raboso Los Maitenes' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798102710516'
WHERE nombre = 'Belico Blend Los Maitenes' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798101653951'
WHERE nombre = 'D. Bousquet Rva. Cab. Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798101653890'
WHERE nombre = 'D. Bousquet Virgen Cab. Sauv.' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798101653722'
WHERE nombre = 'D. Bousquet Virgen Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798101653234'
WHERE nombre = 'D. Bousquet Virgen Red Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798101652688'
WHERE nombre = 'Gaia White Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798101652619'
WHERE nombre = 'D. Bousquet Rva Pinot Gris' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798101652350'
WHERE nombre = 'D. Bousquet Brut Rose' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798101652299'
WHERE nombre = 'D. Bousquet Brut' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798101652213'
WHERE nombre = 'Gaia Red Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798101652176'
WHERE nombre = 'Amerí' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798101651919'
WHERE nombre = 'D. Bousquet Champenoise Brut' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798101651506'
WHERE nombre = 'D. Bousquet Rva Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798101651438'
WHERE nombre = 'D. Bousquet Champenoise Brut Rose' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798101651001'
WHERE nombre = 'D. Bousquet Rva Cab. Sauvig.' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798101650431'
WHERE nombre = 'D. Bousquet Rva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798101650226'
WHERE nombre = 'D. Bousquet Rva Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798101650202'
WHERE nombre = 'D. Bousquet Rosé' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798101650042'
WHERE nombre = 'D. Bousquet Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798101650011'
WHERE nombre = 'D. Bousquet Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '779810160044'
WHERE nombre = 'Foster Reserva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798100855691'
WHERE nombre = 'Collovati Torrontés' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798099590092'
WHERE nombre = 'Fin Del Mundo Reserva Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798098894412'
WHERE nombre = 'Urban Uco Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798097233359'
WHERE nombre = 'El Porvenir, Naranjo Peq. Fermentacion' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798097233335'
WHERE nombre = 'El Porvenir, Bonarda Peq. Fermentacion' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798097231102'
WHERE nombre = 'Amauta Absoluto Torrontés El Porvenir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798097231089'
WHERE nombre = 'Amauta Absoluto Tannat El Porvenir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798097231065'
WHERE nombre = 'Amauta Absoluto Malbec El Porvenir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798097230907'
WHERE nombre = 'Laborum Torrontés Oak Ferm. El Porvenir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798097230686'
WHERE nombre = 'Amauta Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798097230396'
WHERE nombre = 'Laborum Torrontes' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798097230280'
WHERE nombre = 'Laborum Tannat' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798097230228'
WHERE nombre = 'Laborum Malbec, El Porvenir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798093272901'
WHERE nombre = 'Benegas Sv Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798093272895'
WHERE nombre = 'Benegas Sv Sangiovese' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798093272888'
WHERE nombre = 'Benegas Sv Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798093272864'
WHERE nombre = 'Benegas Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798093272857'
WHERE nombre = 'Benegas Sv Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798093272840'
WHERE nombre = 'Benegas Sv Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798093272833'
WHERE nombre = 'Benegas Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798093272826'
WHERE nombre = 'Benegas Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798093272536'
WHERE nombre = 'Ataliva Malbec By Benegas' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798093272147'
WHERE nombre = 'Juan Benegas' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798093272130'
WHERE nombre = 'Benegas Don Tiburcio' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798093272116'
WHERE nombre = 'Carmela Benegas' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798093272109'
WHERE nombre = 'Luna Benegas' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798091111165'
WHERE nombre = 'Achaval Ferrer Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798091111110'
WHERE nombre = 'Achaval Ferrer Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798091111035'
WHERE nombre = 'Achaval Ferrer Quimera Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798090852250'
WHERE nombre = 'Yauquen Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798090852229'
WHERE nombre = 'Yauquen Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798090852144'
WHERE nombre = 'Ruca Malec Petit Verdot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798090851826'
WHERE nombre = 'Yauquen Malbec Cabernet' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798090851789'
WHERE nombre = 'Ruca Malen Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798090851710'
WHERE nombre = 'Ruca Malen Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798090851420'
WHERE nombre = 'Ruca Malen Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798090850157'
WHERE nombre = 'Yauquen Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798090850096'
WHERE nombre = 'Ruca Malen Reserva Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798090162526'
WHERE nombre = 'Los Cardos Blend Doña Paula' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798090162441'
WHERE nombre = 'Doña Paula Sauvage Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798090162212'
WHERE nombre = 'Doña Paula Estate Black Edition' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798090162076'
WHERE nombre = 'Doña Paula Riesling' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798090160966'
WHERE nombre = 'Doña Paula Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798090160508'
WHERE nombre = 'Paula Sauvignon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798090160485'
WHERE nombre = 'Paula Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798090160461'
WHERE nombre = 'Paula Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798090160294'
WHERE nombre = 'Doña Paula Malbec Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798090160287'
WHERE nombre = 'Doña Paula Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798090160232'
WHERE nombre = 'Los Cardos Sauv. Blanc Doña Paula' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798090160201'
WHERE nombre = 'Los Cardos Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798090160171'
WHERE nombre = 'Los Cardos Syrah Doña Paula' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798090160140'
WHERE nombre = 'Los Cardos Malbec Doña Paula' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798090160065'
WHERE nombre = 'Doña Paula Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798086535686'
WHERE nombre = 'Mythic Mountain Petit Verdot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798086535662'
WHERE nombre = 'Mythic Mountain Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798086533477'
WHERE nombre = '505 Bag In Box Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798086532920'
WHERE nombre = 'Casarena Red Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798086532883'
WHERE nombre = 'Rama Negra Estate Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798086532463'
WHERE nombre = 'Mythic Mountain Red Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798086532449'
WHERE nombre = 'Mythic Mountain Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798086532425'
WHERE nombre = 'Mythic Mountain Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798086531046'
WHERE nombre = '505 Rosado de Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798086530902'
WHERE nombre = 'Jamilla´S Perdriel Malbec Casarena' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798086530896'
WHERE nombre = 'Lauren´S Agrelo Cab. Franc Casarena' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798086530759'
WHERE nombre = '505 Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798086530742'
WHERE nombre = '505 Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798086530711'
WHERE nombre = 'Rama Negra Reserva Red Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798086530551'
WHERE nombre = 'Rama Negra Reserva Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798086530476'
WHERE nombre = 'Rama Negra Reserva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798086530131'
WHERE nombre = 'Rama Negra Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798086530100'
WHERE nombre = 'Casarena Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798085201070'
WHERE nombre = 'Valbona Legado Malbec Augusto P.' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798085200615'
WHERE nombre = 'Valbona Syrah Augusto P.' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798085200608'
WHERE nombre = 'Valbona Malbec Augusto P.' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798085200509'
WHERE nombre = 'Augusto P.' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798085200257'
WHERE nombre = 'Valbona Moscatel Dulce Augusto P.' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798085200165'
WHERE nombre = 'Valbona Legado Pinot Gris Augusto P.' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798085200134'
WHERE nombre = 'Valbona Chardonnay Augusto P.' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798085200110'
WHERE nombre = 'Valbona Cab. Sauvig. Augusto P.' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798085200042'
WHERE nombre = 'Valbona Legado Cab. Sauvig. Agusto P.' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798084591721'
WHERE nombre = 'Callejón Del Crimen Estate Sangiovese' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798084591684'
WHERE nombre = 'Callejón de Crimen Estate Cabernet' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798084591677'
WHERE nombre = 'Episodio Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798084591592'
WHERE nombre = 'Quercus Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798084591585'
WHERE nombre = 'Quercus Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798084591295'
WHERE nombre = 'Callejón Del Crimen Reserva Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798084591288'
WHERE nombre = 'Callejón Del Crimen Reserva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798084591134'
WHERE nombre = 'Callejón Del Crimen Gran Rva Cabernet' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798084591127'
WHERE nombre = 'Callejón Del Crimen Gran Reserva Sangiovese' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798084591035'
WHERE nombre = 'Callejón Del Crimen Gran Rva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798081660468'
WHERE nombre = 'La Celia Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798081660253'
WHERE nombre = 'La Consulta Cabernet Sauvigno' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798081392499'
WHERE nombre = 'Vuela Sirah  Piedra Negra' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798081392314'
WHERE nombre = 'Gran Lurton Jackot Piedra Negra' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798081392260'
WHERE nombre = 'Vuela B N Rosé Piedra Negra' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798081392253'
WHERE nombre = 'Vuela Brut Nature Piedra Negra' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798081392147'
WHERE nombre = 'Tierra Del Fuego Reserva Pinot Gris' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798081392130'
WHERE nombre = 'Tierra Del Fuego Reserva Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798081392123'
WHERE nombre = 'Tierra Del Fuego Reserva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798081391966'
WHERE nombre = 'Piedra Negra Reserva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798081391867'
WHERE nombre = 'Alta Colección Pinot Gris Piedra Negra' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798081391829'
WHERE nombre = 'Piedra Negra Reserva Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798081391782'
WHERE nombre = 'Alta Colección Malbec Piedra Negra Organico' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798081391768'
WHERE nombre = 'Piedra Negra Excelencia Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798081391737'
WHERE nombre = 'Tierra Del Fuego Rose' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798081391300'
WHERE nombre = 'Gran Lurton Corte Friuliano Piedra Negra' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798081391201'
WHERE nombre = 'Vuela Sauv. Blanc Piedra Negra' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798081391188'
WHERE nombre = 'Maury' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798081390488'
WHERE nombre = 'Tierra Del Fuego Blanco' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798081390464'
WHERE nombre = 'Tierra Del Fuego Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798081390266'
WHERE nombre = 'Gran Lurton Corte Argentino Piedra Negra' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798081390051'
WHERE nombre = 'Alta Colección Cab. Sau. Piedra Negra' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798081390020'
WHERE nombre = 'Piedra Negra Reserva Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798081010034'
WHERE nombre = 'Vinorum Reserva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798081010010'
WHERE nombre = 'Vinorum Premium Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798080491940'
WHERE nombre = 'Tucumen Zinfanel' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798080491841'
WHERE nombre = 'La Vaca Club' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798080490783'
WHERE nombre = 'Budeguer 4000 Black Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798080490417'
WHERE nombre = 'Tucumen Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798080490400'
WHERE nombre = 'Tucumen Reserva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798080490363'
WHERE nombre = 'Tucumen Joven Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798080490028'
WHERE nombre = 'Plan B Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798080490011'
WHERE nombre = 'Plan B Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078236706'
WHERE nombre = 'Septima Sauvignon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078236379'
WHERE nombre = 'Maria 187' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078236331'
WHERE nombre = 'Septima Gran Reserva Estuche X 1' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078236300'
WHERE nombre = 'Maria Extra Brut + Copas' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078236287'
WHERE nombre = 'Septima Estuche 2 Botellas + Sacacorchos' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078236164'
WHERE nombre = 'Septima Estuche Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078236119'
WHERE nombre = 'Septima Obra Malbec Lata' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078235440'
WHERE nombre = 'Septima Gran Reserva' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078235082'
WHERE nombre = 'Maria Reserve Brut Nature' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078235068'
WHERE nombre = 'Septima Extra Brut' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078235044'
WHERE nombre = 'Maria Pinot Noir Extra Brut' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078235020'
WHERE nombre = 'Maria Extra Brut Lata' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078235006'
WHERE nombre = 'Maria Extra Brut' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078231718'
WHERE nombre = 'Los Pasos Estuche X 2 Botellas' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078231343'
WHERE nombre = 'Los Pasos Tardío' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078231312'
WHERE nombre = 'Maria Dulce' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078231008'
WHERE nombre = 'Los Pasos  375 Cc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078230964'
WHERE nombre = 'Septima Obra Estuche Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078230933'
WHERE nombre = 'Los Pasos Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078230919'
WHERE nombre = 'Los Pasos Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078230834'
WHERE nombre = 'Septima 10 Barricascabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078230810'
WHERE nombre = 'Septima 10 Barricas Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078230803'
WHERE nombre = 'Maria Estuche 3 Marias' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078230704'
WHERE nombre = 'Septima Obra Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078230681'
WHERE nombre = 'Septima Obra Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078230605'
WHERE nombre = 'Los Pasos Extra Brut' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078230544'
WHERE nombre = 'Los Pasos Semillon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078230520'
WHERE nombre = 'Los Pasos Syrah-Tempranillo' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078230506'
WHERE nombre = 'Los Pasos Mal-Cab' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078230278'
WHERE nombre = 'Septima Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078230247'
WHERE nombre = 'Septima Obra Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078230230'
WHERE nombre = 'Septima Obra Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078230162'
WHERE nombre = 'Septima Tempranillo' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078230049'
WHERE nombre = 'Septima Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078230032'
WHERE nombre = 'Septima Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078230025'
WHERE nombre = 'Septima Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798078230018'
WHERE nombre = 'Septima Malbec  Cab. Sauv.' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798074862091'
WHERE nombre = 'Kilka Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798074861179'
WHERE nombre = 'Salentein Brut Nature' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798074860240'
WHERE nombre = 'Portillo Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798074860226'
WHERE nombre = 'Portillo Sauvignon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798074860219'
WHERE nombre = 'Portillo Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798068484261'
WHERE nombre = 'Susana Balbo Signature Rosé' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798068483288'
WHERE nombre = 'Crios Blend Susana Balbo' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798068480836'
WHERE nombre = 'Benmarco Cab. Sauv. Susana Balbo' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798068480805'
WHERE nombre = 'Susana Balbo Signature Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798068480539'
WHERE nombre = 'Benmarco Malbec Susana Balbo' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798068480393'
WHERE nombre = 'Crios Malbec Susana Balbo' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798068480300'
WHERE nombre = 'Crios Torrontes Susana Balbo' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798068480249'
WHERE nombre = 'Crios Rosado Susana Balbo' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798068480218'
WHERE nombre = 'Crios Cab. Sauv. Susana Balbo' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798066550050'
WHERE nombre = 'Ricardo Santos Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798057483480'
WHERE nombre = 'Alta Vista Albaneve Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798057483404'
WHERE nombre = 'Atemporal Assemb. Bco. Alta Vista' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798057483299'
WHERE nombre = 'Atemporal B. N. Pn-Ch Alta Vista' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798057483060'
WHERE nombre = 'Vive Cab. Sauvignon Alta Vista' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798057483053'
WHERE nombre = 'Vive Malbec Alta Vista' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798057482896'
WHERE nombre = 'Vive Red Blend Alta Vista' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798057482889'
WHERE nombre = 'Atemporal B. N, Ch-Pn Alta Vista' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798057482858'
WHERE nombre = 'Alta Vista Estate Premium Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798057482841'
WHERE nombre = 'Alta Vista Terroir Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798057482667'
WHERE nombre = 'Finca Monteflores Malbec Alta Vista' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798057482520'
WHERE nombre = 'Atemporal Touriga Nacional' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798057482513'
WHERE nombre = 'Atemporal Cabernet Sauvignon - Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798057482469'
WHERE nombre = 'Alta Vista Temis Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798057482407'
WHERE nombre = 'Alta Vista Classic Reserva Torrontes' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798057482391'
WHERE nombre = 'Alta Vista Classic Reserva Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798057482377'
WHERE nombre = 'Alta Vista Classic Reserva Malbec 2010' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798057482285'
WHERE nombre = 'Alta Vista Classic Estuche' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798057481929'
WHERE nombre = 'Alta Vista Terroir  Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798057481615'
WHERE nombre = 'Atemporal Estuche Rose' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798057481585'
WHERE nombre = 'Atemporal Blend Alta Vista' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798057481554'
WHERE nombre = 'Alta Vista Classic Cabernet Sauvignon 2010' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798057481271'
WHERE nombre = 'Alta Vista Estate Premium Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798057481097'
WHERE nombre = 'Alta Vista Extra Brut' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798057480717'
WHERE nombre = 'Atemporal E. B. Rosé Alta Vista' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798057480700'
WHERE nombre = 'Atemporal E. B. Bco Alta Vista' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798057480403'
WHERE nombre = 'Alta Vista Estuche Madera X 2' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798057480366'
WHERE nombre = 'Alta Vista Estate Premium Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798057480359'
WHERE nombre = 'Alta Vista Estate Premium Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798057480113'
WHERE nombre = 'Vive Rose Alta Vista' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798057480106'
WHERE nombre = 'Alta Vista Estate Premium Torrontes' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798057480090'
WHERE nombre = 'Alta Vista Estate Premium Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798057480076'
WHERE nombre = 'Alta Vista Estate Premium Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798057480045'
WHERE nombre = 'Alta Vista Alto Malbec 2010' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798051950056'
WHERE nombre = 'Colonia Las Liebres Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798051950032'
WHERE nombre = 'Las Hormigas Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798051950025'
WHERE nombre = 'Las Hormigas Terroir Seleccion' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798051305566'
WHERE nombre = 'Viniterra Select Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798051305535'
WHERE nombre = 'Viniterra Select Carmenere' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798051301346'
WHERE nombre = 'Viniterra Single Vineyard Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798051301025'
WHERE nombre = 'Viniterra Carmenere' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798051300820'
WHERE nombre = 'Viniterra Pinot Grigio' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798051300752'
WHERE nombre = 'Viniterra Select Malbec Carmenere' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798051300080'
WHERE nombre = 'Viniterra Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798051300059'
WHERE nombre = 'Viniterra Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798039599192'
WHERE nombre = 'Trivento White Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798039598997'
WHERE nombre = 'Trivento Gaudeo Malbec Tupungato' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798039598140'
WHERE nombre = 'Trivento Golden Rva. Cab. Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798039593503'
WHERE nombre = 'Amado Sur' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798039591660'
WHERE nombre = 'Trivento Golden Rva Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798039590342'
WHERE nombre = 'Trivento Reserva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798021010995'
WHERE nombre = 'Bonomo Montiel Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798021010896'
WHERE nombre = 'Bonomo Montiel Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798021010872'
WHERE nombre = 'Bonomo Montiel Sauvignon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798001612096'
WHERE nombre = 'Montepio Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798000212303'
WHERE nombre = 'Phebus Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798000212037'
WHERE nombre = 'Phebus Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798000211214'
WHERE nombre = 'Infinitus Malbec Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798000211207'
WHERE nombre = 'Infinitus Cabernet Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798000211030'
WHERE nombre = 'Fabre Montmayu Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798000211023'
WHERE nombre = 'Fabre Montmayu Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798000211016'
WHERE nombre = 'Fabre Montmayu Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798000210996'
WHERE nombre = 'Fabre Montmayou Extra Brut' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798000210835'
WHERE nombre = 'Hey Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798000210811'
WHERE nombre = 'Riccitelli The Apple Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798000210606'
WHERE nombre = 'Fabre Montmayou Estuche Cab. Sau.' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798000210590'
WHERE nombre = 'Fabre Montmayou Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798000210576'
WHERE nombre = 'Riccitelli Republica Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798000210552'
WHERE nombre = 'Fabre Montmayou Estuche Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798000210545'
WHERE nombre = 'H. J. Fabre Malbec Petit Verdot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798000210538'
WHERE nombre = 'H. J. Fabre Reserva Malbec Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798000210521'
WHERE nombre = 'H. J. Fabre Reserva Mal-Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7798000210460'
WHERE nombre = 'Riccitelli Vineyard Selection Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7797205813032'
WHERE nombre = 'Finca La Anita Petit Verdot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7797205000197'
WHERE nombre = 'Luna Cabernet Sauvignon La Anita' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7797205000128'
WHERE nombre = 'Finca La Anita Tocai' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7797205000074'
WHERE nombre = 'Luna Malbec La Anita' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7797205000067'
WHERE nombre = 'Luna Syrah La Anita' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7797205000043'
WHERE nombre = 'Finca La Anita Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7797205000036'
WHERE nombre = 'Finca La Anita Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7797103160358'
WHERE nombre = 'Lorca Fantasia Torrontes' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7796626002193'
WHERE nombre = 'Finca Ferrer 1310 Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7796626001752'
WHERE nombre = 'Viento Sur Cosecha Tardio' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7796626001127'
WHERE nombre = 'Finca Ferrer Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7796626001028'
WHERE nombre = 'Finca Ferrer 1310 Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7796626000670'
WHERE nombre = 'Acordeón Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7796626000595'
WHERE nombre = 'Viento Sur Tardio Tinto' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7796626000557'
WHERE nombre = 'Doscumbres Blend Ferrer' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7796626000458'
WHERE nombre = 'Acordeón Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7796626000120'
WHERE nombre = 'Acordeón Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7796626000076'
WHERE nombre = 'Viento Sur Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7796138000274'
WHERE nombre = 'Yacuil' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7796138000014'
WHERE nombre = 'San Pedro de Yacochuya Tinto' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794620000016'
WHERE nombre = 'Alta Vista Terroir Malbec Salta' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450946058'
WHERE nombre = 'Intuitivo Maipú Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450946034'
WHERE nombre = 'Intuitivo Tupungato Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450946010'
WHERE nombre = 'Intuitivo Lujan de Cuyo Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450942968'
WHERE nombre = 'Tierra Del Fuego Sauvignon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450941442'
WHERE nombre = 'Vendimiario Catamarca' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450941077'
WHERE nombre = 'Vendimiario Salta' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450940643'
WHERE nombre = 'Vendimiario San Juan' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450940636'
WHERE nombre = 'Vendimiario La Rioja' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450940629'
WHERE nombre = 'Vendimiario Mendoza' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450940384'
WHERE nombre = 'Saint Felicien Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450940322'
WHERE nombre = 'Viñador Del Rey' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450940230'
WHERE nombre = 'Alamos Chardonnay 375' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450940209'
WHERE nombre = 'Alamos Rose' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450940193'
WHERE nombre = 'Alamos Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450940186'
WHERE nombre = 'Alamos Sauvignon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450940179'
WHERE nombre = 'Alamos Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450093622'
WHERE nombre = 'Estiba I 375 Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450093530'
WHERE nombre = 'La Posta Blend Tinto' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450093523'
WHERE nombre = 'La Posta Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450093516'
WHERE nombre = 'La Posta Pizzella' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450093509'
WHERE nombre = 'La Posta Paulucci' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450092298'
WHERE nombre = 'Saint Felicien Nature' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450092229'
WHERE nombre = 'Estiba Tempranillo' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450092205'
WHERE nombre = 'Estiba I Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450092168'
WHERE nombre = 'Uxmal 375' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450092090'
WHERE nombre = 'Luca Beso de Dante' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450092083'
WHERE nombre = 'Nico By Luca' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450091437'
WHERE nombre = 'Alamos Extra Brut' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450091376'
WHERE nombre = 'Dv Estuche Cab Mal' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450091192'
WHERE nombre = 'Saint Felicien Estuche 2 Botellas' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450090973'
WHERE nombre = 'Estiba I Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450090959'
WHERE nombre = 'Estiba I Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450090935'
WHERE nombre = 'Estiba I Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450090713'
WHERE nombre = 'Uxmal Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450090614'
WHERE nombre = 'Uxmal Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450090591'
WHERE nombre = 'Uxmal Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450090492'
WHERE nombre = 'Dv Catena Cab Mal' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450090386'
WHERE nombre = 'Uxmal Alto Cab. Sauv  Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450090102'
WHERE nombre = 'Dv Catena Cab Cab 2005' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450090096'
WHERE nombre = 'Dv Catena Mal Mal' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450089939'
WHERE nombre = 'Uxmal Estuche X 2' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450088963'
WHERE nombre = 'Angelica Zapata Cab. Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450088581'
WHERE nombre = 'Saint Felicien Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450088475'
WHERE nombre = 'Uxmal Cab. Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450088468'
WHERE nombre = 'Uxmal Cab. Sauv  Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450088338'
WHERE nombre = 'Argento S. V. Malbec Agrelo' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450024046'
WHERE nombre = 'Saint Felicien Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450024015'
WHERE nombre = 'Saint Felicien Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450008961'
WHERE nombre = 'Angelica Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450008800'
WHERE nombre = 'Argento Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450008282'
WHERE nombre = 'Angelica Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450008275'
WHERE nombre = 'Angelica Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450008268'
WHERE nombre = 'Angelica Zapata Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450005489'
WHERE nombre = 'Nicola Catena Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450005458'
WHERE nombre = 'Pasarisa Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450004666'
WHERE nombre = 'Nicasia Sweet Bubbles' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450004628'
WHERE nombre = 'Uxmal Moscatel' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450004536'
WHERE nombre = 'Altaland Tinto Histórico' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450004505'
WHERE nombre = 'Altaland Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450004277'
WHERE nombre = 'Bravío Sauvignon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450004253'
WHERE nombre = 'Bravío Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450004239'
WHERE nombre = 'Bravío Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450003997'
WHERE nombre = 'Uxmal Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450003607'
WHERE nombre = 'Alamos Moscatel' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450003416'
WHERE nombre = 'Catena Zapata White Bones' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450003225'
WHERE nombre = 'Alamos Extra Brut 375' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450003126'
WHERE nombre = 'Saint Felicien Clorindo Testa' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450002938'
WHERE nombre = 'Alamos Rose Extra Brut' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450002679'
WHERE nombre = 'Saint Felicien Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450002549'
WHERE nombre = 'Saint Felicien Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450001696'
WHERE nombre = 'Dv Catena Pinot Pinot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450001665'
WHERE nombre = 'Uxmal Alto Pinot Grigio' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450001641'
WHERE nombre = 'Uxmal Alto Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450001597'
WHERE nombre = 'Lando Cabernet Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450001177'
WHERE nombre = 'Alamos Estuche 2 Botellas' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450000972'
WHERE nombre = 'El Enemigo Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450000866'
WHERE nombre = 'Saint Felicien Nature Estuche X 2' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450000804'
WHERE nombre = 'Alamos  Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450000798'
WHERE nombre = 'Alamos Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450000781'
WHERE nombre = 'Alamos Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450000200'
WHERE nombre = 'Esmeralda Fernandez Cabernet Sauvginon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450000187'
WHERE nombre = 'Esmeralda Fernandez Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450000170'
WHERE nombre = 'Esmeralda Fernandez Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450000163'
WHERE nombre = 'Nicasia Blanco Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450000156'
WHERE nombre = 'Nicasia Cab. Franc Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450000149'
WHERE nombre = 'Nicasia Malbec Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450000064'
WHERE nombre = 'Dv Adrianna Vineyard' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450000040'
WHERE nombre = 'Saint Felicien Estuche Cab. Sau.' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794450000026'
WHERE nombre = 'Saint Felicien Estuche Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7794408000016'
WHERE nombre = 'Flor de Manzano Dulce 710' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793567021047'
WHERE nombre = 'Avena Rva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793567020927'
WHERE nombre = 'Araucal Malbec-Shiraz' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793567020910'
WHERE nombre = 'Araucal Cabernet-Tempranillo' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793567020620'
WHERE nombre = 'Atilio Avena Finca V.' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793567020545'
WHERE nombre = 'Avena Rva Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793567020538'
WHERE nombre = 'Avena Roble Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793567020514'
WHERE nombre = 'Avena Joven Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793567020477'
WHERE nombre = 'Avena Joven Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793567020422'
WHERE nombre = 'Avena Roble Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793567020415'
WHERE nombre = 'Avena Roble  Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793567020392'
WHERE nombre = 'Avena Rva Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793440704838'
WHERE nombre = 'Cadus Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793440704036'
WHERE nombre = 'Nieto Senet.  Sauvigon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793440703398'
WHERE nombre = 'Nieto Senet.  Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793440702964'
WHERE nombre = 'Benjamin  Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793440702940'
WHERE nombre = 'Benjamin Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793440702735'
WHERE nombre = 'Don Nicanor  Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793440702698'
WHERE nombre = 'Don Nicanor Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793440701530'
WHERE nombre = 'Nieto Estuche Extra Brut' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793440701042'
WHERE nombre = 'Nieto Senet.  Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793440700939'
WHERE nombre = 'Nieto Brut Nature' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793440700915'
WHERE nombre = 'Don Nicanor  Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793440700830'
WHERE nombre = 'Nieto Extra Brut' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793440001999'
WHERE nombre = 'Emilia Spumante' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793440001432'
WHERE nombre = 'Nieto Senet. Torrontes' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793440001104'
WHERE nombre = 'Benjamin Rose' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793440000633'
WHERE nombre = 'Nieto Senet.  Rose' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793440000619'
WHERE nombre = 'Benjamin Tardio Blanco' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793440000558'
WHERE nombre = 'Nieto Reserva Syar -Cab' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793440000329'
WHERE nombre = 'Emilia Malbec Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793440000305'
WHERE nombre = 'Emilia Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793440000251'
WHERE nombre = 'Emilia Rose' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793440000206'
WHERE nombre = 'Emilia Chardonnay Viognier' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793440000060'
WHERE nombre = 'Nieto Malbec Doc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793440000053'
WHERE nombre = 'Nieto Senet.  Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793440000046'
WHERE nombre = 'Nieto Senet.  Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793440000039'
WHERE nombre = 'Nieto Senet.  Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793440000022'
WHERE nombre = 'Nieto Senet.  Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793359000106'
WHERE nombre = 'Domingo Hnos Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793359000069'
WHERE nombre = 'Domingo Hnos Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7793214000654'
WHERE nombre = 'Cicchitti Nectar' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7792756200348'
WHERE nombre = 'Altas Cumbres Viognier' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7792756200331'
WHERE nombre = 'Altas Cumbres Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7792756200324'
WHERE nombre = 'Altas Cumbres  Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7792756010046'
WHERE nombre = 'Lagarde Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7792756010022'
WHERE nombre = 'Lagarde Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7792756010015'
WHERE nombre = 'Lagarde Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7792756001426'
WHERE nombre = 'Guarda Sisters Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7792756001310'
WHERE nombre = 'Guarda Sisters Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7792756001136'
WHERE nombre = 'Guarda Estuche Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7792756001099'
WHERE nombre = 'Guarda Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7792756001020'
WHERE nombre = 'Altas Cumbres Estuche Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7792756000726'
WHERE nombre = 'Altas Cumbres  Estuche' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7792756000689'
WHERE nombre = 'Lagarde Estuche Cabernet X 1' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7792756000627'
WHERE nombre = 'Altas Cumbres Extra Brut' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7792756000573'
WHERE nombre = 'Lagarde Dolce' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7792756000344'
WHERE nombre = 'Lagarde Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7792756000337'
WHERE nombre = 'Lagarde Viognier' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7792756000139'
WHERE nombre = 'Guarda Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7792319970213'
WHERE nombre = 'Norton Gruner Vetliner' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7792319969880'
WHERE nombre = 'Norton Altura White Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7792319969569'
WHERE nombre = 'Norton Altura Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7792319064073'
WHERE nombre = 'Norton Tardio' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7792319004192'
WHERE nombre = 'Norton Quorum Vi' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7792319003164'
WHERE nombre = 'Norton Elegido Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7792319002976'
WHERE nombre = 'Norton Tardio Tinto' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7792319001917'
WHERE nombre = 'Dalton Tinto' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7792103160297'
WHERE nombre = 'Lorca Fantasia Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791843019917'
WHERE nombre = 'Antonieta Rose Falasco' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791843019863'
WHERE nombre = 'Los Haroldos Reserva. Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791843019849'
WHERE nombre = 'Antonieta Sparkling Wine Falasco' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791843019825'
WHERE nombre = 'Chateau Subsonico Falasco' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791843019436'
WHERE nombre = 'Hermandad Winemakers P. Verdot Falasco' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791843019429'
WHERE nombre = 'Hermandad Winemakers P. Noir Falasco' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791843019337'
WHERE nombre = 'Ferus Blanc de Blancs Falasco' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791843019313'
WHERE nombre = 'Fausto Malbec Falasco' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791843019290'
WHERE nombre = 'Ferus Malbec Falasco' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791843014813'
WHERE nombre = 'Los Haroldos Gran Corte' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791843012642'
WHERE nombre = 'Hermandad Blend Falasco' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791843012635'
WHERE nombre = 'Hermandad Malbec Falasco' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791843009048'
WHERE nombre = 'Nampe Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791843008911'
WHERE nombre = 'Nampe Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791843005226'
WHERE nombre = 'Los Haroldos Reserva Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791843005002'
WHERE nombre = 'Los Haroldos Reserva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791843004982'
WHERE nombre = 'Los Haroldos Reserva Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791843004166'
WHERE nombre = 'Los Haroldos Espumante' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791842014554'
WHERE nombre = 'Hermandad Chardonnay Falasco' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728238952'
WHERE nombre = 'Alambrado Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728235364'
WHERE nombre = 'Santa Julia 187' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728233490'
WHERE nombre = 'Santa Julia Selección Mundial' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728233155'
WHERE nombre = 'Textual Teroldego Zuccardi' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728233124'
WHERE nombre = 'Sta Julia Innovación Marselan' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728232196'
WHERE nombre = 'Fuzion Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728021875'
WHERE nombre = 'Santa Julia Brut Rosé' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728021424'
WHERE nombre = 'Textual Carmenere Zuccardi' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728021301'
WHERE nombre = 'Zuccardi Seria A Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728021028'
WHERE nombre = 'Santa Julia Rva Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728020953'
WHERE nombre = 'Alma 4 Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728020205'
WHERE nombre = 'Textual Ancellotta Zuccardi' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728019407'
WHERE nombre = 'Santa Julia Extra Brut' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728018264'
WHERE nombre = 'Textual Caladoc Zuccardi' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728010961'
WHERE nombre = 'Polígonos Verdejo' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728010763'
WHERE nombre = 'Cruce de Los Andes' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728010534'
WHERE nombre = 'Santa Julia Tintillo' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728009231'
WHERE nombre = 'Sta Julia Innovación Aglianico' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728009200'
WHERE nombre = 'Julia Dulce' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728008845'
WHERE nombre = 'Concreto Malbec Zuccardi' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728008128'
WHERE nombre = 'Santa Julia Rva Malbec-Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728007763'
WHERE nombre = 'Polígonos Sauvignon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728007664'
WHERE nombre = 'Sta Julia Innovación Pecorino' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728007640'
WHERE nombre = 'Sta Julia Innovacion Graciano' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728007299'
WHERE nombre = 'Textual Albariño Zuccardi' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728006049'
WHERE nombre = 'Santa Julia Brut Nature' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728005165'
WHERE nombre = 'Santa Julia Dulce Tinto' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728004496'
WHERE nombre = 'Alambrado Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728004366'
WHERE nombre = 'Alambrado Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728003369'
WHERE nombre = 'Sta Julia Innovación Fiano' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728003178'
WHERE nombre = 'Sta Julia Innovación Arinarnoa' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728003130'
WHERE nombre = 'Sta Julia Innovacón Touriga Nacional' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728002478'
WHERE nombre = 'Malamado Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728002409'
WHERE nombre = 'Santa Julia Magna Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728001761'
WHERE nombre = 'Santa Julia Magna Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728001747'
WHERE nombre = 'Santa Julia Magna Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728001723'
WHERE nombre = 'Fuzion Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728001259'
WHERE nombre = 'Santa Julia Rva Tempranillo' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728000962'
WHERE nombre = 'Zuccardi Q Tempranillo' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728000566'
WHERE nombre = 'Santa Julia Rva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728000535'
WHERE nombre = 'Santa Julia Rva Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728000160'
WHERE nombre = 'Santa Julia Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728000146'
WHERE nombre = 'Santa Julia Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791728000115'
WHERE nombre = 'Santa Julia Chenin Dulce' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791670021015'
WHERE nombre = 'Pascual Toso Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791670021008'
WHERE nombre = 'Pascual Toso Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791670003738'
WHERE nombre = 'Pascual Toso Reserva Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791670000973'
WHERE nombre = 'Barrancas Toso' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791670000812'
WHERE nombre = 'Toso Extra Brut' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791540047008'
WHERE nombre = 'Dadá 5 Moscato' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791540045745'
WHERE nombre = 'Dadá N° 7' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791540044540'
WHERE nombre = 'Alma Mora Dulce' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791540044526'
WHERE nombre = 'Dadá N° 3' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791540044519'
WHERE nombre = 'Dadá N° 2' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791540044502'
WHERE nombre = 'Dadá N° 1' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791203002061'
WHERE nombre = 'Finca La Linda Dulce' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791203001699'
WHERE nombre = 'Finca La Linda High Vines Sauvignon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791203001682'
WHERE nombre = 'Finca La Linda Smart Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791203001323'
WHERE nombre = 'Finca La Linda Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791203001286'
WHERE nombre = 'Gala 3' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791203001248'
WHERE nombre = 'Luigi Bosca Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791203001231'
WHERE nombre = 'Luigi Bosca Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791203001170'
WHERE nombre = 'Gala 2 Cab Sau - Cab Franc - Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791203001156'
WHERE nombre = 'Gala 1' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791203001125'
WHERE nombre = 'Finca La Linda Extra Brut' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791203000920'
WHERE nombre = 'Luigi Bosca Brut' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791203000906'
WHERE nombre = 'Finca La Linda Tempranillo' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791203000852'
WHERE nombre = 'Finca La Linda Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791203000678'
WHERE nombre = 'Luigi Bosca Terroir Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791203000647'
WHERE nombre = 'Luigi Bosca Cabernet Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791203000623'
WHERE nombre = 'Luigi Bosca Grand Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791203000531'
WHERE nombre = 'Finca La Linda Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791203000524'
WHERE nombre = 'Finca La Linda Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791203000517'
WHERE nombre = 'Finca La Linda Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791203000500'
WHERE nombre = 'Finca La Linda Brut Nature' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791203000159'
WHERE nombre = 'Gala 4' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791203000142'
WHERE nombre = 'Luigi Bosca Malbec D.O.C.' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791203000104'
WHERE nombre = 'Luigi Bosca de Sangre' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791203000081'
WHERE nombre = 'La Linda Corte Reservado Tinto' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7791203000036'
WHERE nombre = 'Luigi Bosca Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790950127034'
WHERE nombre = 'Gancia Italian Secco' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790945003527'
WHERE nombre = 'Nina Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790945002995'
WHERE nombre = 'Nina Cabernet Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '77908438'
WHERE nombre = 'Dorado Espumante' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790843001410'
WHERE nombre = 'Banda 3 Sucios Petit Verdot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790843001403'
WHERE nombre = 'Banda 3 Sucios Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790843001397'
WHERE nombre = 'Banda 3 Sucios Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790843001366'
WHERE nombre = 'Prisionero Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790843001281'
WHERE nombre = 'Vicentin Robusto' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790843001212'
WHERE nombre = 'Dorado Sauvignon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790843001199'
WHERE nombre = 'Reto Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790843001151'
WHERE nombre = 'Reto Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790843001144'
WHERE nombre = 'Vicentin Blend de Mabecs' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790843001083'
WHERE nombre = 'Vicentin Rosado de Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790843000574'
WHERE nombre = 'Vicentin Blanc de Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790843000239'
WHERE nombre = 'Arrogante Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790843000208'
WHERE nombre = 'Reto Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790805550116'
WHERE nombre = 'Intimo Family Reserve' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790805200257'
WHERE nombre = 'Canale Espumante Rosado Dulce' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790805200202'
WHERE nombre = 'Canale Extra Brut' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790805150521'
WHERE nombre = 'Canale Old Riesling' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790805150514'
WHERE nombre = 'Canale Old Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790805150507'
WHERE nombre = 'Canale Old Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790805131421'
WHERE nombre = 'Canale Estate Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790805131230'
WHERE nombre = 'Intimo Sauvignon Semillon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790805131223'
WHERE nombre = 'Intimo  Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790805131216'
WHERE nombre = 'Intimo Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790805131179'
WHERE nombre = 'Blush' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790805131162'
WHERE nombre = 'Intimo Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790805125215'
WHERE nombre = 'Marcus Estuche X 2' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790805125208'
WHERE nombre = 'Canale Magnun Estuche' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790805120746'
WHERE nombre = 'Marcus Gran Reserva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790805120739'
WHERE nombre = 'Marcus Gran Reserva Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790805120722'
WHERE nombre = 'Marcus Gran Reserva Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790805120692'
WHERE nombre = 'Marcus Gran Reserva Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790805120128.'
WHERE nombre = 'Canale Estate Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790805120104'
WHERE nombre = 'Canale Estate Sauvignon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790805120067'
WHERE nombre = 'Canale Estate Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790805120043'
WHERE nombre = 'Canale Estate Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790805120029'
WHERE nombre = 'Marcus Sauvignon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790805012027'
WHERE nombre = 'Marcus Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790805012010'
WHERE nombre = 'Marcus Merlot' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790805010016'
WHERE nombre = 'Marcus Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790805000390'
WHERE nombre = 'Old Vineyard Semillon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790805000376'
WHERE nombre = 'Canale Estate Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790805000017'
WHERE nombre = 'Marcus Dulce Natural' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790703100321'
WHERE nombre = 'Don Valentin' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790470083766'
WHERE nombre = 'Gestos Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790470083728'
WHERE nombre = 'Gran Caballero Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790470083698'
WHERE nombre = 'Gestos Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790470083247'
WHERE nombre = 'Misterio Red Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790470083216'
WHERE nombre = 'Misterio Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790470083186'
WHERE nombre = 'Misterio Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790470083124'
WHERE nombre = 'Expresiones Cab. Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790470083094'
WHERE nombre = 'Misterio Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790470081076'
WHERE nombre = 'Tanguero Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790470080369'
WHERE nombre = 'Finca Flichman Reserva Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790470080222'
WHERE nombre = 'Finca Flichman Estate Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790470080208'
WHERE nombre = 'Caballero de La Cepa Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790470080185'
WHERE nombre = 'Caballero de La Cepa Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790470051000'
WHERE nombre = 'Caballero de La Cepa Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790470050454'
WHERE nombre = 'Finca Flichman Reserva Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790470005904'
WHERE nombre = 'Finca Flichman Estate Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790470003405'
WHERE nombre = 'Caballero de La Cepa Red Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790470001555'
WHERE nombre = 'Misterio Sweet Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415130555'
WHERE nombre = 'Circus Roble Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415130531'
WHERE nombre = 'Circus Roble Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415130517'
WHERE nombre = 'Circus Roble Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415129955'
WHERE nombre = 'Pequeñas Producciones Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415129917'
WHERE nombre = 'Pequeñas Producciones Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415129887'
WHERE nombre = 'Pequeñas Producciones Estuche Madera' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415129870'
WHERE nombre = 'Pequeñas Producciones Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415129795'
WHERE nombre = 'Escorihuela Sangiovese' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415129627'
WHERE nombre = 'Escorihuela Special White Pack' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415129122'
WHERE nombre = 'Escorihuela Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415129108'
WHERE nombre = 'Escorihuela Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415129085'
WHERE nombre = 'Escorihuela Gascon Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415129047'
WHERE nombre = 'Circus Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415129009'
WHERE nombre = 'Circus Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415128767'
WHERE nombre = 'F. Gascon Reserva Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415128743'
WHERE nombre = 'F. Gascon Reserva Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415128729'
WHERE nombre = 'F. Gascon Reserva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415128705'
WHERE nombre = 'Escorihuela Gascon Sauvignon Blanc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415128606'
WHERE nombre = 'Familia Gascon Tempranillo' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415128255'
WHERE nombre = 'Escorihuela Gascon Extra Brut' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415128231'
WHERE nombre = 'Familia Gascon Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415128217'
WHERE nombre = 'Familia Gascon Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415128033'
WHERE nombre = 'Familia Gascon Rose' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415128019'
WHERE nombre = 'Familia Gascon Extra Brut' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415127814'
WHERE nombre = 'Familia Gascon Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415127777'
WHERE nombre = 'Familia Gascon Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415127548'
WHERE nombre = 'Carcassone Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415126589'
WHERE nombre = 'Escorihuela Madera Por 3 Cab-Mal-Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415126060'
WHERE nombre = 'Escorihuela Gascon Viognier' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415126039'
WHERE nombre = 'Familia Gascon Extra Brut Lata' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415005747'
WHERE nombre = 'Escorihuela Gascon Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415004016'
WHERE nombre = 'Pequeñas Producciones Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415003996'
WHERE nombre = 'Circus Juno Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415002302'
WHERE nombre = 'Pequeñas Producciones Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415001961'
WHERE nombre = 'Gascon Rose & Dulce' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415001916'
WHERE nombre = 'Escorihuela Gascon Gran Reserva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415001480'
WHERE nombre = 'Escorihuela Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415001138'
WHERE nombre = 'Escorihuela Special Pink Pack' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415001114'
WHERE nombre = 'Pequeñas Producciones Rose Extra Brut' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415001053'
WHERE nombre = 'Pequeñas Producciones Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415000995'
WHERE nombre = 'F. Reserva Gascon Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415000896'
WHERE nombre = 'Sol Amante Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415000872'
WHERE nombre = 'Sol Amante Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415000834'
WHERE nombre = 'Escorihuela Special Black Pack' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790415000469'
WHERE nombre = 'Familia Gascon Tardio' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790336034505'
WHERE nombre = 'Bodegas Lopez Montchenot 10 Años' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790336034192'
WHERE nombre = 'Bodegas Lopez Montchenot 5 Años' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790314056598'
WHERE nombre = 'Estancia Cab-Mal' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790314056116'
WHERE nombre = 'Estancia Varietal Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790314056109'
WHERE nombre = 'Estancia Varietal Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790314055386'
WHERE nombre = 'Estancia Mal-Mer' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790314001475'
WHERE nombre = 'Dulce Magnolia' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790240492910'
WHERE nombre = 'Marianne Estuche X 1' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790240442106'
WHERE nombre = 'Alma Mora Estuche X 1' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790240140491'
WHERE nombre = 'Las Moras Reserva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790240140255'
WHERE nombre = 'Mora Negra' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790240128604'
WHERE nombre = 'Finca Las Moras Viognier' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790240128598'
WHERE nombre = 'Finca Las Moras Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790240128581'
WHERE nombre = 'Finca Las Moras Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790240128574'
WHERE nombre = 'Finca Las Moras Cabernet Sauvigno' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790240128567'
WHERE nombre = 'Las Moras Reserva Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790240095296'
WHERE nombre = 'Imago Red Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790240095265'
WHERE nombre = 'Imago Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790240095258'
WHERE nombre = 'Imago Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790240093797'
WHERE nombre = 'Paz Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790240093780'
WHERE nombre = 'Paz Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790240093773'
WHERE nombre = 'Paz Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790240093766'
WHERE nombre = 'Paz Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790240093001'
WHERE nombre = 'Demencial Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790240092929'
WHERE nombre = 'Marianne Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790240092912'
WHERE nombre = 'Marianne Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790240042108'
WHERE nombre = 'Alma Mora Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790240042092'
WHERE nombre = 'Alma Mora Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790240042085'
WHERE nombre = 'Alma Mora Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790240041705'
WHERE nombre = 'Las Moras Gran Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790240041682'
WHERE nombre = 'Las Moras Reserva Syrah' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790189042030'
WHERE nombre = 'Don David Reserva Cabernet Sauvingon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790189042023'
WHERE nombre = 'Don David Reserva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790189040111'
WHERE nombre = 'Don David Tannat' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790119002233'
WHERE nombre = 'Real Etiqueta Negra' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790119000444'
WHERE nombre = 'Saenz Briones 1888' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790119000352'
WHERE nombre = 'Real Vasija Especial Roble' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790093128073'
WHERE nombre = 'Cafayate Gran Linaje Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790093095221'
WHERE nombre = 'Cafayate Reserva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790093075780'
WHERE nombre = 'Cafayate Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790093075773'
WHERE nombre = 'Cafayate Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790093075766'
WHERE nombre = 'Cafayate Tardio' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7790093075759'
WHERE nombre = 'Cafayate Torrontes' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '778108833356'
WHERE nombre = 'Pyros Appellation Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7730437000153'
WHERE nombre = 'Pisano Tannat' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7730135001988'
WHERE nombre = 'Atlantico Sur Pinot Noir Familia Deicas' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7730135001667'
WHERE nombre = 'Atlantico Sur  Tannat Deicas Familia Deicas' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '7730135000080'
WHERE nombre = 'Familia Deicas Preludio Blend Tinto' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '752183280945'
WHERE nombre = '505 Esencia Red Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '742832994637'
WHERE nombre = 'Gran Sombrero Malbec Huentala' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '742832994620'
WHERE nombre = 'Zorro Salvaje Cab. Sauv. Huentala' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '742832994613'
WHERE nombre = 'Zorro Salvaje Malbec Huentala' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '742832994606'
WHERE nombre = 'Zorro Salvaje Sauv. Blanc Huentala' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '742832932592'
WHERE nombre = 'Sombrero Cab.Franc Huentala' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '742832932547'
WHERE nombre = 'Huentala Black Series Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '742832932516'
WHERE nombre = 'Gran Sombrero Cab. Franc Huentala' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '742832932509'
WHERE nombre = 'Gran Sombrero Cabernet Sauvignon Huentala' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '742832741682'
WHERE nombre = 'Huentala La Isabel Cabernet Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '742832741668'
WHERE nombre = 'Huentala Hotel Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '742832741651'
WHERE nombre = 'Hotel Extra Brut Rosé' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '742832675123'
WHERE nombre = 'Huentala Hotel Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '742832675116'
WHERE nombre = 'Sombrero Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '742832490238'
WHERE nombre = 'Sombrero Malbec Huentala' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '742832490238'
WHERE nombre = 'Sombrero Sauvignon Blanc Huentala' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '742832490221'
WHERE nombre = 'Huentala Block 19 & 20' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '742832134064'
WHERE nombre = 'Sombrero Extra Brut Pinot Noir Huentala' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '742832134057'
WHERE nombre = 'Zorro Salvaje Rose Huentala' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '742832134040'
WHERE nombre = 'Gran Sombrero Chardonnay Huentala' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '736040504177'
WHERE nombre = 'Durigutti Bonarda' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '722598249493'
WHERE nombre = 'Ricardo Santos Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '721450779734'
WHERE nombre = 'Alba En Los Andes Rva Cab. Franc' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '716898963630'
WHERE nombre = 'A Lisa' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '715126900133'
WHERE nombre = 'Montes Pinot Noir' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '715126000123'
WHERE nombre = 'Montes Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '715126000031'
WHERE nombre = 'Montes Outer Limitis Cinsault' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '715126000000'
WHERE nombre = 'Montes Twins' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '648260490737'
WHERE nombre = 'Alba En Los Andes Rva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '648260490720'
WHERE nombre = 'Alba En Los Andes Finca Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '648260490713'
WHERE nombre = 'Alba En Los Andes Chardonnay' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '37798104763030'
WHERE nombre = 'Amalaya Tri Pack' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '37798057480190'
WHERE nombre = 'Alta Vista Premium Magnun' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '3760188020500'
WHERE nombre = 'Vicentin Champagne' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '3760131252514'
WHERE nombre = 'Blason D´Ausseres Corbieres' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '3760131251418'
WHERE nombre = 'Châtheau D´Aussieres' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '3760111814206'
WHERE nombre = 'Poesia Paso Doble' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '3760111812165'
WHERE nombre = 'Poesia 2006' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '3760111812141'
WHERE nombre = 'Poesia Cuvée Héléne' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '3662386111519'
WHERE nombre = 'Aussieres Rouge' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '3378635011126'
WHERE nombre = 'Conquista Torrontes' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '3296324215108'
WHERE nombre = 'Legende Bordeux Rouge' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '17798116201540'
WHERE nombre = 'Wapisa Underwater' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '14876010069'
WHERE nombre = 'Tolentino Sauvignon Blanc Cuarto Dominio' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '1213134654657'
WHERE nombre = 'Cocodrilo Corte 2012' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '098709086760'
WHERE nombre = 'Punto Final Sauvig. Blanc Renacer' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '098709085633'
WHERE nombre = 'Renacer Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '098709085626'
WHERE nombre = 'Punto Final Rva. Malbec Renacer' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '089419005547'
WHERE nombre = 'Tinto Negro 1955 Vineyard' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '089419005530'
WHERE nombre = 'Tinto Negro Finca La Escuela' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '089419005516'
WHERE nombre = 'Tinto Negro Uco Valley Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '089419005509'
WHERE nombre = 'Tinto Negro Lujan' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '089419005462'
WHERE nombre = 'Tinto Negro La Arena' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '089419005455'
WHERE nombre = 'Tinto Negro La Grava' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '089419005448'
WHERE nombre = 'Tinto Negro El Limo' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '089419005431'
WHERE nombre = 'Tinto Negro La Piedra' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '085000016145'
WHERE nombre = 'Don Miguel Gascon Malbec Exp' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '084692501649'
WHERE nombre = 'Taittinger Brut Reserve' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '084279982151'
WHERE nombre = 'Conquista Oak Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '084279976488'
WHERE nombre = 'Conquista Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '084279974040'
WHERE nombre = 'Conquista Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '0798190101170'
WHERE nombre = 'Bad Brothers Facón Cab. Sau. A. Lanuús' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '07798124860305'
WHERE nombre = 'Miss Charlen Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '07795119000197'
WHERE nombre = 'Vas Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '076625285528'
WHERE nombre = 'Ladran Sancho Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '076625218496'
WHERE nombre = 'Sunal Ilogico Criolla A. Lanús' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '0742832134033'
WHERE nombre = 'Zorro Salvaje Blend Huentala' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '015643415265'
WHERE nombre = 'Sur de Los Andes Rva Malbec' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '015643415258'
WHERE nombre = 'Sur de Los Andes Rva Cabernet Sauvignon' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '015643415241'
WHERE nombre = 'Sur de Los Andes Rva Blend' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '00850919003100'
WHERE nombre = 'Maula Sauvignon Blanc Oak' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '00850919003094'
WHERE nombre = 'Maula Malbec Oak' AND (codigo_barras IS NULL OR codigo_barras = '');
UPDATE productos SET codigo_barras = '0076625218496'
WHERE nombre = 'Sunal Ilogico Malbec A. Lanús' AND (codigo_barras IS NULL OR codigo_barras = '');
