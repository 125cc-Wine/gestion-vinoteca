-- Insertar productos no-vino con codigo de barras
-- Generado desde: Productos+Codigo de Barra.csv

INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bulldog Gin', '', 'Gin', 'Otro', '10027', '897076002010', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bulldog Gin', '', 'Gin', 'Otro', '10027', '897076002010', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Grolsch Porron 330', '', 'Importadas', 'Otro', '10421', '87167474', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Grolsch Porron 330', '', 'Importadas', 'Otro', '10421', '87167474', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Grolsch 450', '', 'Importadas', 'Otro', '10420', '87167016', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Grolsch 450', '', 'Importadas', 'Otro', '10420', '87167016', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Havana Dorado', '', 'Ron', 'Otro', '10810', '8501110080910', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Havana Dorado', '', 'Ron', 'Otro', '10810', '8501110080910', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Havana 7 Anos', '', 'Ron', 'Otro', '10811', '8501110080446', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Havana 7 Anos', '', 'Ron', 'Otro', '10811', '8501110080446', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Havana 3 Años Litro', '', 'Ron', 'Otro', '10826', '8501110080255', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Havana 3 Años Litro', '', 'Ron', 'Otro', '10826', '8501110080255', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Havana  3 Años 750 Cc', '', 'Ron', 'Otro', '10809', '8501110080248', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Havana  3 Años 750 Cc', '', 'Ron', 'Otro', '10809', '8501110080248', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Ron Mulata Palma Superior', '', 'Ron', 'Otro', '17', '8500000654743', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Ron Mulata Palma Superior', '', 'Ron', 'Otro', '17', '8500000654743', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Ron Mulata Silver Dry', '', 'Ron', 'Otro', '16', '8500000650349', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Ron Mulata Silver Dry', '', 'Ron', 'Otro', '16', '8500000650349', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Yzaguirre Reserva', '', 'Aperitivos', 'Otro', '8752', '8425327100165', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Yzaguirre Reserva', '', 'Aperitivos', 'Otro', '8752', '8425327100165', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Yzaguirre Blanco', '', 'Aperitivos', 'Otro', '8751', '8425327100141', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Yzaguirre Blanco', '', 'Aperitivos', 'Otro', '8751', '8425327100141', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Yzaguirre Rojo', '', 'Aperitivos', 'Otro', '8750', '8425327100127', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Yzaguirre Rojo', '', 'Aperitivos', 'Otro', '8750', '8425327100127', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Estrella Galicia Bot', '', 'Importadas', 'Otro', '10401', '8412598074219', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Estrella Galicia Bot', '', 'Importadas', 'Otro', '10401', '8412598074219', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Estuche Estrella Galicia + Copa', '', 'Importadas', 'Otro', '10402', '8412598029806', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Estuche Estrella Galicia + Copa', '', 'Importadas', 'Otro', '10402', '8412598029806', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Estrella Galicia Lata', '', 'Importadas', 'Otro', '10405', '8412598000348', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Estrella Galicia Lata', '', 'Importadas', 'Otro', '10405', '8412598000348', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Gin Mare', '', 'Gin', 'Otro', '10901', '8411640000459', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Gin Mare', '', 'Gin', 'Otro', '10901', '8411640000459', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Estrella Damm', '', 'Importadas', 'Otro', '10409', '8410793282934', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Estrella Damm', '', 'Importadas', 'Otro', '10409', '8410793282934', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Voll Damm', '', 'Importadas', 'Otro', '10410', '8410793032935', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Voll Damm', '', 'Importadas', 'Otro', '10410', '8410793032935', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Gin Mom Royal Rocks Purity', '', 'Gin', 'Otro', '8758', '8410023096850', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Gin Mom Royal Rocks Purity', '', 'Gin', 'Otro', '8758', '8410023096850', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'The London N° 1 Sherry Cask Gin', '', 'Gin', 'Otro', '8759', '8410023095570', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'The London N° 1 Sherry Cask Gin', '', 'Gin', 'Otro', '8759', '8410023095570', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Gin Mom Royal Smoothnes', '', 'Gin', 'Otro', '8754', '8410023032230', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Gin Mom Royal Smoothnes', '', 'Gin', 'Otro', '8754', '8410023032230', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Pampero Blanco', '', 'Ron', 'Otro', '10511', '8028286000202', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Pampero Blanco', '', 'Ron', 'Otro', '10511', '8028286000202', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Liquore Strega', '', 'Licores', 'Otro', '2517', '80220718', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Liquore Strega', '', 'Licores', 'Otro', '2517', '80220718', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Caña Legui', '', 'Generosos', 'Otro', '12', '8008513064016', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Caña Legui', '', 'Generosos', 'Otro', '12', '8008513064016', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Grappa Del Contadino', '', 'Whiskies', 'Otro', '10893', '8006063003974', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Grappa Del Contadino', '', 'Whiskies', 'Otro', '10893', '8006063003974', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Napoleón Brandy', '', 'Whiskies', 'Otro', '10899', '8006063000102', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Napoleón Brandy', '', 'Whiskies', 'Otro', '10899', '8006063000102', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Grappepe', '', 'Whiskies', 'Otro', '10894', '8004499050869', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Grappepe', '', 'Whiskies', 'Otro', '10894', '8004499050869', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Sambucca Borghetti', '', 'Licores', 'Otro', '10886', '8004400070375', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Sambucca Borghetti', '', 'Licores', 'Otro', '10886', '8004400070375', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Frangelico Liqueur', '', 'Licores', 'Otro', '10887', '8004160660304', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Frangelico Liqueur', '', 'Licores', 'Otro', '10887', '8004160660304', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Capizzano', '', 'Aperitivos', 'Otro', '10208', '8004160152182', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Capizzano', '', 'Aperitivos', 'Otro', '10208', '8004160152182', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'San Pellegrino Acqua Tonica Lata', '', 'Generico', 'Otro', 'TON6', '8002270916588', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'San Pellegrino Acqua Tonica Lata', '', 'Generico', 'Otro', 'TON6', '8002270916588', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Blue Moon', '', 'Importadas', 'Otro', '10117', '8001435310018', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Blue Moon', '', 'Importadas', 'Otro', '10117', '8001435310018', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Disaronno', '', 'Licores', 'Otro', '7052', '8001110004003', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Disaronno', '', 'Licores', 'Otro', '7052', '8001110004003', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Martini Bitter', '', 'Aperitivos', 'Otro', '10210', '8000570006046', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Martini Bitter', '', 'Aperitivos', 'Otro', '10210', '8000570006046', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Ferrero X 24', '', 'Generico', 'Otro', 'F05', '8000500009673', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Ferrero X 24', '', 'Generico', 'Otro', 'F05', '8000500009673', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Amaro Averna', '', 'Aperitivos', 'Otro', '10025', '8000400203782', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Amaro Averna', '', 'Aperitivos', 'Otro', '10025', '8000400203782', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Luxardo Grappa', '', 'Cachaca', 'Otro', '10907', '8000353006232', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Luxardo Grappa', '', 'Cachaca', 'Otro', '10907', '8000353006232', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Luxardo Triple Sec', '', 'Licores', 'Otro', '10903', '8000353005112', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Luxardo Triple Sec', '', 'Licores', 'Otro', '10903', '8000353005112', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Luxardo Angioletto', '', 'Licores', 'Otro', '10906', '8000353003217', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Luxardo Angioletto', '', 'Licores', 'Otro', '10906', '8000353003217', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Cinzano 1757 Bianco', '', 'Aperitivos', 'Otro', '10021', '8000020175766', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Cinzano 1757 Bianco', '', 'Aperitivos', 'Otro', '10021', '8000020175766', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Ferrero X 4', '', 'Generico', 'Otro', 'F02', '7898024397861', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Ferrero X 4', '', 'Generico', 'Otro', 'F02', '7898024397861', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Ferrero X 12', '', 'Generico', 'Otro', 'F04', '7898024396994', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Ferrero X 12', '', 'Generico', 'Otro', 'F04', '7898024396994', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Nutella 140 Gr', '', 'Generico', 'Otro', 'NUT01', '7898024395232', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Nutella 140 Gr', '', 'Generico', 'Otro', 'NUT01', '7898024395232', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Nutella 350 Gr.', '', 'Generico', 'Otro', 'NUT02', '7898024394181', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Nutella 350 Gr.', '', 'Generico', 'Otro', 'NUT02', '7898024394181', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Ferrero X16', '', 'Generico', 'Otro', 'F06', '7898024390107', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Ferrero X16', '', 'Generico', 'Otro', 'F06', '7898024390107', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Velho Barreiro', '', 'Cachaca', 'Otro', '61', '7896050200131', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Velho Barreiro', '', 'Cachaca', 'Otro', '61', '7896050200131', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Sky Infusions', '', 'Vodka', 'Otro', '10232', '7896010004526', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Sky Infusions', '', 'Vodka', 'Otro', '10232', '7896010004526', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Cachaca 51', '', 'Ron', 'Otro', '10229', '7896002108133', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Cachaca 51', '', 'Ron', 'Otro', '10229', '7896002108133', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Aperol', '', 'Aperitivos', 'Otro', '10009', '7891136057029', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Aperol', '', 'Aperitivos', 'Otro', '10009', '7891136057029', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Campari', '', 'Aperitivos', 'Otro', '10002', '7891136052000', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Campari', '', 'Aperitivos', 'Otro', '10002', '7891136052000', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Malibu', '', 'Licores', 'Otro', '10859', '7891050004741', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Malibu', '', 'Licores', 'Otro', '10859', '7891050004741', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Ferrero X 3', '', 'Generico', 'Otro', 'F01', '78909434', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Ferrero X 3', '', 'Generico', 'Otro', 'F01', '78909434', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Ferrero X 8', '', 'Generico', 'Otro', 'F03', '7861002900117', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Ferrero X 8', '', 'Generico', 'Otro', 'F03', '7861002900117', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Mistral Nobel 40°', '', 'Tequila', 'Otro', '10122', '7802175453253', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Mistral Nobel 40°', '', 'Tequila', 'Otro', '10122', '7802175453253', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Mistral Pisco 35°', '', 'Tequila', 'Otro', '10114', '7802175001065', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Mistral Pisco 35°', '', 'Tequila', 'Otro', '10114', '7802175001065', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Kutsman Lager', '', 'Nacionales', 'Otro', '10109', '7802107001392', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Kutsman Lager', '', 'Nacionales', 'Otro', '10109', '7802107001392', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Kutsman Bock', '', 'Importadas', 'Otro', '10108', '7802107001361', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Kutsman Bock', '', 'Importadas', 'Otro', '10108', '7802107001361', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Kutsman Valdivia', '', 'Importadas', 'Otro', '10106', '7802107000197', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Kutsman Valdivia', '', 'Importadas', 'Otro', '10106', '7802107000197', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Kutsman Gran Torobayo', '', 'Importadas', 'Otro', '10107', '7802107000074', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Kutsman Gran Torobayo', '', 'Importadas', 'Otro', '10107', '7802107000074', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Eristoff', '', 'Vodka', 'Otro', '10206', '7802105055229', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Eristoff', '', 'Vodka', 'Otro', '10206', '7802105055229', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Hilbing Pink Gin', '', 'Gin', 'Otro', '10719', '77988141040094', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Hilbing Pink Gin', '', 'Gin', 'Otro', '10719', '77988141040094', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Principe de Los Apostoles Fuerza Gaucha', '', 'Gin', 'Otro', '10137', '7798196850297', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Principe de Los Apostoles Fuerza Gaucha', '', 'Gin', 'Otro', '10137', '7798196850297', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Giovannoni Rosso Bonarda', '', 'Aperitivos', 'Otro', '10135', '7798196850266', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Giovannoni Rosso Bonarda', '', 'Aperitivos', 'Otro', '10135', '7798196850266', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Giovannoni Dry Torrontes', '', 'Aperitivos', 'Otro', '10134', '7798196850259', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Giovannoni Dry Torrontes', '', 'Aperitivos', 'Otro', '10134', '7798196850259', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Principe de Los Apostoles Rosa Mosqueta', '', 'Gin', 'Otro', '10131', '7798196850242', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Principe de Los Apostoles Rosa Mosqueta', '', 'Gin', 'Otro', '10131', '7798196850242', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Pan Vodka', '', 'Vodka', 'Otro', '10132', '7798196850211', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Pan Vodka', '', 'Vodka', 'Otro', '10132', '7798196850211', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Ginebra El Profeta', '', 'Ginebra', 'Otro', '10133', '7798196850129', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Ginebra El Profeta', '', 'Ginebra', 'Otro', '10133', '7798196850129', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Pulpo Blanco Ginger 500cc', '', 'Generico', 'Otro', 'TON8', '7798196850068', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Pulpo Blanco Ginger 500cc', '', 'Generico', 'Otro', 'TON8', '7798196850068', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Pulpo Blanco Tonica 500cc', '', 'Generico', 'Otro', 'TON7', '7798196850051', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Pulpo Blanco Tonica 500cc', '', 'Generico', 'Otro', 'TON7', '7798196850051', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Principe de Los Apostoles', '', 'Gin', 'Otro', '10136', '7798196850013', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Principe de Los Apostoles', '', 'Gin', 'Otro', '10136', '7798196850013', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Master Ship Licor de Hierbas', '', 'Licores', 'Otro', '10332', '7798194770061', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Master Ship Licor de Hierbas', '', 'Licores', 'Otro', '10332', '7798194770061', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Nero 53 Berries', '', 'Fernet', 'Otro', '10298', '7798194770054', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Nero 53 Berries', '', 'Fernet', 'Otro', '10298', '7798194770054', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Myrica', '', 'Gin', 'Otro', '10333', '7798194770030', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Myrica', '', 'Gin', 'Otro', '10333', '7798194770030', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Nero 53 Barrel Blend', '', 'Fernet', 'Otro', '10299', '7798194770016', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Nero 53 Barrel Blend', '', 'Fernet', 'Otro', '10299', '7798194770016', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Sal de Aqui Ahumada', '', 'Generico', 'Otro', '4734', '77981662600191', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Sal de Aqui Ahumada', '', 'Generico', 'Otro', '4734', '77981662600191', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Sal de Aqui', '', 'Generico', 'Otro', '4733', '7798166260019', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Sal de Aqui', '', 'Generico', 'Otro', '4733', '7798166260019', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'King Maní Salado X 200', '', 'Generico', 'Otro', '10614', '7798151950017', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'King Maní Salado X 200', '', 'Generico', 'Otro', '10614', '7798151950017', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Gin D1313', '', 'Gin', 'Otro', '10200', '7798148780313', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Gin D1313', '', 'Gin', 'Otro', '10200', '7798148780313', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Don Pedro Colsani X 500grs', '', 'Generico', 'Otro', '50403', '7798137050359', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Don Pedro Colsani X 500grs', '', 'Generico', 'Otro', '50403', '7798137050359', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Colsani Cantuccini Almendras', '', 'Generico', 'Otro', '50415', '7798137050304', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Colsani Cantuccini Almendras', '', 'Generico', 'Otro', '50415', '7798137050304', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Pan Dulce 1 Kg', '', 'Generico', 'Otro', '50416', '7798137050151', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Pan Dulce 1 Kg', '', 'Generico', 'Otro', '50416', '7798137050151', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Pan Del Cielo 1 Kg Colsani', '', 'Generico', 'Otro', '50406', '7798137050120', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Pan Del Cielo 1 Kg Colsani', '', 'Generico', 'Otro', '50406', '7798137050120', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Don Pedro Budin 350 Grs', '', 'Generico', 'Otro', '50404', '7798137050106', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Don Pedro Budin 350 Grs', '', 'Generico', 'Otro', '50404', '7798137050106', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Budin Sin Frutas', '', 'Generico', 'Otro', '50412', '7798137050090', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Budin Sin Frutas', '', 'Generico', 'Otro', '50412', '7798137050090', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Budin Chocolate X 350 Grs Colsani', '', 'Generico', 'Otro', '50411', '7798137050083', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Budin Chocolate X 350 Grs Colsani', '', 'Generico', 'Otro', '50411', '7798137050083', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Budin Del Cielo X 250 Grs Colsani', '', 'Generico', 'Otro', '50410', '7798137050076', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Budin Del Cielo X 250 Grs Colsani', '', 'Generico', 'Otro', '50410', '7798137050076', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Don Pedro Colsani 1 Kg.', '', 'Generico', 'Otro', '50402', '7798137050069', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Don Pedro Colsani 1 Kg.', '', 'Generico', 'Otro', '50402', '7798137050069', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Pan Del Cielo Sin Frutas Colsani', '', 'Generico', 'Otro', '50407', '7798137050052', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Pan Del Cielo Sin Frutas Colsani', '', 'Generico', 'Otro', '50407', '7798137050052', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Pan Del Cielo X 500 Grs Colsani', '', 'Generico', 'Otro', '50408', '7798137050045', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Pan Del Cielo X 500 Grs Colsani', '', 'Generico', 'Otro', '50408', '7798137050045', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Pan Del Cielo X 200 Grs Colsani', '', 'Generico', 'Otro', '50409', '7798137050038', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Pan Del Cielo X 200 Grs Colsani', '', 'Generico', 'Otro', '50409', '7798137050038', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Pan Dulce 500 Grs.', '', 'Generico', 'Otro', '50418', '7798137050021', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Pan Dulce 500 Grs.', '', 'Generico', 'Otro', '50418', '7798137050021', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Pan Dulce 700 Grs.', '', 'Generico', 'Otro', '50417', '7798137050014', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Pan Dulce 700 Grs.', '', 'Generico', 'Otro', '50417', '7798137050014', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Chocolart Almendra 70% Cacao', '', 'Generico', 'Otro', '50731', '7798136349331', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Chocolart Almendra 70% Cacao', '', 'Generico', 'Otro', '50731', '7798136349331', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Chocolart Naranja Cob. Semiamarga', '', 'Generico', 'Otro', '50733', '7798136348006', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Chocolart Naranja Cob. Semiamarga', '', 'Generico', 'Otro', '50733', '7798136348006', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Chocolart Arandanos Cob Semiamarga', '', 'Generico', 'Otro', '50732', '7798136347993', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Chocolart Arandanos Cob Semiamarga', '', 'Generico', 'Otro', '50732', '7798136347993', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Chocolart Mani Con Chocolate', '', 'Generico', 'Otro', '50734', '7798136347818', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Chocolart Mani Con Chocolate', '', 'Generico', 'Otro', '50734', '7798136347818', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Chocolart Pasas de Uvas Chocolate', '', 'Generico', 'Otro', '50736', '7798136347610', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Chocolart Pasas de Uvas Chocolate', '', 'Generico', 'Otro', '50736', '7798136347610', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Chocolart Cafe Chocolate', '', 'Generico', 'Otro', '50730', '7798136347504', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Chocolart Cafe Chocolate', '', 'Generico', 'Otro', '50730', '7798136347504', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Chocolart Cereal Con Chocolate', '', 'Generico', 'Otro', '50735', '7798136347290', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Chocolart Cereal Con Chocolate', '', 'Generico', 'Otro', '50735', '7798136347290', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Lunfa Verbena', '', 'Aperitivos', 'Otro', '10286', '7798135763398', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Lunfa Verbena', '', 'Aperitivos', 'Otro', '10286', '7798135763398', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Lunfa Rose', '', 'Aperitivos', 'Otro', '10288', '7798135763114', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Lunfa Rose', '', 'Aperitivos', 'Otro', '10288', '7798135763114', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Heraclito London Gin', '', 'Gin', 'Otro', '10293', '7798135763077', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Heraclito London Gin', '', 'Gin', 'Otro', '10293', '7798135763077', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Lunfa Rojo', '', 'Aperitivos', 'Otro', '10287', '7798135762889', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Lunfa Rojo', '', 'Aperitivos', 'Otro', '10287', '7798135762889', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Absolut Lime', '', 'Vodka', 'Otro', '10830', '7798131200927', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Absolut Lime', '', 'Vodka', 'Otro', '10830', '7798131200927', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Cinzano Rosso', '', 'Aperitivos', 'Otro', '10006', '7798131200828', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Cinzano Rosso', '', 'Aperitivos', 'Otro', '10006', '7798131200828', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Doña Silvina Grappa', '', 'Vodka', 'Otro', '5306', '7798124150178', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Doña Silvina Grappa', '', 'Vodka', 'Otro', '5306', '7798124150178', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Otro Mundo Nut Brown', '', 'Nacionales', 'Otro', '10103', '7798123860078', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Otro Mundo Nut Brown', '', 'Nacionales', 'Otro', '10103', '7798123860078', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Otro Mundo Golden Ale', '', 'Nacionales', 'Otro', '10101', '7798123860047', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Otro Mundo Golden Ale', '', 'Nacionales', 'Otro', '10101', '7798123860047', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Otro Mundo Strong Red', '', 'Nacionales', 'Otro', '10102', '7798123860016', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Otro Mundo Strong Red', '', 'Nacionales', 'Otro', '10102', '7798123860016', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Veneto 750', '', 'Fernet', 'Otro', '10606', '7798110160426', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Veneto 750', '', 'Fernet', 'Otro', '10606', '7798110160426', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bariloche Torta Frutos Secos', '', 'Generico', 'Otro', '50101', '7798094349985', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bariloche Torta Frutos Secos', '', 'Generico', 'Otro', '50101', '7798094349985', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bariloche Lentejas Confitadas', '', 'Generico', 'Otro', '50107', '7798094344232', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bariloche Lentejas Confitadas', '', 'Generico', 'Otro', '50107', '7798094344232', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bariloche Premium Avellana Choco 80 Gs', '', 'Generico', 'Otro', '50133', '7798094340777', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bariloche Premium Avellana Choco 80 Gs', '', 'Generico', 'Otro', '50133', '7798094340777', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bariloche Premium Almendra Choco Bitter', '', 'Generico', 'Otro', '50122', '7798094340715', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bariloche Premium Almendra Choco Bitter', '', 'Generico', 'Otro', '50122', '7798094340715', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bariloche Premium Avellanas Choco Bitter', '', 'Generico', 'Otro', '50123', '7798094340678', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bariloche Premium Avellanas Choco Bitter', '', 'Generico', 'Otro', '50123', '7798094340678', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bosquisima', '', 'Nacionales', 'Otro', '10129', '7798091030305', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bosquisima', '', 'Nacionales', 'Otro', '10129', '7798091030305', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Antares Playa Grande', '', 'Nacionales', 'Otro', '10322', '7798091030169', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Antares Playa Grande', '', 'Nacionales', 'Otro', '10322', '7798091030169', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Antares Imperial Stout', '', 'Nacionales', 'Otro', '10327', '7798091030145', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Antares Imperial Stout', '', 'Nacionales', 'Otro', '10327', '7798091030145', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Antares Barley', '', 'Nacionales', 'Otro', '10320', '7798091030138', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Antares Barley', '', 'Nacionales', 'Otro', '10320', '7798091030138', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Antares Honey', '', 'Nacionales', 'Otro', '10321', '7798091030121', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Antares Honey', '', 'Nacionales', 'Otro', '10321', '7798091030121', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Antares Porter', '', 'Nacionales', 'Otro', '10325', '7798091030114', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Antares Porter', '', 'Nacionales', 'Otro', '10325', '7798091030114', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Antares Scotch', '', 'Nacionales', 'Otro', '10324', '7798091030107', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Antares Scotch', '', 'Nacionales', 'Otro', '10324', '7798091030107', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Antares Kölsch', '', 'Nacionales', 'Otro', '10323', '7798091030077', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Antares Kölsch', '', 'Nacionales', 'Otro', '10323', '7798091030077', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Leonce Criolla Rosado Piedra Negra', '', 'Aperitivos', 'Otro', '10028', '7798081392413', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Leonce Criolla Rosado Piedra Negra', '', 'Aperitivos', 'Otro', '10028', '7798081392413', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Ferrero Corazon', '', 'Generico', 'Otro', 'F07', '7797394001425', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Ferrero Corazon', '', 'Generico', 'Otro', 'F07', '7797394001425', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Miller Lite Lata  473cc', '', 'Importadas', 'Otro', '10428', '7795697619156', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Miller Lite Lata  473cc', '', 'Importadas', 'Otro', '10428', '7795697619156', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Miller Lite Porron', '', 'Nacionales', 'Otro', '14029', '7795697619064', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Miller Lite Porron', '', 'Nacionales', 'Otro', '14029', '7795697619064', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Miller Lite Litro', '', 'Importadas', 'Otro', '14022', '7795697619033', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Miller Lite Litro', '', 'Importadas', 'Otro', '14022', '7795697619033', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Miller 600 Cc', '', 'Importadas', 'Otro', '14023', '7795697615127', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Miller 600 Cc', '', 'Importadas', 'Otro', '14023', '7795697615127', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Warsteiner 600', '', 'Nacionales', 'Otro', '14032', '7795697612775', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Warsteiner 600', '', 'Nacionales', 'Otro', '14032', '7795697612775', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Warsteiner Lata', '', 'Nacionales', 'Otro', '14028', '7795697612133', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Warsteiner Lata', '', 'Nacionales', 'Otro', '14028', '7795697612133', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Isenbeck No Retornable', '', 'Nacionales', 'Otro', '14025', '7795697611662', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Isenbeck No Retornable', '', 'Nacionales', 'Otro', '14025', '7795697611662', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Isenbeck Lata', '', 'Nacionales', 'Otro', '14026', '7795697611167', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Isenbeck Lata', '', 'Nacionales', 'Otro', '14026', '7795697611167', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Grolsch Lata 500', '', 'Nacionales', 'Otro', '14031', '7795697000213', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Grolsch Lata 500', '', 'Nacionales', 'Otro', '14031', '7795697000213', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Warsteiner No Retornable', '', 'Nacionales', 'Otro', '14027', '7795697000107', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Warsteiner No Retornable', '', 'Nacionales', 'Otro', '14027', '7795697000107', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Dv Catena Grapa', '', 'Tequila', 'Otro', '644', '7794450000712', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Dv Catena Grapa', '', 'Tequila', 'Otro', '644', '7794450000712', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Imperial Golden 487', '', 'Nacionales', 'Otro', '10127', '7793147571689', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Imperial Golden 487', '', 'Nacionales', 'Otro', '10127', '7793147571689', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Imperial Ipa', '', 'Nacionales', 'Otro', '10125', '7793147570316', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Imperial Ipa', '', 'Nacionales', 'Otro', '10125', '7793147570316', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Heineken Lata 500 Cc', '', 'Nacionales', 'Otro', '10105', '7793147009182', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Heineken Lata 500 Cc', '', 'Nacionales', 'Otro', '10105', '7793147009182', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Heineken Litro', '', 'Nacionales', 'Otro', '10104', '7793147009137', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Heineken Litro', '', 'Nacionales', 'Otro', '10104', '7793147009137', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Imperial Cream Stout', '', 'Nacionales', 'Otro', '10124', '7793147001742', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Imperial Cream Stout', '', 'Nacionales', 'Otro', '10124', '7793147001742', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Sol 330', '', 'Importadas', 'Otro', '10110', '7793147001216', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Sol 330', '', 'Importadas', 'Otro', '10110', '7793147001216', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Amstel Lata', '', 'Nacionales', 'Otro', '10119', '7793147000882', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Amstel Lata', '', 'Nacionales', 'Otro', '10119', '7793147000882', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Imperial Litro', '', 'Nacionales', 'Otro', '10115', '7793147000813', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Imperial Litro', '', 'Nacionales', 'Otro', '10115', '7793147000813', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Guinnes Hop House 13 Lager', '', 'Importadas', 'Otro', '10112', '7793147000752', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Guinnes Hop House 13 Lager', '', 'Importadas', 'Otro', '10112', '7793147000752', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Quilmes Lata Stone', '', 'Nacionales', 'Otro', '10312', '7792798011018', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Quilmes Lata Stone', '', 'Nacionales', 'Otro', '10312', '7792798011018', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Quilmes Night', '', 'Nacionales', 'Otro', '10305', '7792798008049', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Quilmes Night', '', 'Nacionales', 'Otro', '10305', '7792798008049', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Stella Artois Noir', '', 'Nacionales', 'Otro', '10309', '7792798007820', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Stella Artois Noir', '', 'Nacionales', 'Otro', '10309', '7792798007820', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Quilmes 1889', '', 'Nacionales', 'Otro', '10304', '7792798007721', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Quilmes 1889', '', 'Nacionales', 'Otro', '10304', '7792798007721', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Quilmes Lieber', '', 'Nacionales', 'Otro', '10310', '7792798007592', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Quilmes Lieber', '', 'Nacionales', 'Otro', '10310', '7792798007592', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Quilmes Botella Stone', '', 'Nacionales', 'Otro', '10313', '7792798007547', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Quilmes Botella Stone', '', 'Nacionales', 'Otro', '10313', '7792798007547', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'M 81 Bag In Box', '', 'Aperitivos', 'Otro', '10303', '7792798007172', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'M 81 Bag In Box', '', 'Aperitivos', 'Otro', '10303', '7792798007172', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Patagonia Bohemina', '', 'Nacionales', 'Otro', '10302', '7792798007165', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Patagonia Bohemina', '', 'Nacionales', 'Otro', '10302', '7792798007165', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Patagonia Amber', '', 'Nacionales', 'Otro', '10301', '7792798007158', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Patagonia Amber', '', 'Nacionales', 'Otro', '10301', '7792798007158', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bariloche Premium Pasas Choco Bitter', '', 'Generico', 'Otro', '50124', '7792430903015', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bariloche Premium Pasas Choco Bitter', '', 'Generico', 'Otro', '50124', '7792430903015', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bariloche Premium Mix de Almendras Choco 250 Gr', '', 'Generico', 'Otro', '50117', '7792430902919', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bariloche Premium Mix de Almendras Choco 250 Gr', '', 'Generico', 'Otro', '50117', '7792430902919', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bariloche Praline Tiramisú', '', 'Generico', 'Otro', '50111', '7792430902773', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bariloche Praline Tiramisú', '', 'Generico', 'Otro', '50111', '7792430902773', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bariloche Praline Marroc', '', 'Generico', 'Otro', '50112', '7792430902742', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bariloche Praline Marroc', '', 'Generico', 'Otro', '50112', '7792430902742', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bariloche Grageas Mix', '', 'Generico', 'Otro', '50134', '7792430609252', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bariloche Grageas Mix', '', 'Generico', 'Otro', '50134', '7792430609252', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bariloche Turron Blando Almendra Bañado', '', 'Generico', 'Otro', '50104', '7792430609214', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bariloche Turron Blando Almendra Bañado', '', 'Generico', 'Otro', '50104', '7792430609214', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bariloche Praliné Trufa', '', 'Generico', 'Otro', '50130', '7792430608736', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bariloche Praliné Trufa', '', 'Generico', 'Otro', '50130', '7792430608736', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bariloche Turron Flow 80 Grs', '', 'Generico', 'Otro', '50105', '7792430608651', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bariloche Turron Flow 80 Grs', '', 'Generico', 'Otro', '50105', '7792430608651', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bariloche Turron Blando Almendra 120grs', '', 'Generico', 'Otro', '50139', '7792430608347', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bariloche Turron Blando Almendra 120grs', '', 'Generico', 'Otro', '50139', '7792430608347', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bariloche Premium Turron de Almendras Duro 150', '', 'Generico', 'Otro', '50103', '7792430608330', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bariloche Premium Turron de Almendras Duro 150', '', 'Generico', 'Otro', '50103', '7792430608330', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bariloche Torta de Almendras', '', 'Generico', 'Otro', '50114', '7792430608101', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bariloche Torta de Almendras', '', 'Generico', 'Otro', '50114', '7792430608101', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bariloche Garrapiñada de Mani', '', 'Generico', 'Otro', '50136', '7792430411114', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bariloche Garrapiñada de Mani', '', 'Generico', 'Otro', '50136', '7792430411114', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bariloche Turron Crocante Mani', '', 'Generico', 'Otro', '50115', '7792430370657', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bariloche Turron Crocante Mani', '', 'Generico', 'Otro', '50115', '7792430370657', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bariloche Cereal Con Chocolate', '', 'Generico', 'Otro', '50106', '7792430095864', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bariloche Cereal Con Chocolate', '', 'Generico', 'Otro', '50106', '7792430095864', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bariloche Pasas de Uvas Con Chocolate Flow', '', 'Generico', 'Otro', '50132', '7792430095741', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bariloche Pasas de Uvas Con Chocolate Flow', '', 'Generico', 'Otro', '50132', '7792430095741', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bariloche Peladilla de Mani', '', 'Generico', 'Otro', '50137', '7792430095680', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bariloche Peladilla de Mani', '', 'Generico', 'Otro', '50137', '7792430095680', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bariloche Mani Con Chocolate Flow', '', 'Generico', 'Otro', '50131', '7792430095420', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bariloche Mani Con Chocolate Flow', '', 'Generico', 'Otro', '50131', '7792430095420', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Beefeter + Copon', '', 'Gin', 'Otro', '10854', '7792410507295', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Beefeter + Copon', '', 'Gin', 'Otro', '10854', '7792410507295', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Blenders Honey', '', 'Whiskies', 'Otro', '10848', '7792410146708', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Blenders Honey', '', 'Whiskies', 'Otro', '10848', '7792410146708', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Oddka Guarana', '', 'Vodka', 'Otro', '10846', '7792410142373', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Oddka Guarana', '', 'Vodka', 'Otro', '10846', '7792410142373', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Oddka Apple', '', 'Vodka', 'Otro', '10845', '7792410135559', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Oddka Apple', '', 'Vodka', 'Otro', '10845', '7792410135559', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Oddka Melon', '', 'Vodka', 'Otro', '10844', '7792410135542', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Oddka Melon', '', 'Vodka', 'Otro', '10844', '7792410135542', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Oddka Clasico', '', 'Vodka', 'Otro', '10843', '7792410135535', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Oddka Clasico', '', 'Vodka', 'Otro', '10843', '7792410135535', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Ballantines + Vaso', '', 'Whiskies', 'Otro', '10840', '7792410105293', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Ballantines + Vaso', '', 'Whiskies', 'Otro', '10840', '7792410105293', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Chivas Litro + 2 Vasos', '', 'Whiskies', 'Otro', '10819', '7792410010443', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Chivas Litro + 2 Vasos', '', 'Whiskies', 'Otro', '10819', '7792410010443', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Jameson 1000 Cc.', '', 'Whiskies', 'Otro', '10807', '7792410010009', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Jameson 1000 Cc.', '', 'Whiskies', 'Otro', '10807', '7792410010009', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Clinton Piña Colada', '', 'Licores', 'Otro', '10825', '7792410008754', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Clinton Piña Colada', '', 'Licores', 'Otro', '10825', '7792410008754', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Ramazzoti', '', 'Fernet', 'Otro', '10812', '7792410000512', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Ramazzoti', '', 'Fernet', 'Otro', '10812', '7792410000512', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Malamado 187', '', 'Generosos', 'Otro', '1664', '7791728231878', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Malamado 187', '', 'Generosos', 'Otro', '1664', '7791728231878', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Tia Maria Cream', '', 'Licores', 'Otro', '10835', '7791560126646', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Tia Maria Cream', '', 'Licores', 'Otro', '10835', '7791560126646', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Tia Maria', '', 'Licores', 'Otro', '10813', '7791560091852', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Tia Maria', '', 'Licores', 'Otro', '10813', '7791560091852', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Premium Whisky', '', 'Whiskies', 'Otro', '10818', '7791560000106', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Premium Whisky', '', 'Whiskies', 'Otro', '10818', '7791560000106', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Smirnoff', '', 'Vodka', 'Otro', '10515', '7791250001345', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Smirnoff', '', 'Vodka', 'Otro', '10515', '7791250001345', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Vat 69', '', 'Whiskies', 'Otro', '10523', '7791250001246', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Vat 69', '', 'Whiskies', 'Otro', '10523', '7791250001246', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bols Vodka Melon', '', 'Vodka', 'Otro', '10831', '7791200200453', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bols Vodka Melon', '', 'Vodka', 'Otro', '10831', '7791200200453', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bols Melon', '', 'Licores', 'Otro', '10824', '7791200009940', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bols Melon', '', 'Licores', 'Otro', '10824', '7791200009940', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bols Durazno', '', 'Licores', 'Otro', '10827', '7791200009926', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bols Durazno', '', 'Licores', 'Otro', '10827', '7791200009926', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bols Chocolate', '', 'Licores', 'Otro', '10001', '7791200009315', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bols Chocolate', '', 'Licores', 'Otro', '10001', '7791200009315', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bols Cafe Al Cognac', '', 'Licores', 'Otro', '10014', '7791200007526', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bols Cafe Al Cognac', '', 'Licores', 'Otro', '10014', '7791200007526', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bols Crema de Cacao', '', 'Licores', 'Otro', '10004', '7791200004853', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bols Crema de Cacao', '', 'Licores', 'Otro', '10004', '7791200004853', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Absolut Citron', '', 'Vodka', 'Otro', '10829', '7791200002217', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Absolut Citron', '', 'Vodka', 'Otro', '10829', '7791200002217', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bols Vodka Durazno', '', 'Vodka', 'Otro', '10832', '7791200001012', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bols Vodka Durazno', '', 'Vodka', 'Otro', '10832', '7791200001012', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bols Kiwi', '', 'Licores', 'Otro', '10823', '7791200000848', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bols Kiwi', '', 'Licores', 'Otro', '10823', '7791200000848', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Cynar 70', '', 'Aperitivos', 'Otro', '10242', '7791200000619', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Cynar 70', '', 'Aperitivos', 'Otro', '10242', '7791200000619', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Campari 450', '', 'Aperitivos', 'Otro', '10019', '7791200000565', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Campari 450', '', 'Aperitivos', 'Otro', '10019', '7791200000565', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Cinzano 1757 Rosso', '', 'Aperitivos', 'Otro', '10018', '7791200000503', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Cinzano 1757 Rosso', '', 'Aperitivos', 'Otro', '10018', '7791200000503', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bols Triple Sec', '', 'Licores', 'Otro', '10015', '7791200000367', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bols Triple Sec', '', 'Licores', 'Otro', '10015', '7791200000367', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Sky Vodka', '', 'Vodka', 'Otro', '10225', '7791200000213', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Sky Vodka', '', 'Vodka', 'Otro', '10225', '7791200000213', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Cynar', '', 'Aperitivos', 'Otro', '10008', '7791200000091', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Cynar', '', 'Aperitivos', 'Otro', '10008', '7791200000091', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Cinzano Bianco', '', 'Aperitivos', 'Otro', '10005', '7791200000060', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Cinzano Bianco', '', 'Aperitivos', 'Otro', '10005', '7791200000060', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Gancia Red Bitter', '', 'Aperitivos', 'Otro', '10230', '7790950131598', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Gancia Red Bitter', '', 'Aperitivos', 'Otro', '10230', '7790950131598', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Gancia Spritz', '', 'Aperitivos', 'Otro', '10216', '7790950127010', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Gancia Spritz', '', 'Aperitivos', 'Otro', '10216', '7790950127010', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Gancia One Pomelo', '', 'Aperitivos', 'Otro', '10211', '7790950122763', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Gancia One Pomelo', '', 'Aperitivos', 'Otro', '10211', '7790950122763', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Dr. Lemon 275', '', 'Aperitivos', 'Otro', '10214', '7790950113112', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Dr. Lemon 275', '', 'Aperitivos', 'Otro', '10214', '7790950113112', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Martini Extra Dry', '', 'Aperitivos', 'Otro', '10222', '7790950112924', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Martini Extra Dry', '', 'Aperitivos', 'Otro', '10222', '7790950112924', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Martini Bianco', '', 'Aperitivos', 'Otro', '10209', '7790950112917', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Martini Bianco', '', 'Aperitivos', 'Otro', '10209', '7790950112917', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Martini Rosso', '', 'Aperitivos', 'Otro', '10205', '7790950112894', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Martini Rosso', '', 'Aperitivos', 'Otro', '10205', '7790950112894', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Dr. Lemon Vodka', '', 'Aperitivos', 'Otro', '10215', '7790950102093', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Dr. Lemon Vodka', '', 'Aperitivos', 'Otro', '10215', '7790950102093', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Gancia One 375 Limon', '', 'Aperitivos', 'Otro', '10213', '7790950000115', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Gancia One 375 Limon', '', 'Aperitivos', 'Otro', '10213', '7790950000115', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Carpano', '', 'Aperitivos', 'Otro', '10618', '7790290008192', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Carpano', '', 'Aperitivos', 'Otro', '10618', '7790290008192', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Punt E Mes', '', 'Aperitivos', 'Otro', '10608', '7790290007195', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Punt E Mes', '', 'Aperitivos', 'Otro', '10608', '7790290007195', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Branca Menta 750', '', 'Fernet', 'Otro', '10602', '7790290002190', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Branca Menta 750', '', 'Fernet', 'Otro', '10602', '7790290002190', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Branca Menta 450', '', 'Fernet', 'Otro', '10601', '7790290002176', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Branca Menta 450', '', 'Fernet', 'Otro', '10601', '7790290002176', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Fernet Branca Lata', '', 'Fernet', 'Otro', '10611', '7790290001506', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Fernet Branca Lata', '', 'Fernet', 'Otro', '10611', '7790290001506', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Fernet Branca 750', '', 'Fernet', 'Otro', '10604', '7790290001193', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Fernet Branca 750', '', 'Fernet', 'Otro', '10604', '7790290001193', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Branca 450', '', 'Fernet', 'Otro', '10603', '7790290001179', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Branca 450', '', 'Fernet', 'Otro', '10603', '7790290001179', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Branca Litro', '', 'Fernet', 'Otro', '10605', '7790290000523', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Branca Litro', '', 'Fernet', 'Otro', '10605', '7790290000523', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Borghetti', '', 'Licores', 'Otro', '10613', '7790290000332', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Borghetti', '', 'Licores', 'Otro', '10613', '7790290000332', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Branca Estuche Con Vaso', '', 'Fernet', 'Otro', '10616', '7790290000042', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Branca Estuche Con Vaso', '', 'Fernet', 'Otro', '10616', '7790290000042', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Branca Estuche Aniversario', '', 'Fernet', 'Otro', '10615', '7790290000028', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Branca Estuche Aniversario', '', 'Fernet', 'Otro', '10615', '7790290000028', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Albany', '', 'Licores', 'Otro', '10902', '7790260015472', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Albany', '', 'Licores', 'Otro', '10902', '7790260015472', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Caña 1° de Agosto', '', 'Licores', 'Otro', '500', '7790260014130', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Caña 1° de Agosto', '', 'Licores', 'Otro', '500', '7790260014130', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Burnets', '', 'Gin', 'Otro', '10202', '7790260011122', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Burnets', '', 'Gin', 'Otro', '10202', '7790260011122', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Anis Shami', '', 'Licores', 'Otro', '10908', '7790260009013', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Anis Shami', '', 'Licores', 'Otro', '10908', '7790260009013', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Reserva San Juan', '', 'Whiskies', 'Otro', '10013', '7790197120218', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Reserva San Juan', '', 'Whiskies', 'Otro', '10013', '7790197120218', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'J&B Litro', '', 'Whiskies', 'Otro', '10502', '7790197000039', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'J&B Litro', '', 'Whiskies', 'Otro', '10502', '7790197000039', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Hesperidina', '', 'Licores', 'Otro', '85', '7790139003418', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Hesperidina', '', 'Licores', 'Otro', '85', '7790139003418', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', '1882', '', 'Fernet', 'Otro', '10207', '7790139002879', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', '1882', '', 'Fernet', 'Otro', '10207', '7790139002879', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Jamaica Dry Rum', '', 'Ron', 'Otro', '10012', '7790139001452', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Jamaica Dry Rum', '', 'Ron', 'Otro', '10012', '7790139001452', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Jamaica Gold Rum', '', 'Ron', 'Otro', '10011', '7790139000103', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Jamaica Gold Rum', '', 'Ron', 'Otro', '10011', '7790139000103', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Pineral', '', 'Ron', 'Otro', '10227', '7790121000241', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Pineral', '', 'Ron', 'Otro', '10227', '7790121000241', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'El Abuelo Oporto', '', 'Generosos', 'Otro', '10123', '7790119000055', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'El Abuelo Oporto', '', 'Generosos', 'Otro', '10123', '7790119000055', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Casa Rosa', '', 'Gin', 'Otro', '11', '754697521996', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Casa Rosa', '', 'Gin', 'Otro', '11', '754697521996', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Corona 330', '', 'Importadas', 'Otro', '10113', '75032715', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Corona 330', '', 'Importadas', 'Otro', '10113', '75032715', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Negra Modelo', '', 'Importadas', 'Otro', '10118', '75031589', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Negra Modelo', '', 'Importadas', 'Otro', '10118', '75031589', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Jose Cuervo Especial', '', 'Tequila', 'Otro', '10516', '7501035010109', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Jose Cuervo Especial', '', 'Tequila', 'Otro', '10516', '7501035010109', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bacardi Añejo', '', 'Ron', 'Otro', '10217', '7501008611135', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bacardi Añejo', '', 'Ron', 'Otro', '10217', '7501008611135', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bacardi Gold', '', 'Ron', 'Otro', '10221', '7501008604014', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bacardi Gold', '', 'Ron', 'Otro', '10221', '7501008604014', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bacardi Blanco', '', 'Ron', 'Otro', '10203', '7501008603017', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bacardi Blanco', '', 'Ron', 'Otro', '10203', '7501008603017', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Barcelo Gran Añejo', '', 'Ron', 'Otro', '10752', '7461323129367', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Barcelo Gran Añejo', '', 'Ron', 'Otro', '10752', '7461323129367', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Barceló Añejo', '', 'Ron', 'Otro', '10753', '7461323129244', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Barceló Añejo', '', 'Ron', 'Otro', '10753', '7461323129244', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Barceló Dorado', '', 'Ron', 'Otro', '10754', '7461323129077', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Barceló Dorado', '', 'Ron', 'Otro', '10754', '7461323129077', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Botran 18 Años', '', 'Ron', 'Otro', '10940', '7401005008184', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Botran 18 Años', '', 'Ron', 'Otro', '10940', '7401005008184', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Botran 15 Años', '', 'Ron', 'Otro', '10941', '7401005008115', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Botran 15 Años', '', 'Ron', 'Otro', '10941', '7401005008115', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Gin Alquimista', '', 'Gin', 'Otro', '10290', '737787905623', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Gin Alquimista', '', 'Gin', 'Otro', '10290', '737787905623', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Gin Merle', '', 'Gin', 'Otro', '10260', '736684265243', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Gin Merle', '', 'Gin', 'Otro', '10260', '736684265243', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Cheverry Belgian Dark Strong', '', 'Nacionales', 'Otro', '10391', '736684256166', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Cheverry Belgian Dark Strong', '', 'Nacionales', 'Otro', '10391', '736684256166', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Cheverry Barley Wine', '', 'Nacionales', 'Otro', '10392', '736684256159', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Cheverry Barley Wine', '', 'Nacionales', 'Otro', '10392', '736684256159', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Cheverry Old Ale', '', 'Nacionales', 'Otro', '10390', '736684256135', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Cheverry Old Ale', '', 'Nacionales', 'Otro', '10390', '736684256135', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Cheverry Hazy Pale Ale', '', 'Nacionales', 'Otro', '10387', '736684256128', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Cheverry Hazy Pale Ale', '', 'Nacionales', 'Otro', '10387', '736684256128', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Cheverry Session Ipa', '', 'Nacionales', 'Otro', '10385', '736684256111', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Cheverry Session Ipa', '', 'Nacionales', 'Otro', '10385', '736684256111', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Cheverry Ipa', '', 'Nacionales', 'Otro', '10386', '736684256104', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Cheverry Ipa', '', 'Nacionales', 'Otro', '10386', '736684256104', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Cheverry Aaa', '', 'Nacionales', 'Otro', '10384', '736684256098', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Cheverry Aaa', '', 'Nacionales', 'Otro', '10384', '736684256098', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Cheverry Honey', '', 'Nacionales', 'Otro', '10382', '736684256081', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Cheverry Honey', '', 'Nacionales', 'Otro', '10382', '736684256081', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Cheverry Porter', '', 'Nacionales', 'Otro', '10383', '736684256074', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Cheverry Porter', '', 'Nacionales', 'Otro', '10383', '736684256074', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Cheverry English Brown', '', 'Nacionales', 'Otro', '10381', '736684256067', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Cheverry English Brown', '', 'Nacionales', 'Otro', '10381', '736684256067', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Cheverry Blonde Ale', '', 'Nacionales', 'Otro', '10380', '736684256050', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Cheverry Blonde Ale', '', 'Nacionales', 'Otro', '10380', '736684256050', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Hpnotiq Liquer', '', 'Licores', 'Otro', '10911', '736040011064', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Hpnotiq Liquer', '', 'Licores', 'Otro', '10911', '736040011064', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Absolut Buenos Aires', '', 'Vodka', 'Otro', '10847', '7312040551569', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Absolut Buenos Aires', '', 'Vodka', 'Otro', '10847', '7312040551569', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Absolut Unique', '', 'Vodka', 'Otro', '10836', '7312040551071', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Absolut Unique', '', 'Vodka', 'Otro', '10836', '7312040551071', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Absolut Pera', '', 'Vodka', 'Otro', '10815', '7312040150755', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Absolut Pera', '', 'Vodka', 'Otro', '10815', '7312040150755', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Absolut Durazno', '', 'Vodka', 'Otro', '10816', '7312040070756', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Absolut Durazno', '', 'Vodka', 'Otro', '10816', '7312040070756', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Absolut Kurant', '', 'Vodka', 'Otro', '10817', '7312040020751', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Absolut Kurant', '', 'Vodka', 'Otro', '10817', '7312040020751', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Absolut', '', 'Vodka', 'Otro', '10814', '7312040017010', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Absolut', '', 'Vodka', 'Otro', '10814', '7312040017010', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Wild Turkey 101', '', 'Whiskies', 'Otro', '10856', '721059897501', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Wild Turkey 101', '', 'Whiskies', 'Otro', '10856', '721059897501', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Wild Turkey', '', 'Whiskies', 'Otro', '10855', '721059847506', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Wild Turkey', '', 'Whiskies', 'Otro', '10855', '721059847506', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Wild Turkey Honey', '', 'Whiskies', 'Otro', '10857', '721059817509', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Wild Turkey Honey', '', 'Whiskies', 'Otro', '10857', '721059817509', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Oettinguer + Vaso', '', 'Importadas', 'Otro', '10435', '700083928849', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Oettinguer + Vaso', '', 'Importadas', 'Otro', '10435', '700083928849', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Tsingtao', '', 'Importadas', 'Otro', '10434', '6901035603232', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Tsingtao', '', 'Importadas', 'Otro', '10434', '6901035603232', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Appleton Estate', '', 'Ron', 'Otro', '10020', '636191189400', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Appleton Estate', '', 'Ron', 'Otro', '10020', '636191189400', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Mega Jagd', '', 'Licores', 'Otro', '10702', '609728873035', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Mega Jagd', '', 'Licores', 'Otro', '10702', '609728873035', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Wild Africa Cream', '', 'Licores', 'Otro', '10716', '6009600220027', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Wild Africa Cream', '', 'Licores', 'Otro', '10716', '6009600220027', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Amarula', '', 'Licores', 'Otro', '7055', '6001495062508', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Amarula', '', 'Licores', 'Otro', '7055', '6001495062508', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Zubrowka', '', 'Vodka', 'Otro', '10704', '5900343003513', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Zubrowka', '', 'Vodka', 'Otro', '10704', '5900343003513', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Graduate', '', 'Vodka', 'Otro', '10705', '5900343000956', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Graduate', '', 'Vodka', 'Otro', '10705', '5900343000956', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Croft Fine Ruby', '', 'Generosos', 'Otro', '8757', '5602418000150', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Croft Fine Ruby', '', 'Generosos', 'Otro', '8757', '5602418000150', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Smirnoff Green Apple', '', 'Vodka', 'Otro', '10520', '5410316984607', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Smirnoff Green Apple', '', 'Vodka', 'Otro', '10520', '5410316984607', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Smirnoff Vanilla', '', 'Vodka', 'Otro', '10517', '5410316982429', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Smirnoff Vanilla', '', 'Vodka', 'Otro', '10517', '5410316982429', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Smirnoff Orange', '', 'Vodka', 'Otro', '10518', '5410316982375', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Smirnoff Orange', '', 'Vodka', 'Otro', '10518', '5410316982375', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Smirnoff Citrus', '', 'Vodka', 'Otro', '10519', '5410316982320', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Smirnoff Citrus', '', 'Vodka', 'Otro', '10519', '5410316982320', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Leffe', '', 'Importadas', 'Otro', '10308', '5410228142089', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Leffe', '', 'Importadas', 'Otro', '10308', '5410228142089', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Brokers', '', 'Gin', 'Otro', '10701', '5060017740011', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Brokers', '', 'Gin', 'Otro', '10701', '5060017740011', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Britvic 150 Ml', '', 'Aperitivos', 'Otro', 'TON9', '50414284', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Britvic 150 Ml', '', 'Aperitivos', 'Otro', 'TON9', '50414284', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Britvic Ginger 200 Ml', '', 'Generico', 'Otro', 'TON12', '50414260', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Britvic Ginger 200 Ml', '', 'Generico', 'Otro', 'TON12', '50414260', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Nv Absinthe Le Fee', '', 'Vodka', 'Otro', '10706', '5033566022006', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Nv Absinthe Le Fee', '', 'Vodka', 'Otro', '10706', '5033566022006', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Loch Lomond Signature', '', 'Whiskies', 'Otro', '10947', '5016840034230', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Loch Lomond Signature', '', 'Whiskies', 'Otro', '10947', '5016840034230', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Loch Lomond Single Malt', '', 'Whiskies', 'Otro', '10948', '5016840033219', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Loch Lomond Single Malt', '', 'Whiskies', 'Otro', '10948', '5016840033219', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Loch Lomond Reserve', '', 'Whiskies', 'Otro', '10946', '5016840031222', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Loch Lomond Reserve', '', 'Whiskies', 'Otro', '10946', '5016840031222', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Jura 10 Origin', '', 'Whiskies', 'Otro', '282', '5013967004429', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Jura 10 Origin', '', 'Whiskies', 'Otro', '282', '5013967004429', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Jura Superstition', '', 'Whiskies', 'Otro', '281', '5013967002838', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Jura Superstition', '', 'Whiskies', 'Otro', '281', '5013967002838', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Taylor''S Port 10 Years', '', 'Generosos', 'Otro', '8756', '5013626111284', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Taylor''S Port 10 Years', '', 'Generosos', 'Otro', '8756', '5013626111284', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Tullamore D.E.W.', '', 'Whiskies', 'Otro', '10624', '5011026108026', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Tullamore D.E.W.', '', 'Whiskies', 'Otro', '10624', '5011026108026', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Sheridan´S', '', 'Licores', 'Otro', '10527', '5011013500642', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Sheridan´S', '', 'Licores', 'Otro', '10527', '5011013500642', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Baileys', '', 'Licores', 'Otro', '10514', '5011013100132', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Baileys', '', 'Licores', 'Otro', '10514', '5011013100132', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Jameson Black Barrel', '', 'Whiskies', 'Otro', '10849', '5011007025083', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Jameson Black Barrel', '', 'Whiskies', 'Otro', '10849', '5011007025083', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Jameson 12 Años', '', 'Whiskies', 'Otro', '10805', '5011007015336', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Jameson 12 Años', '', 'Whiskies', 'Otro', '10805', '5011007015336', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Jameson Estuche Metalico', '', 'Whiskies', 'Otro', '10822', '5011007004927', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Jameson Estuche Metalico', '', 'Whiskies', 'Otro', '10822', '5011007004927', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Jameson', '', 'Whiskies', 'Otro', '10803', '5011007003029', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Jameson', '', 'Whiskies', 'Otro', '10803', '5011007003029', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bombay', '', 'Gin', 'Otro', '10201', '5010677715003', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bombay', '', 'Gin', 'Otro', '10201', '5010677715003', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Cutty Sark', '', 'Whiskies', 'Otro', '10889', '5010504100088', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Cutty Sark', '', 'Whiskies', 'Otro', '10889', '5010504100088', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Glen Moray', '', 'Whiskies', 'Otro', '7056', '5010494508307', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Glen Moray', '', 'Whiskies', 'Otro', '7056', '5010494508307', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Hendrick´S Gin', '', 'Gin', 'Otro', '10612', '5010327755014', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Hendrick´S Gin', '', 'Gin', 'Otro', '10612', '5010327755014', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Grant´S Sherry Cask', '', 'Whiskies', 'Otro', '10623', '5010327205199', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Grant´S Sherry Cask', '', 'Whiskies', 'Otro', '10623', '5010327205199', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Grant´S Ale Cask', '', 'Whiskies', 'Otro', '10622', '5010327205182', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Grant´S Ale Cask', '', 'Whiskies', 'Otro', '10622', '5010327205182', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Glenfidisch', '', 'Whiskies', 'Otro', '10610', '5010327000176', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Glenfidisch', '', 'Whiskies', 'Otro', '10610', '5010327000176', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Grant´S Triple Wood Con Vaso', '', 'Whiskies', 'Otro', '10620', '5010327000046', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Grant´S Triple Wood Con Vaso', '', 'Whiskies', 'Otro', '10620', '5010327000046', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Grants Litro', '', 'Whiskies', 'Otro', '10609', '5010327000039', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Grants Litro', '', 'Whiskies', 'Otro', '10609', '5010327000039', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'The Famous Grouse', '', 'Whiskies', 'Otro', '64', '5010314101015', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'The Famous Grouse', '', 'Whiskies', 'Otro', '64', '5010314101015', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'The Black Grouse', '', 'Whiskies', 'Otro', '65', '5010314071509', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'The Black Grouse', '', 'Whiskies', 'Otro', '65', '5010314071509', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Pimm''S N° 1', '', 'Aperitivos', 'Otro', '10239', '5010262075017', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Pimm''S N° 1', '', 'Aperitivos', 'Otro', '10239', '5010262075017', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Ballantine´S 12 Años', '', 'Whiskies', 'Otro', '10842', '5010106113547', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Ballantine´S 12 Años', '', 'Whiskies', 'Otro', '10842', '5010106113547', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Ballantine´S Litro', '', 'Whiskies', 'Otro', '10834', '5010106111956', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Ballantine´S Litro', '', 'Whiskies', 'Otro', '10834', '5010106111956', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Ballantines 750 Cc', '', 'Whiskies', 'Otro', '10801', '5010106111536', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Ballantines 750 Cc', '', 'Whiskies', 'Otro', '10801', '5010106111536', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'J&B 750 Cc', '', 'Whiskies', 'Otro', '10501', '5010103800303', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'J&B 750 Cc', '', 'Whiskies', 'Otro', '10501', '5010103800303', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Teacher´S', '', 'Whiskies', 'Otro', '10010', '5010093226008', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Teacher´S', '', 'Whiskies', 'Otro', '10010', '5010093226008', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Beefeater Litro', '', 'Gin', 'Otro', '10828', '5000329002322', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Beefeater Litro', '', 'Gin', 'Otro', '10828', '5000329002322', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Beefeater 750 Cc', '', 'Gin', 'Otro', '10808', '5000299618417', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Beefeater 750 Cc', '', 'Gin', 'Otro', '10808', '5000299618417', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'The Glenlivet Founders Reserve', '', 'Whiskies', 'Otro', '10862', '5000299609354', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'The Glenlivet Founders Reserve', '', 'Whiskies', 'Otro', '10862', '5000299609354', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Scapa Skiren Single Malt', '', 'Whiskies', 'Otro', '10861', '5000299607091', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Scapa Skiren Single Malt', '', 'Whiskies', 'Otro', '10861', '5000299607091', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Beefeater Pink', '', 'Gin', 'Otro', '10852', '5000299605950', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Beefeater Pink', '', 'Gin', 'Otro', '10852', '5000299605950', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Longmorn Single Malt', '', 'Whiskies', 'Otro', '10860', '5000299602065', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Longmorn Single Malt', '', 'Whiskies', 'Otro', '10860', '5000299602065', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Chivas Mizunara', '', 'Whiskies', 'Otro', '10837', '5000299601693', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Chivas Mizunara', '', 'Whiskies', 'Otro', '10837', '5000299601693', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Chivas 18 Años', '', 'Whiskies', 'Otro', '10839', '5000299225028', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Chivas 18 Años', '', 'Whiskies', 'Otro', '10839', '5000299225028', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Tanqueray', '', 'Gin', 'Otro', '10617', '5000291020706', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Tanqueray', '', 'Gin', 'Otro', '10617', '5000291020706', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Gordon´S Gin', '', 'Gin', 'Otro', '10240', '5000289925440', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Gordon´S Gin', '', 'Gin', 'Otro', '10240', '5000289925440', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bulleit Bourbon', '', 'Whiskies', 'Otro', '10619', '5000281038018', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bulleit Bourbon', '', 'Whiskies', 'Otro', '10619', '5000281038018', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Singleton 12 Años', '', 'Whiskies', 'Otro', '10627', '5000281021621', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Singleton 12 Años', '', 'Whiskies', 'Otro', '10627', '5000281021621', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Caol Ila 12 Años', '', 'Whiskies', 'Otro', '10625', '5000281016320', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Caol Ila 12 Años', '', 'Whiskies', 'Otro', '10625', '5000281016320', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Old Parr', '', 'Whiskies', 'Otro', '10509', '5000281003160', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Old Parr', '', 'Whiskies', 'Otro', '10509', '5000281003160', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Talisker Single Malt', '', 'Whiskies', 'Otro', '10500', '5000281002903', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Talisker Single Malt', '', 'Whiskies', 'Otro', '10500', '5000281002903', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Johnnie Black 200 Years', '', 'Whiskies', 'Otro', '10532', '5000267179797', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Johnnie Black 200 Years', '', 'Whiskies', 'Otro', '10532', '5000267179797', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Johnnie Walker Black Vasos', '', 'Whiskies', 'Otro', '10531', '5000267175560', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Johnnie Walker Black Vasos', '', 'Whiskies', 'Otro', '10531', '5000267175560', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Johnnie Walker Red Vasos', '', 'Whiskies', 'Otro', '10530', '5000267175508', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Johnnie Walker Red Vasos', '', 'Whiskies', 'Otro', '10530', '5000267175508', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Johnnie Walker Black Lata', '', 'Whiskies', 'Otro', '10529', '5000267170572', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Johnnie Walker Black Lata', '', 'Whiskies', 'Otro', '10529', '5000267170572', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Johnnie Walker Red Lata', '', 'Whiskies', 'Otro', '10528', '5000267170541', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Johnnie Walker Red Lata', '', 'Whiskies', 'Otro', '10528', '5000267170541', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Johnnie Walker Gold Label', '', 'Whiskies', 'Otro', '10508', '5000267168395', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Johnnie Walker Gold Label', '', 'Whiskies', 'Otro', '10508', '5000267168395', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Johnnie Walker Double Black 750', '', 'Whiskies', 'Otro', '10524', '5000267116419', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Johnnie Walker Double Black 750', '', 'Whiskies', 'Otro', '10524', '5000267116419', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Johnnie Walker Double Black Lt', '', 'Whiskies', 'Otro', '10522', '5000267112077', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Johnnie Walker Double Black Lt', '', 'Whiskies', 'Otro', '10522', '5000267112077', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Johnnie Walker Black 750', '', 'Whiskies', 'Otro', '10507', '5000267024011', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Johnnie Walker Black 750', '', 'Whiskies', 'Otro', '10507', '5000267024011', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Johnnie Walker Black Litro', '', 'Whiskies', 'Otro', '10506', '5000267023601', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Johnnie Walker Black Litro', '', 'Whiskies', 'Otro', '10506', '5000267023601', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Johnny Walker Red Label 750', '', 'Whiskies', 'Otro', '10504', '5000267014074', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Johnny Walker Red Label 750', '', 'Whiskies', 'Otro', '10504', '5000267014074', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Johnnie Walker Red Label Litro', '', 'Whiskies', 'Otro', '10505', '5000267013602', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Johnnie Walker Red Label Litro', '', 'Whiskies', 'Otro', '10505', '5000267013602', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'White Horse 750 Cc', '', 'Whiskies', 'Otro', '10510', '5000265001007', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'White Horse 750 Cc', '', 'Whiskies', 'Otro', '10510', '5000265001007', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Guinnes', '', 'Importadas', 'Otro', '10111', '5000213004609', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Guinnes', '', 'Importadas', 'Otro', '10111', '5000213004609', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Stolichnaya', '', 'Vodka', 'Otro', '10888', '4750021000157', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Stolichnaya', '', 'Vodka', 'Otro', '10888', '4750021000157', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Jagermeister', '', 'Licores', 'Otro', '10703', '4067700013019', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Jagermeister', '', 'Licores', 'Otro', '10703', '4067700013019', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Paulaner 500', '', 'Importadas', 'Otro', '10116', '4066600060741', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Paulaner 500', '', 'Importadas', 'Otro', '10116', '4066600060741', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Dab Cruda', '', 'Importadas', 'Otro', '10408', '4001982283487', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Dab Cruda', '', 'Importadas', 'Otro', '10408', '4001982283487', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Sorgin Piedra Negra', '', 'Gin', 'Otro', '4299', '3760273000011', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Sorgin Piedra Negra', '', 'Gin', 'Otro', '4299', '3760273000011', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Absente', '', 'Tequila', 'Otro', '10904', '3379974200189', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Absente', '', 'Tequila', 'Otro', '10904', '3379974200189', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Hennessy V.S.', '', 'Whiskies', 'Otro', '10226', '3245990250203', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Hennessy V.S.', '', 'Whiskies', 'Otro', '10226', '3245990250203', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Cointreau', '', 'Licores', 'Otro', '7053', '3035542004206', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Cointreau', '', 'Licores', 'Otro', '7053', '3035542004206', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bardinet V.S.O.P', '', 'Whiskies', 'Otro', '63', '3012997653104', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bardinet V.S.O.P', '', 'Whiskies', 'Otro', '63', '3012997653104', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Sir Edward´S Smoky', '', 'Whiskies', 'Otro', '10709', '3012993059320', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Sir Edward´S Smoky', '', 'Whiskies', 'Otro', '10709', '3012993059320', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Sir Edward´S Blended', '', 'Whiskies', 'Otro', '10708', '3012992422002', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Sir Edward´S Blended', '', 'Whiskies', 'Otro', '10708', '3012992422002', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Evan Williams 1783', '', 'Whiskies', 'Otro', '10932', '096749141326', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Evan Williams 1783', '', 'Whiskies', 'Otro', '10932', '096749141326', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Evan Willians Honney', '', 'Whiskies', 'Otro', '10934', '096749021802', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Evan Willians Honney', '', 'Whiskies', 'Otro', '10934', '096749021802', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Evan Williams Black', '', 'Whiskies', 'Otro', '10933', '096749021345', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Evan Williams Black', '', 'Whiskies', 'Otro', '10933', '096749021345', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Fireball', '', 'Licores', 'Otro', '10715', '088004146689', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Fireball', '', 'Licores', 'Otro', '10715', '088004146689', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Benchmark N° 8', '', 'Whiskies', 'Otro', '10707', '088004020842', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Benchmark N° 8', '', 'Whiskies', 'Otro', '10707', '088004020842', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Remy Martin V.S.O.P.', '', 'Ron', 'Otro', '7050', '087236001162', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Remy Martin V.S.O.P.', '', 'Ron', 'Otro', '7050', '087236001162', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Luxardo Amaretto', '', 'Licores', 'Otro', '10910', '086891026251', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Luxardo Amaretto', '', 'Licores', 'Otro', '10910', '086891026251', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Makers Mark', '', 'Whiskies', 'Otro', '7051', '085246139431', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Makers Mark', '', 'Whiskies', 'Otro', '7051', '085246139431', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Jack Daniel´S Litro', '', 'Whiskies', 'Otro', '10016', '082184090442', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Jack Daniel´S Litro', '', 'Whiskies', 'Otro', '10016', '082184090442', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Jack Daniel´S Gentleman Jack', '', 'Whiskies', 'Otro', '10003', '082184038727', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Jack Daniel´S Gentleman Jack', '', 'Whiskies', 'Otro', '10003', '082184038727', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Jack Daniel´S', '', 'Whiskies', 'Otro', '10017', '082184000335', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Jack Daniel´S', '', 'Whiskies', 'Otro', '10017', '082184000335', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Jim Beam Devil´S Cut', '', 'Whiskies', 'Otro', '67', '080686005018', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Jim Beam Devil´S Cut', '', 'Whiskies', 'Otro', '67', '080686005018', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Jim Beam Black', '', 'Whiskies', 'Otro', '66', '080686003403', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Jim Beam Black', '', 'Whiskies', 'Otro', '66', '080686003403', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Jim Beam White', '', 'Whiskies', 'Otro', '62', '080686001409', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Jim Beam White', '', 'Whiskies', 'Otro', '62', '080686001409', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bacardi Peach Red', '', 'Ron', 'Otro', '10219', '080480402044', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bacardi Peach Red', '', 'Ron', 'Otro', '10219', '080480402044', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bacardi Arctic Grape', '', 'Ron', 'Otro', '10220', '080480401719', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bacardi Arctic Grape', '', 'Ron', 'Otro', '10220', '080480401719', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Bacardi 8 Años', '', 'Ron', 'Otro', '10218', '080480401542', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Bacardi 8 Años', '', 'Ron', 'Otro', '10218', '080480401542', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'The Glenlivet 12 Años', '', 'Whiskies', 'Otro', '10841', '080432402825', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'The Glenlivet 12 Años', '', 'Whiskies', 'Otro', '10841', '080432402825', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', '100 Pipers', '', 'Whiskies', 'Otro', '10804', '080432402672', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', '100 Pipers', '', 'Whiskies', 'Otro', '10804', '080432402672', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Chivas 1 Litro', '', 'Whiskies', 'Otro', '10802', '080432400432', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Chivas 1 Litro', '', 'Whiskies', 'Otro', '10802', '080432400432', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Chivas 750 Cc', '', 'Whiskies', 'Otro', '10820', '080432400395', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Chivas 750 Cc', '', 'Whiskies', 'Otro', '10820', '080432400395', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Chivas Lata 750cc', '', 'Whiskies', 'Otro', '10838', '080432400234', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Chivas Lata 750cc', '', 'Whiskies', 'Otro', '10838', '080432400234', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Jameson Caskmate Ipa', '', 'Whiskies', 'Otro', '10858', '080432112199', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Jameson Caskmate Ipa', '', 'Whiskies', 'Otro', '10858', '080432112199', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Jameson Caskmates Stout', '', 'Whiskies', 'Otro', '10850', '080432109922', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Jameson Caskmates Stout', '', 'Whiskies', 'Otro', '10850', '080432109922', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Jameson Gold Reserve', '', 'Whiskies', 'Otro', '10806', '080432104439', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Jameson Gold Reserve', '', 'Whiskies', 'Otro', '10806', '080432104439', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Cheverry Agua Tonica', '', 'Generico', 'Otro', '10398', '0736684256227', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Cheverry Agua Tonica', '', 'Generico', 'Otro', '10398', '0736684256227', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Santa Teresa Gran Reserva 5 Años', '', 'Ron', 'Otro', '7054', '024223301102', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Santa Teresa Gran Reserva 5 Años', '', 'Ron', 'Otro', '7054', '024223301102', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('aroma', 'Santa Teresa Claro', '', 'Ron', 'Otro', '7055', '024223002092', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
INSERT INTO productos (empresa, nombre, bodega, varietal, categoria, sku, codigo_barras, precio_venta, precio_costo, stock, stock_minimo, activo)
VALUES ('lavid', 'Santa Teresa Claro', '', 'Ron', 'Otro', '7055', '024223002092', 0, 0, 0, 0, true)
ON CONFLICT (empresa, nombre) DO UPDATE SET codigo_barras = EXCLUDED.codigo_barras WHERE productos.codigo_barras IS NULL OR productos.codigo_barras = '';
