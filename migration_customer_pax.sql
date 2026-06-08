-- =====================================================
-- MIGRATION: Customer Name & Pax Columns
-- Safe to run multiple times (IF NOT EXISTS guards)
-- Run this on ALL database instances
-- =====================================================

-- 1. TableMaster: Live customer name + pax on active table
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TableMaster') AND name = 'CustomerName')
BEGIN
    ALTER TABLE dbo.TableMaster ADD CustomerName NVARCHAR(9) NULL;
    PRINT 'Added CustomerName to TableMaster';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TableMaster') AND name = 'Pax')
BEGIN
    ALTER TABLE dbo.TableMaster ADD Pax INT NULL;
    PRINT 'Added Pax to TableMaster';
END
GO

-- 2. SettlementHeader: Persisted guest name + pax on completed orders
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SettlementHeader') AND name = 'GuestName')
BEGIN
    ALTER TABLE dbo.SettlementHeader ADD GuestName NVARCHAR(9) NULL;
    PRINT 'Added GuestName to SettlementHeader';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SettlementHeader') AND name = 'Pax')
BEGIN
    ALTER TABLE dbo.SettlementHeader ADD Pax INT NULL;
    PRINT 'Added Pax to SettlementHeader';
END
GO

-- 3. RestaurantOrderCur: Pax + CustomerName on active orders
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.RestaurantOrderCur') AND name = 'Pax')
BEGIN
    ALTER TABLE dbo.RestaurantOrderCur ADD Pax INT NULL;
    PRINT 'Added Pax to RestaurantOrderCur';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.RestaurantOrderCur') AND name = 'CustomerName')
BEGIN
    ALTER TABLE dbo.RestaurantOrderCur ADD CustomerName NVARCHAR(9) NULL;
    PRINT 'Added CustomerName to RestaurantOrderCur';
END
GO

-- 4. RestaurantInvoice: Pax on finalized invoices
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.RestaurantInvoice') AND name = 'Pax')
BEGIN
    ALTER TABLE dbo.RestaurantInvoice ADD Pax INT NULL;
    PRINT 'Added Pax to RestaurantInvoice';
END
GO

-- 5. RestaurantInvoiceCur: Pax on current invoices (mirror table)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.RestaurantInvoiceCur') AND name = 'Pax')
BEGIN
    ALTER TABLE dbo.RestaurantInvoiceCur ADD Pax INT NULL;
    PRINT 'Added Pax to RestaurantInvoiceCur';
END
GO

PRINT '✅ Migration complete - Customer Name & Pax columns added';
