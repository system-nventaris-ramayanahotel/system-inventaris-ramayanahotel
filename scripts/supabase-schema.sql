-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'manager', 'staff')) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    last_login DATE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    contact VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create items table
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    description TEXT,
    unit VARCHAR(20) NOT NULL,
    min_stock INTEGER NOT NULL DEFAULT 0,
    current_stock INTEGER NOT NULL DEFAULT 0,
    location VARCHAR(100),
    supplier_id INTEGER REFERENCES suppliers(id),
    price DECIMAL(15,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) CHECK (type IN ('in', 'out', 'borrow', 'return')) NOT NULL,
    item_id INTEGER REFERENCES items(id) NOT NULL,
    quantity INTEGER NOT NULL,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    supplier_id INTEGER REFERENCES suppliers(id),
    borrower_id VARCHAR(100),
    notes TEXT,
    status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'completed', 'cancelled')) DEFAULT 'completed',
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE,
    return_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create depreciations table
CREATE TABLE IF NOT EXISTS depreciations (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES items(id) NOT NULL,
    quantity INTEGER NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason TEXT,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('completed', 'pending')) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default users
INSERT INTO users (username, name, email, role, status, last_login) VALUES
('Bas', 'Bas', 'bas@example.com', 'admin', 'active', CURRENT_DATE),
('Kiswanto', 'Kiswanto', 'kiswanto@example.com', 'manager', 'active', CURRENT_DATE),
('hkcrew', 'HK Crew', 'hkcrew@example.com', 'staff', 'active', CURRENT_DATE)
ON CONFLICT (username) DO NOTHING;

-- Insert default categories
INSERT INTO categories (code, name, description, status) VALUES
('LIN', 'Linen', 'Bed sheets, towels, and other linens', 'active'),
('CLN', 'Cleaning Supplies', 'Detergents, soaps, and cleaning equipment', 'active'),
('AMN', 'Amenities', 'Guest amenities and toiletries', 'active')
ON CONFLICT (code) DO NOTHING;

-- Insert default suppliers
INSERT INTO suppliers (code, name, contact, phone, email, address, status) VALUES
('SUP001', 'PT Linen Indonesia', 'John Doe', '021-1234567', 'contact@linen.co.id', 'Jakarta', 'active'),
('SUP002', 'CV Cleaning Pro', 'Jane Smith', '021-7654321', 'info@cleaningpro.co.id', 'Bandung', 'active')
ON CONFLICT (code) DO NOTHING;

-- Insert default locations
INSERT INTO locations (name, description, status) VALUES
('Warehouse A', 'Main warehouse for linen storage', 'active'),
('Storage Room', 'General storage room', 'active'),
('Amenities Storage', 'Storage for guest amenities', 'active'),
('Laundry Room', 'Laundry equipment and supplies storage', 'active')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_category_id ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_supplier_id ON items(supplier_id);
CREATE INDEX IF NOT EXISTS idx_transactions_item_id ON transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_depreciations_item_id ON depreciations(item_id);
CREATE INDEX IF NOT EXISTS idx_depreciations_user_id ON depreciations(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_depreciations_updated_at BEFORE UPDATE ON depreciations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
