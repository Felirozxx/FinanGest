-- Script SQL para crear todas las tablas en Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor

-- 1. Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    rol TEXT DEFAULT 'worker',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT,
    telefono TEXT,
    direccion TEXT,
    cedula TEXT,
    user_id TEXT NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Tabla de carteras
CREATE TABLE IF NOT EXISTS carteras (
    id TEXT PRIMARY KEY,
    cliente_id TEXT NOT NULL,
    monto_prestado NUMERIC NOT NULL,
    monto_cobrado NUMERIC DEFAULT 0,
    interes NUMERIC DEFAULT 0,
    cuotas INTEGER DEFAULT 1,
    cuotas_pagadas INTEGER DEFAULT 0,
    estado TEXT DEFAULT 'activa',
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    user_id TEXT NOT NULL,
    notas TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Tabla de pagos
CREATE TABLE IF NOT EXISTS pagos (
    id TEXT PRIMARY KEY,
    cartera_id TEXT NOT NULL,
    monto NUMERIC NOT NULL,
    fecha DATE NOT NULL,
    metodo TEXT DEFAULT 'efectivo',
    notas TEXT,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Tabla de gastos
CREATE TABLE IF NOT EXISTS gastos (
    id TEXT PRIMARY KEY,
    descripcion TEXT NOT NULL,
    monto NUMERIC NOT NULL,
    categoria TEXT,
    fecha DATE NOT NULL,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_clientes_user ON clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_carteras_cliente ON carteras(cliente_id);
CREATE INDEX IF NOT EXISTS idx_carteras_user ON carteras(user_id);
CREATE INDEX IF NOT EXISTS idx_pagos_cartera ON pagos(cartera_id);
CREATE INDEX IF NOT EXISTS idx_gastos_user ON gastos(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 7. Políticas de seguridad (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE carteras ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;

-- Permitir acceso completo desde el backend (usando service_role key)
CREATE POLICY "Allow backend access" ON users FOR ALL USING (true);
CREATE POLICY "Allow backend access" ON clientes FOR ALL USING (true);
CREATE POLICY "Allow backend access" ON carteras FOR ALL USING (true);
CREATE POLICY "Allow backend access" ON pagos FOR ALL USING (true);
CREATE POLICY "Allow backend access" ON gastos FOR ALL USING (true);
