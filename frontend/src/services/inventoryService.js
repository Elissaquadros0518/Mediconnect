import { supabase } from '../lib/supabase.js';

// Initial stateful in-memory demo hospital inventory store
let demoInventoryStore = [
  {
    id: 'inv-1',
    sku: 'MED-AMX-500',
    name: 'Amoxicillin 500mg Capsules',
    category: 'Pharmaceuticals',
    dosage: '500mg Oral Capsule',
    stock: 45,
    reorderLevel: 100,
    unit: 'Boxes (100s)',
    unitCost: 320,
    expiryDate: '2027-08-15',
    supplier: 'Apex Pharma Labs',
    location: 'Pharmacy Bay A-12',
    status: 'Low Stock'
  },
  {
    id: 'inv-2',
    sku: 'MED-PRC-650',
    name: 'Paracetamol 650mg Tablets',
    category: 'Pharmaceuticals',
    dosage: '650mg Antipyretic Tablet',
    stock: 350,
    reorderLevel: 150,
    unit: 'Strips (15s)',
    unitCost: 45,
    expiryDate: '2028-02-10',
    supplier: 'Cipla Health',
    location: 'Pharmacy Bay A-04',
    status: 'In Stock'
  },
  {
    id: 'inv-3',
    sku: 'MED-ATV-020',
    name: 'Atorvastatin 20mg Tablets',
    category: 'Pharmaceuticals',
    dosage: '20mg Lipid Lowering',
    stock: 180,
    reorderLevel: 80,
    unit: 'Strips (10s)',
    unitCost: 110,
    expiryDate: '2027-11-20',
    supplier: 'Sun Pharma',
    location: 'Pharmacy Bay B-08',
    status: 'In Stock'
  },
  {
    id: 'inv-4',
    sku: 'SUR-GLV-002',
    name: 'Sterile Surgical Gloves (Size 7.5)',
    category: 'Surgical Supplies',
    dosage: 'Size 7.5 Powder-Free Latex',
    stock: 18,
    reorderLevel: 50,
    unit: 'Pairs (Box 50)',
    unitCost: 450,
    expiryDate: '2028-05-30',
    supplier: 'MediGlove International',
    location: 'OT Sterile Supply S-02',
    status: 'Critical'
  },
  {
    id: 'inv-5',
    sku: 'SUR-SUT-300',
    name: 'Polyglactin Suture 3-0 with Needle',
    category: 'Surgical Supplies',
    dosage: 'Absorbable Braided Suture 70cm',
    stock: 22,
    reorderLevel: 40,
    unit: 'Box (12 Sutures)',
    unitCost: 1250,
    expiryDate: '2027-04-18',
    supplier: 'Ethicon Surgical',
    location: 'OT Sterile Supply S-05',
    status: 'Low Stock'
  },
  {
    id: 'inv-6',
    sku: 'SUR-SVR-001',
    name: 'Disposable Scalpel Blades #11',
    category: 'Surgical Supplies',
    dosage: 'Stainless Steel #11 Triangular',
    stock: 120,
    reorderLevel: 50,
    unit: 'Box (100 Blades)',
    unitCost: 550,
    expiryDate: '2029-01-15',
    supplier: 'Paramount Surgimed',
    location: 'OT Prep Room P-01',
    status: 'In Stock'
  },
  {
    id: 'inv-7',
    sku: 'DIA-GLU-100',
    name: 'Blood Glucose Test Strips',
    category: 'Diagnostic Equipment',
    dosage: 'Electrochemical Capillary Strips',
    stock: 85,
    reorderLevel: 40,
    unit: 'Vials (50 Strips)',
    unitCost: 780,
    expiryDate: '2026-12-31',
    supplier: 'Accu-Chek Diagnostics',
    location: 'Lab Refrigerator L-03',
    status: 'In Stock'
  },
  {
    id: 'inv-8',
    sku: 'DIA-ECG-050',
    name: 'ECG Thermal Recording Paper Rolls',
    category: 'Diagnostic Equipment',
    dosage: '210mm x 295mm Grid Rolls',
    stock: 60,
    reorderLevel: 25,
    unit: 'Rolls',
    unitCost: 240,
    expiryDate: '2029-10-10',
    supplier: 'BPL Medical Tech',
    location: 'Cardiology Store C-01',
    status: 'In Stock'
  },
  {
    id: 'inv-9',
    sku: 'PPE-MSK-N95',
    name: 'N95 Particulate Respirator Masks',
    category: 'PPE & Consumables',
    dosage: 'NIOSH Certified 5-Ply',
    stock: 420,
    reorderLevel: 100,
    unit: 'Pack (20 Masks)',
    unitCost: 350,
    expiryDate: '2028-09-01',
    supplier: '3M Healthcare',
    location: 'Central Store Bay E-02',
    status: 'In Stock'
  },
  {
    id: 'inv-10',
    sku: 'PPE-SAN-500',
    name: 'Hospital Hand Rub Sanitizer 500ml',
    category: 'PPE & Consumables',
    dosage: '75% Isopropanol Solution',
    stock: 15,
    reorderLevel: 30,
    unit: 'Pump Bottles',
    unitCost: 180,
    expiryDate: '2027-06-15',
    supplier: 'Sterillium Med',
    location: 'Infection Control I-01',
    status: 'Low Stock'
  }
];

export const inventoryService = {
  /**
   * Fetch inventory items with search and category filtering
   */
  async getInventoryItems({ category = 'All', search = '', stockStatus = 'All' } = {}) {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('name');

      if (!error && data && data.length > 0) {
        let results = data.map(item => ({
          id: item.id,
          sku: item.sku || `SKU-${item.id.slice(0, 6)}`,
          name: item.name,
          category: item.category || 'General',
          dosage: item.dosage_form || item.specification || 'Standard',
          stock: Number(item.quantity_in_stock || 0),
          reorderLevel: Number(item.reorder_level || 50),
          unit: item.unit_of_measure || 'Units',
          unitCost: Number(item.unit_price || 100),
          expiryDate: item.expiry_date || '2028-01-01',
          supplier: item.supplier_name || 'Standard Vendor',
          location: item.storage_location || 'Central Pharmacy',
          status: (Number(item.quantity_in_stock || 0) <= (Number(item.reorder_level || 50) / 2))
            ? 'Critical'
            : (Number(item.quantity_in_stock || 0) <= Number(item.reorder_level || 50))
              ? 'Low Stock'
              : 'In Stock'
        }));

        if (category !== 'All') {
          results = results.filter(i => i.category.toLowerCase() === category.toLowerCase());
        }
        if (stockStatus !== 'All') {
          results = results.filter(i => i.status.toLowerCase() === stockStatus.toLowerCase());
        }
        if (search) {
          const s = search.toLowerCase();
          results = results.filter(i => 
            i.name.toLowerCase().includes(s) || 
            i.sku.toLowerCase().includes(s) ||
            i.supplier.toLowerCase().includes(s)
          );
        }
        return results;
      }
    } catch (err) {
      console.warn('[inventoryService] getInventoryItems fallback:', err.message);
    }

    // Stateful demo store fallback
    let results = [...demoInventoryStore];
    if (category !== 'All') {
      results = results.filter(i => i.category.toLowerCase() === category.toLowerCase());
    }
    if (stockStatus !== 'All') {
      results = results.filter(i => i.status.toLowerCase() === stockStatus.toLowerCase());
    }
    if (search) {
      const s = search.toLowerCase();
      results = results.filter(i => 
        i.name.toLowerCase().includes(s) || 
        i.sku.toLowerCase().includes(s) ||
        i.supplier.toLowerCase().includes(s)
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
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .update({
          quantity_in_stock: supabase.raw ? supabase.raw(`quantity_in_stock + ${quantity}`) : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', idOrSku)
        .select()
        .single();

      if (!error && data) return data;
    } catch (err) {
      console.warn('[inventoryService] reorderStock fallback:', err.message);
    }

    // Update in-memory demo store
    demoInventoryStore = demoInventoryStore.map(item => {
      if (item.id === idOrSku || item.sku === idOrSku) {
        const newStock = item.stock + Number(quantity);
        const newStatus = (newStock <= (item.reorderLevel / 2))
          ? 'Critical'
          : (newStock <= item.reorderLevel)
            ? 'Low Stock'
            : 'In Stock';
        return {
          ...item,
          stock: newStock,
          status: newStatus
        };
      }
      return item;
    });

    return demoInventoryStore.find(i => i.id === idOrSku || i.sku === idOrSku);
  },

  /**
   * Adjust quantity manually (+ or -)
   */
  async adjustQuantity(idOrSku, delta) {
    demoInventoryStore = demoInventoryStore.map(item => {
      if (item.id === idOrSku || item.sku === idOrSku) {
        const newStock = Math.max(0, item.stock + Number(delta));
        const newStatus = (newStock <= (item.reorderLevel / 2))
          ? 'Critical'
          : (newStock <= item.reorderLevel)
            ? 'Low Stock'
            : 'In Stock';
        return {
          ...item,
          stock: newStock,
          status: newStatus
        };
      }
      return item;
    });

    return demoInventoryStore.find(i => i.id === idOrSku || i.sku === idOrSku);
  },

  /**
   * Add a new item to inventory
   */
  async addInventoryItem(newItem) {
    const item = {
      id: `inv-${Date.now()}`,
      sku: newItem.sku || `SKU-${Date.now().toString().slice(-4)}`,
      name: newItem.name,
      category: newItem.category || 'Pharmaceuticals',
      dosage: newItem.dosage || 'Standard',
      stock: Number(newItem.stock || 0),
      reorderLevel: Number(newItem.reorderLevel || 50),
      unit: newItem.unit || 'Units',
      unitCost: Number(newItem.unitCost || 100),
      expiryDate: newItem.expiryDate || '2028-01-01',
      supplier: newItem.supplier || 'Hospital General Supply',
      location: newItem.location || 'Central Pharmacy Shelf A',
      status: (Number(newItem.stock || 0) <= (Number(newItem.reorderLevel || 50) / 2))
        ? 'Critical'
        : (Number(newItem.stock || 0) <= Number(newItem.reorderLevel || 50))
          ? 'Low Stock'
          : 'In Stock'
    };

    demoInventoryStore.unshift(item);
    return item;
  },

  /**
   * Remove an item from inventory
   */
  async deleteInventoryItem(idOrSku) {
    demoInventoryStore = demoInventoryStore.filter(i => i.id !== idOrSku && i.sku !== idOrSku);
    return true;
  }
};

export default inventoryService;

