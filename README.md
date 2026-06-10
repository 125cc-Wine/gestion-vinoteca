# Sistema de Gestión Vinoteca

Sistema de gestión comercial para **Aroma de Vid** y **La Vid Consultora**.

## Stack
- **Frontend + Backend**: Next.js 14 (App Router)
- **Base de datos**: Supabase (PostgreSQL)
- **Deploy**: Vercel
- **Sincronización**: WooCommerce REST API

## Instrucciones de instalación

### 1. Crear tablas en Supabase

1. Entrá a tu proyecto en [supabase.com](https://supabase.com)
2. Andá a **SQL Editor**
3. Pegá el contenido de `supabase_schema.sql` y ejecutalo

### 2. Subir los logos

Copiá tus logos a la carpeta `public/logos/`:
- `public/logos/aroma.jpg` — Logo Aroma de Vid
- `public/logos/lavid.png` — Logo La Vid Consultora

### 3. Configurar variables de entorno en Vercel

En el panel de Vercel, agregá estas variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://yjtiopfmokodgwxstijd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
WOOCOMMERCE_URL=https://aromadevid.com.ar
WOOCOMMERCE_CONSUMER_KEY=ck_tu_clave
WOOCOMMERCE_CONSUMER_SECRET=cs_tu_secret
APP_PASSWORD=tu_password_de_acceso
```

### 4. Deploy en Vercel

```bash
# Instalar Vercel CLI si no lo tenés
npm i -g vercel

# Deploy
vercel --prod
```

O conectar el repo de GitHub directamente desde el panel de Vercel.

### 5. Uso local (desarrollo)

```bash
npm install
npm run dev
```

Abrir http://localhost:3000

## Sincronización con WooCommerce

Cuando editás el precio o stock de un producto en la app:
- Si el producto tiene un **WooCommerce ID** asignado, se actualiza automáticamente en aromadevid.com.ar
- El botón **Sync WooCommerce** en la sección Productos sincroniza todos los productos en masa

Para encontrar el ID de un producto en WooCommerce:
- Entrá al panel de WordPress → Productos → editá el producto
- El ID está en la URL: `...wp-admin/post.php?post=**1234**&action=edit`

## Módulos disponibles

- ✅ Selector de empresa (Aroma de Vid / La Vid Consultora)
- ✅ Productos — ABM completo, stock, alertas, sync WooCommerce
- ✅ Clientes — ABM, cuentas corrientes, tipos
- ✅ Proveedores — ABM, saldos
- 🔜 Ventas — presupuestos y remitos imprimibles con logo
- 🔜 Caja — flujo de fondos, ingresos/egresos
