import React, { useState, useEffect } from 'react';
import { 
  Package, AlertTriangle, Search, Filter, Plus, RefreshCw, 
  ArrowUpDown, Printer, ShieldCheck, CheckCircle2, AlertCircle,
  Truck, ArrowRight, X, ChevronRight, Layers, DollarSign, Database
} from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';

export default function AdminInventory() {
  const [items, setItems] = useState([]);
  const [metrics, setMetrics] = useState({
    totalSKUs: 0,
    totalUnits: 0,
    lowStockCount: 0,
    criticalStockCount: 0,
    lowStockItems: [],
    totalValuation: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  // New Item Form State
  const [newItem, setNewItem] = useState({
    sku: '',
    name: '',
    category: 'Pharmaceuticals',
    dosage: '',
    stock: 100,
    reorderLevel: 40,
    unit: 'Boxes',
    unitCost: 150,
    expiryDate: '2028-06-30',
    supplier: 'Apollo Hospital Supply',
    location: 'Pharmacy Shelf C-01'
  });

  const loadInventory = async () => {
    setLoading(true);
    try {
      const [fetchedItems, fetchedMetrics] = await Promise.all([
        inventoryService.getInventoryItems({
          category: selectedCategory,
          search: searchTerm,
          stockStatus: selectedStatus
        }),
        inventoryService.getInventoryMetrics()
      ]);
      setItems(fetchedItems);
      setMetrics(fetchedMetrics);
    } catch (err) {
      console.error('Error loading inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [selectedCategory, selectedStatus, searchTerm]);

  // Handle Quick Reorder
  const handleReorder = async (item, amount = 50) => {
    await inventoryService.reorderStock(item.id, amount);
    setActionSuccess(`Order dispatched! +${amount} units of "${item.name}" added to stock.`);
    setTimeout(() => setActionSuccess(''), 4000);
    loadInventory();
  };

  // Handle Manual Stock Adjustment
  const handleAdjustStock = async (item, delta) => {
    await inventoryService.adjustQuantity(item.id, delta);
    loadInventory();
  };

  // Handle Add Item Submit
  const handleAddItemSubmit = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.sku) {
      alert('Please fill in SKU and Item Name.');
      return;
    }

    await inventoryService.addInventoryItem(newItem);
    setShowAddModal(false);
    setActionSuccess(`New SKU "${newItem.sku} - ${newItem.name}" registered into inventory.`);
    setTimeout(() => setActionSuccess(''), 4000);
    setNewItem({
      sku: '',
      name: '',
      category: 'Pharmaceuticals',
      dosage: '',
      stock: 100,
      reorderLevel: 40,
      unit: 'Boxes',
      unitCost: 150,
      expiryDate: '2028-06-30',
      supplier: 'Apollo Hospital Supply',
      location: 'Pharmacy Shelf C-01'
    });
    loadInventory();
  };

  const categories = [
    'All',
    'Pharmaceuticals',
    'Surgical Supplies',
    'Diagnostic Equipment',
    'PPE & Consumables'
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-lg border border-teal-700/30">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-white/10 text-teal-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1.5 backdrop-blur-sm border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
                <span>Hospital Materials Management</span>
              </span>
              <span className="bg-amber-400 text-amber-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                DEMO DATA
              </span>
              <span className="bg-emerald-400/20 text-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                PostgreSQL Supply Ledger
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Hospital Inventory & Pharmacy Depot
            </h1>
            <p className="text-teal-200/90 text-xs md:text-sm max-w-2xl leading-relaxed">
              Real-time central supply depot supervision, automated low-stock reorder thresholds, pharmaceutical lot tracking, and clinical material audit registers.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0 pt-2 lg:pt-0">
            <button
              onClick={() => setShowPrintModal(true)}
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl border border-white/20 transition flex items-center space-x-1.5"
            >
              <Printer className="w-4 h-4 text-teal-300" />
              <span>Stock Audit Sheet</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Register New SKU</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-4 text-xs font-semibold flex items-center space-x-2.5 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Low Stock Alert Critical Banner */}
      {metrics.lowStockCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-red-500/10 border-2 border-amber-400/60 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-black">
                <AlertTriangle className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h3 className="font-extrabold text-amber-950 text-sm md:text-base">
                  Low Stock & Depletion Alerts ({metrics.lowStockCount} Items Below Threshold)
                </h3>
                <p className="text-xs text-amber-800">
                  Critical medical supplies requiring immediate vendor batch reorders to prevent clinical stockouts.
                </p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold bg-amber-200/80 text-amber-900 px-2.5 py-1 rounded-full border border-amber-300 shrink-0">
              Action Required
            </span>
          </div>

          {/* Quick Reorder Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {metrics.lowStockItems.slice(0, 4).map(item => (
              <div key={item.id} className="bg-white/90 backdrop-blur-sm border border-amber-200 rounded-2xl p-3.5 space-y-2 shadow-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{item.sku}</span>
                    <h4 className="font-bold text-slate-900 text-xs truncate max-w-[160px]">{item.name}</h4>
                  </div>
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                    item.status === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Available:</span>
                    <span className="font-extrabold text-red-700">{item.stock}</span>
                    <span className="text-[10px] text-slate-400"> / {item.reorderLevel} min</span>
                  </div>
                  <button
                    onClick={() => handleReorder(item, 50)}
                    className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-[11px] px-2.5 py-1.5 rounded-lg transition shadow-xs flex items-center space-x-1"
                  >
                    <Truck className="w-3 h-3" />
                    <span>Reorder +50</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total SKUs</span>
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{metrics.totalSKUs}</p>
          <p className="text-[10px] text-slate-500">Across 4 hospital categories</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Units in Stock</span>
            <div className="p-2 bg-sky-50 text-sky-700 rounded-xl">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{metrics.totalUnits.toLocaleString()}</p>
          <p className="text-[10px] text-emerald-600 font-semibold">Active clinical availability</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Stock Alerts</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-black ${metrics.lowStockCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {metrics.lowStockCount}
          </p>
          <p className="text-[10px] text-slate-500">
            {metrics.criticalStockCount} critical • {metrics.lowStockCount - metrics.criticalStockCount} warning
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Asset Valuation</span>
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            ₹{metrics.totalValuation.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-slate-500">Estimated acquisition cost</p>
        </div>
      </div>

      {/* Filtering and Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by SKU, medication name, or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Stock Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="All">All Statuses</option>
              <option value="In Stock">In Stock Only</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Critical">Critical Only</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 pt-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase shrink-0 mr-1">Categories:</span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition shrink-0 ${
                selectedCategory === cat
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Inventory Data Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm md:text-base flex items-center space-x-2">
              <Package className="w-4 h-4 text-teal-600" />
              <span>Hospital Material & Pharmacy Catalog</span>
            </h3>
            <p className="text-xs text-slate-400">Displaying {items.length} registered clinical supply items</p>
          </div>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            PostgreSQL Table: <span className="font-mono text-teal-700">inventory_items</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">SKU / Item</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Stock Level</th>
                <th className="py-3 px-4">Unit Cost</th>
                <th className="py-3 px-4">Supplier & Expiry</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-600">No Inventory Items Found</p>
                    <p className="text-[11px] mt-0.5">Try clearing your filters or register a new SKU.</p>
                  </td>
                </tr>
              ) : (
                items.map(item => {
                  const percentOfReorder = Math.min(100, Math.round((item.stock / (item.reorderLevel * 2)) * 100));
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 inline-block">
                            {item.sku}
                          </span>
                          <p className="font-extrabold text-slate-900 text-xs">{item.name}</p>
                          <p className="text-[10px] text-slate-400">{item.dosage}</p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                          {item.category}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">{item.location}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-slate-900 text-sm">{item.stock}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{item.unit}</span>
                          </div>
                          <div className="w-28 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                item.status === 'Critical' ? 'bg-red-500' :
                                item.status === 'Low Stock' ? 'bg-amber-400' : 'bg-teal-500'
                              }`}
                              style={{ width: `${percentOfReorder}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-slate-400">Threshold: {item.reorderLevel} min</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        ₹{item.unitCost}
                        <span className="text-[10px] text-slate-400 font-normal block">
                          Total: ₹{(item.stock * item.unitCost).toLocaleString('en-IN')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-700 text-xs">{item.supplier}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Exp: {item.expiryDate}</p>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border inline-block ${
                          item.status === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' :
                          item.status === 'Low Stock' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {item.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Manual Steppers */}
                          <button
                            title="Decrease stock (Dispensed)"
                            onClick={() => handleAdjustStock(item, -5)}
                            className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg flex items-center justify-center transition"
                          >
                            -5
                          </button>
                          <button
                            title="Increase stock (Received)"
                            onClick={() => handleAdjustStock(item, 5)}
                            className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg flex items-center justify-center transition"
                          >
                            +5
                          </button>
                          {/* Reorder Button */}
                          <button
                            title="Order vendor batch"
                            onClick={() => handleReorder(item, 50)}
                            className="bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold px-2.5 py-1.5 rounded-lg transition text-[11px] flex items-center space-x-1"
                          >
                            <Truck className="w-3 h-3" />
                            <span>Batch</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add SKU Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-5 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-teal-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Register New Inventory SKU</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItemSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MED-CIP-500"
                    value={newItem.sku}
                    onChange={(e) => setNewItem({ ...newItem, sku: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category *</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    <option value="Pharmaceuticals">Pharmaceuticals</option>
                    <option value="Surgical Supplies">Surgical Supplies</option>
                    <option value="Diagnostic Equipment">Diagnostic Equipment</option>
                    <option value="PPE & Consumables">PPE & Consumables</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Name & Strength *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ciprofloxacin 500mg Film-Coated Tablets"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.stock}
                    onChange={(e) => setNewItem({ ...newItem, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Min. Reorder Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.reorderLevel}
                    onChange={(e) => setNewItem({ ...newItem, reorderLevel: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit Cost (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.unitCost}
                    onChange={(e) => setNewItem({ ...newItem, unitCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Primary Supplier</label>
                  <input
                    type="text"
                    value={newItem.supplier}
                    onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={newItem.expiryDate}
                    onChange={(e) => setNewItem({ ...newItem, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-5 py-2 rounded-xl transition shadow-sm"
                >
                  Save & Register SKU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Stock Sheet Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Official Pharmacy Stock Register</span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Sheet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="border border-slate-300 rounded-2xl p-6 space-y-4 font-sans bg-white">
              <div className="flex justify-between items-start border-b-2 border-teal-600 pb-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900">MediConnect <span className="text-teal-600">Hospital</span></h2>
                  <p className="text-[10px] text-slate-500">Central Supply Depot • Pharmacy Inventory Register</p>
                </div>
                <div className="text-right text-[11px]">
                  <p className="font-bold text-slate-900">Audit Date: {new Date().toLocaleDateString()}</p>
                  <p className="text-slate-400">Supervised by: System Administrator</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>Total SKUs: <strong>{metrics.totalSKUs}</strong></div>
                <div>Total Units: <strong>{metrics.totalUnits}</strong></div>
                <div>Low Stock Alerts: <strong className="text-amber-700">{metrics.lowStockCount}</strong></div>
              </div>

              <table className="w-full text-[10px] text-left">
                <thead className="bg-slate-100 uppercase font-bold text-slate-600">
                  <tr>
                    <th className="p-1.5">SKU</th>
                    <th className="p-1.5">Item Name</th>
                    <th className="p-1.5">Stock</th>
                    <th className="p-1.5">Reorder Min</th>
                    <th className="p-1.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map(i => (
                    <tr key={i.id}>
                      <td className="p-1.5 font-mono">{i.sku}</td>
                      <td className="p-1.5 font-semibold">{i.name}</td>
                      <td className="p-1.5 font-bold">{i.stock} {i.unit}</td>
                      <td className="p-1.5">{i.reorderLevel}</td>
                      <td className="p-1.5 font-bold">{i.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

