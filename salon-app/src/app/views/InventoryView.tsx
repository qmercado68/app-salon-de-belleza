'use client';

import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, AlertCircle, ShoppingBag, PlusCircle } from 'lucide-react';
import styles from './InventoryView.module.css';
import Card from '@/components/atoms/Card/Card';
import Button from '@/components/atoms/Button/Button';
import { api } from '@/lib/api';
import { Product } from '@/lib/types';

export default function InventoryView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [stockToUpdate, setStockToUpdate] = useState<{ id: string, name: string, current: number } | null>(null);
  const [addAmount, setAddAmount] = useState<number>(1);
  const [isBox, setIsBox] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: 'Cabello',
    brand: '',
    unit: '',
    minStock: 0,
    maxStock: 0,
    supplierName: '',
    supplierPhone: '',
  });
  const UNITS_PER_BOX = 12;

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async () => {
    if (!stockToUpdate) return;
    
    const amountToAdd = isBox ? addAmount * UNITS_PER_BOX : addAmount;
    const newStock = stockToUpdate.current + amountToAdd;

    try {
      await api.updateProductStock(stockToUpdate.id, newStock);
      setStockToUpdate(null);
      setAddAmount(1);
      loadProducts(); // Reload to show new stock
    } catch (err) {
      alert('Error al actualizar el stock');
    }
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name || newProduct.price <= 0) {
      alert('Por favor, completa los campos obligatorios.');
      return;
    }

    try {
      await api.createProduct(newProduct);
      setShowNewProductModal(false);
      setNewProduct({
        name: '',
        description: '',
        price: 0,
        stock: 0,
        category: 'Cabello',
        brand: '',
        unit: '',
        minStock: 0,
        maxStock: 0,
        supplierName: '',
        supplierPhone: '',
      });
      loadProducts();
    } catch (err) {
      alert('Error al crear el producto');
    }
  };

  if (loading) return <div>Cargando inventario...</div>;

  return (
    <div className={styles.inventory}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Bodega de Productos</h1>
          <p className={styles.subtitle}>Gestión de stock, recepción de cajas y catálogo</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => setShowNewProductModal(true)}>
          Nuevo Producto
        </Button>
      </div>

      <div className={styles.inventoryGrid}>
        {products.map((product) => (
          <Card key={product.id} className={`${styles.productCard} ${product.stock <= (product.minStock || 0) ? styles.outOfStockAlert : ''}`}>
            {product.stock <= (product.minStock || 0) && (
              <div className={styles.alertRibbon}>Stock Bajo</div>
            )}
            <div className={styles.productHeader}>
              <div>
                <h3 className={styles.productTitle}>{product.name}</h3>
                <span className={styles.brandLabel}>{product.brand || 'Sin marca'}</span>
              </div>
              <span className={styles.productPrice}>${product.price}</span>
            </div>
            
            <div className={styles.productDetails}>
              <p className={styles.productDesc}>{product.description}</p>
              {product.supplierName && (
                <div className={styles.supplierInfo}>
                  <strong>Proveedor:</strong> {product.supplierName} 
                  {product.supplierPhone && <span> ({product.supplierPhone})</span>}
                </div>
              )}
            </div>

            <div className={styles.productMeta}>
              <div className={`${styles.stockBadge} ${product.stock <= (product.minStock || 0) ? styles.lowStock : styles.normalStock}`}>
                {product.stock <= (product.minStock || 0) ? <AlertCircle size={14} /> : <Package size={14} />}
                <span>{product.stock} {product.unit || 'uds'}</span>
              </div>
              <span className={styles.categoryTag}>{product.category}</span>
            </div>
            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
              <Button 
                variant="outline" 
                size="sm" 
                fullWidth 
                icon={<PlusCircle size={16} />}
                onClick={() => setStockToUpdate({ id: product.id, name: product.name, current: product.stock })}
              >
                Cargar Stock
              </Button>
              <Button variant="ghost" size="sm" icon={<ShoppingBag size={16} />} />
            </div>
          </Card>
        ))}
      </div>

      {stockToUpdate && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Cargar Stock: {stockToUpdate.name}</h3>
            <p>Introduce la cantidad que ha llegado a bodega.</p>
            
            <div className={styles.inputGroup}>
              <button 
                className={`${styles.modeBtn} ${!isBox ? styles.modeBtnActive : ''}`}
                onClick={() => setIsBox(false)}
              >
                Unidades
              </button>
              <button 
                className={`${styles.modeBtn} ${isBox ? styles.modeBtnActive : ''}`}
                onClick={() => setIsBox(true)}
              >
                Cajas ({UNITS_PER_BOX} ud.)
              </button>
            </div>

            <input 
              type="number" 
              value={addAmount}
              onChange={(e) => setAddAmount(parseInt(e.target.value) || 0)}
              className={styles.stockInput}
              min="1"
            />

            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={() => setStockToUpdate(null)}>Cancelar</Button>
              <Button onClick={handleAddStock}>Confirmar Ingreso</Button>
            </div>
          </div>
        </div>
      )}

      {showNewProductModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} ${styles.largeModal}`}>
            <h3>Nuevo Producto</h3>
            <p>Define los detalles del producto para el catálogo.</p>
            
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label>Nombre del Producto *</label>
                <input 
                  type="text" 
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  placeholder="Ej. Shampoo Keratina"
                />
              </div>

              <div className={styles.field}>
                <label>Marca</label>
                <input 
                  type="text" 
                  value={newProduct.brand}
                  onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})}
                  placeholder="Ej. Loreal"
                />
              </div>

              <div className={styles.field}>
                <label>Categoría</label>
                <select 
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                >
                  <option value="Cabello">Cabello</option>
                  <option value="Uñas">Uñas</option>
                  <option value="Facial">Facial</option>
                  <option value="Maquillaje">Maquillaje</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              <div className={styles.field}>
                <label>Unidad (ml, gr, ud)</label>
                <input 
                  type="text" 
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                  placeholder="Ej. 500ml"
                />
              </div>

              <div className={styles.field}>
                <label>Precio de Venta ($) *</label>
                <input 
                  type="number" 
                  value={newProduct.price || ''}
                  onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value) || 0})}
                />
              </div>

              <div className={styles.field}>
                <label>Stock Inicial</label>
                <input 
                  type="number" 
                  value={newProduct.stock || ''}
                  onChange={(e) => setNewProduct({...newProduct, stock: parseInt(e.target.value) || 0})}
                />
              </div>

              <div className={styles.field}>
                <label>Stock Mínimo (Alerta)</label>
                <input 
                  type="number" 
                  value={newProduct.minStock || ''}
                  onChange={(e) => setNewProduct({...newProduct, minStock: parseInt(e.target.value) || 0})}
                />
              </div>

              <div className={styles.field}>
                <label>Stock Máximo</label>
                <input 
                  type="number" 
                  value={newProduct.maxStock || ''}
                  onChange={(e) => setNewProduct({...newProduct, maxStock: parseInt(e.target.value) || 0})}
                />
              </div>

              <div className={styles.field}>
                <label>Nombre del Vendedor</label>
                <input 
                  type="text" 
                  value={newProduct.supplierName}
                  onChange={(e) => setNewProduct({...newProduct, supplierName: e.target.value})}
                  placeholder="Contacto para pedidos"
                />
              </div>

              <div className={styles.field}>
                <label>Teléfono Vendedor</label>
                <input 
                  type="text" 
                  value={newProduct.supplierPhone}
                  onChange={(e) => setNewProduct({...newProduct, supplierPhone: e.target.value})}
                  placeholder="Ej. 555-1234"
                />
              </div>

              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label>Descripción</label>
                <textarea 
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  placeholder="Breve descripción del producto..."
                  rows={2}
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={() => setShowNewProductModal(false)}>Cancelar</Button>
              <Button onClick={handleCreateProduct}>Guardar Producto</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
