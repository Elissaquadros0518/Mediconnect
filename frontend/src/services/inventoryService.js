import { supabase } from '../lib/supabase.js';

export const inventoryService = {
  /**
   * Fetch inventory items with search and category filtering directly from Supabase
   */
  async getInventoryItems({ category = 'All', search = '', stockStatus = 'All' } = {}) {
    let query = supabase
      .from('inventory_items')
      .select('*')
      .order('name');

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[inventoryService] Error fetching inventory items:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    let results = data.map(item => {
      const stock = Number(item.stock ?? 0);
      const reorderLevel = Number(item.reorder_level ?? 50);
      const computedStatus = (stock <= (reorderLevel / 2))
        ? 'Critical'
        : (stock <= reorderLevel)
          ? 'Low Stock'
          : 'In Stock';

      return {
        id: item.id,
        sku: item.sku,
        name: item.name,
        category: item.category || 'Pharmaceuticals',
        dosage: item.dosage || 'Standard',
        stock,
        reorderLevel,
        unit: item.unit || 'Units',
        unitCost: Number(item.unit_cost ?? 0),
        expiryDate: item.expiry_date || '2028-01-01',
        supplier: item.supplier || 'Hospital General Supply',
        location: item.location || 'Central Pharmacy',
        status: computedStatus
      };
    });

    if (stockStatus && stockStatus !== 'All') {
      results = results.filter(i => i.status.toLowerCase() === stockStatus.toLowerCase());
    }

    if (search) {
      const s = search.toLowerCase();
      results = results.filter(i =>
        i.name.toLowerCase().includes(s) ||
        i.sku.toLowerCase().includes(s) ||
        i.supplier.toLowerCase().includes(s) ||
        i.category.toLowerCase().includes(s)
      );
    }

    return results;
  },

  /**
   * Fetch aggregate inventory metrics
   */
  async getInventoryMetrics() {
    const items = await this.getInventoryItems();
    const totalSKUs = items.length;
    const totalUnits = items.reduce((sum, item) => sum + item.stock, 0);
    const lowStockItems = items.filter(item => item.status === 'Low Stock' || item.status === 'Critical');
    const criticalStockItems = items.filter(item => item.status === 'Critical');
    const totalValuation = items.reduce((sum, item) => sum + (item.stock * item.unitCost), 0);

    const categoriesCount = {
      'Pharmaceuticals': items.filter(i => i.category === 'Pharmaceuticals').length,
      'Surgical Supplies': items.filter(i => i.category === 'Surgical Supplies').length,
      'Diagnostic Equipment': items.filter(i => i.category === 'Diagnostic Equipment').length,
      'PPE & Consumables': items.filter(i => i.category === 'PPE & Consumables').length
    };

    return {
      totalSKUs,
      totalUnits,
      lowStockCount: lowStockItems.length,
      criticalStockCount: criticalStockItems.length,
      lowStockItems,
      totalValuation,
      categoriesCount
    };
  },

  /**
   * Reorder stock for an item (adds batch quantity)
   */
  async reorderStock(idOrSku, quantity = 50) {
    // 1. Fetch current item stock
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSku);
    const query = supabase.from('inventory_items').select('*');
    if (isUuid) {
      query.eq('id', idOrSku);
    } else {
      query.eq('sku', idOrSku);
    }

    const { data: item, error: fetchErr } = await query.single();
    if (fetchErr || !item) {
      throw new Error('Inventory item not found.');
    }

    const newStock = Number(item.stock || 0) + Number(quantity);
    const reorderLevel = Number(item.reorder_level || 50);
    const newStatus = (newStock <= (reorderLevel / 2))
      ? 'Critical'
      : (newStock <= reorderLevel)
        ? 'Low Stock'
        : 'In Stock';

    const { data: updated, error: updateErr } = await supabase
      .from('inventory_items')
      .update({
        stock: newStock,
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', item.id)
      .select()
      .single();

    if (updateErr) {
      console.error('[inventoryService] Error updating stock:', updateErr);
      throw updateErr;
    }

    return updated;
  },

  /**
   * Adjust quantity manually (+ or -)
   */
  async adjustQuantity(idOrSku, delta) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSku);
    const query = supabase.from('inventory_items').select('*');
    if (isUuid) {
      query.eq('id', idOrSku);
    } else {
      query.eq('sku', idOrSku);
    }

    const { data: item, error: fetchErr } = await query.single();
    if (fetchErr || !item) {
      throw new Error('Inventory item not found.');
    }

    const newStock = Math.max(0, Number(item.stock || 0) + Number(delta));
    const reorderLevel = Number(item.reorder_level || 50);
    const newStatus = (newStock <= (reorderLevel / 2))
      ? 'Critical'
      : (newStock <= reorderLevel)
        ? 'Low Stock'
        : 'In Stock';

    const { data: updated, error: updateErr } = await supabase
      .from('inventory_items')
      .update({
        stock: newStock,
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', item.id)
      .select()
      .single();

    if (updateErr) {
      console.error('[inventoryService] Error adjusting quantity:', updateErr);
      throw updateErr;
    }

    return updated;
  },

  /**
   * Add a new item to inventory
   */
  async addInventoryItem(newItem) {
    const stock = Number(newItem.stock || 0);
    const reorderLevel = Number(newItem.reorderLevel || 50);
    const status = (stock <= (reorderLevel / 2))
      ? 'Critical'
      : (stock <= reorderLevel)
        ? 'Low Stock'
        : 'In Stock';

    const { data, error } = await supabase
      .from('inventory_items')
      .insert({
        sku: newItem.sku,
        name: newItem.name,
        category: newItem.category || 'Pharmaceuticals',
        dosage: newItem.dosage || 'Standard',
        stock,
        reorder_level: reorderLevel,
        unit: newItem.unit || 'Units',
        unit_cost: Number(newItem.unitCost || 0),
        expiry_date: newItem.expiryDate || null,
        supplier: newItem.supplier || 'Hospital General Supply',
        location: newItem.location || 'Central Pharmacy',
        status
      })
      .select()
      .single();

    if (error) {
      console.error('[inventoryService] Error adding inventory item:', error);
      throw error;
    }

    return data;
  },

  /**
   * Remove an item from inventory
   */
  async deleteInventoryItem(idOrSku) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSku);
    const query = supabase.from('inventory_items').delete();
    if (isUuid) {
      query.eq('id', idOrSku);
    } else {
      query.eq('sku', idOrSku);
    }

    const { error } = await query;
    if (error) {
      console.error('[inventoryService] Error deleting inventory item:', error);
      throw error;
    }
    return true;
  }
};

export default inventoryService;
