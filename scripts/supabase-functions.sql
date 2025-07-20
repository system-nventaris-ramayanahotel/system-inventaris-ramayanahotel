-- Create function to update item stock
CREATE OR REPLACE FUNCTION update_item_stock(item_id INTEGER, stock_change INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE items 
    SET current_stock = GREATEST(0, current_stock + stock_change),
        updated_at = NOW()
    WHERE id = item_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get low stock items
CREATE OR REPLACE FUNCTION get_low_stock_items()
RETURNS TABLE (
    id INTEGER,
    code VARCHAR(50),
    name VARCHAR(100),
    current_stock INTEGER,
    min_stock INTEGER,
    unit VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT i.id, i.code, i.name, i.current_stock, i.min_stock, i.unit
    FROM items i
    WHERE i.current_stock <= i.min_stock
    AND i.status = 'active'
    ORDER BY (i.current_stock::FLOAT / NULLIF(i.min_stock, 0)) ASC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get stock movement summary
CREATE OR REPLACE FUNCTION get_stock_movement_summary(start_date DATE, end_date DATE)
RETURNS TABLE (
    item_id INTEGER,
    item_name VARCHAR(100),
    total_in INTEGER,
    total_out INTEGER,
    net_movement INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id as item_id,
        i.name as item_name,
        COALESCE(SUM(CASE WHEN t.type IN ('in', 'return') THEN t.quantity ELSE 0 END), 0)::INTEGER as total_in,
        COALESCE(SUM(CASE WHEN t.type IN ('out', 'borrow') THEN t.quantity ELSE 0 END), 0)::INTEGER as total_out,
        COALESCE(SUM(CASE WHEN t.type IN ('in', 'return') THEN t.quantity ELSE -t.quantity END), 0)::INTEGER as net_movement
    FROM items i
    LEFT JOIN transactions t ON i.id = t.item_id 
        AND t.date::DATE BETWEEN start_date AND end_date
        AND t.status = 'completed'
    WHERE i.status = 'active'
    GROUP BY i.id, i.name
    ORDER BY i.name;
END;
$$ LANGUAGE plpgsql;
