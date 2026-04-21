'use client';

import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, AlertCircle, ShoppingBag, PlusCircle, Edit2 } from 'lucide-react';
import styles from './InventoryView.module.css';
import Card from '@/components/atoms/Card/Card';
import Button from '@/components/atoms/Button/Button';
import { api } from '@/lib/api';
import { Product, Salon, TaxTreatment, Tercero } from '@/lib/types';
import { PRODUCT_IMAGE_LIMITS, validateImageFile } from '@/lib/imageValidation';

interface InventoryViewProps {
  userId?: string;
}

const TAX_TREATMENT_OPTIONS: Array<{ value: TaxTreatment; label: string }> = [
  { value: 'gravado', label: 'Gravado' },
  { value: 'exento', label: 'Exento' },
  { value: 'excluido', label: 'Excluido' },
];

export default function InventoryView({ userId }: InventoryViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [salonsMap, setSalonsMap] = useState<Record<string, string>>({});
  const [terceros, setTerceros] = useState<Tercero[]>([]);
  const [loading, setLoading] = useState(true);
  const [stockToUpdate, setStockToUpdate] = useState<{ id: string, name: string, current: number } | null>(null);
  const [addAmount, setAddAmount] = useState<number>(1);
  const [isBox, setIsBox] = useState(false);
  const [stockArrivalDate, setStockArrivalDate] = useState(() => new Date().toLocaleDateString('sv'));
  const [stockNewPrice, setStockNewPrice] = useState<number | ''>('');
  const [stockCostPrice, setStockCostPrice] = useState<number | ''>('');
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [updatingAvailabilityId, setUpdatingAvailabilityId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: 'Cabello',
    taxTreatment: 'gravado' as TaxTreatment,
    brand: '',
    unit: '',
    minStock: 0,
    maxStock: 0,
    terceroId: '',
  });
  const [newProductImageFile, setNewProductImageFile] = useState<File | null>(null);
  const [newProductImagePreview, setNewProductImagePreview] = useState<string | null>(null);
  const [editProductImageFile, setEditProductImageFile] = useState<File | null>(null);
  const [editProductImagePreview, setEditProductImagePreview] = useState<string | null>(null);
  const UNITS_PER_BOX = 12;

  const resetNewProductForm = () => {
    setNewProduct({
      name: '',
      description: '',
      price: 0,
      stock: 0,
      category: 'Cabello',
      taxTreatment: 'gravado' as TaxTreatment,
      brand: '',
      unit: '',
      minStock: 0,
      maxStock: 0,
      terceroId: '',
    });
    setNewProductImageFile(null);
    setPreview(null, setNewProductImagePreview);
  };

  const setPreview = (
    next: string | null,
    setter: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    setter((prev) => {
      if (prev && prev.startsWith('blob:')) {
        URL.revokeObjectURL(prev);
      }
      return next;
    });
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (!editingProduct) {
      setPreview(null, setEditProductImagePreview);
      setEditProductImageFile(null);
      return;
    }
    if (editingProduct.imageUrl) {
      setPreview(editingProduct.imageUrl, setEditProductImagePreview);
    } else {
      setPreview(null, setEditProductImagePreview);
    }
  }, [editingProduct]);

  const loadProducts = async () => {
    try {
      const [data, salonsList, tercerosList] = await Promise.all([
        api.getProducts(userId),
        api.getSalons(),
        api.getTerceros(),
      ]);
      setProducts(data);
      setSalons(salonsList);
      setTerceros(tercerosList);
      const map: Record<string, string> = {};
      salonsList.forEach(s => { map[s.id] = s.name; });
      setSalonsMap(map);
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
      await api.updateProductStock(stockToUpdate.id, newStock, {
        price: stockNewPrice !== '' ? stockNewPrice : undefined,
        costPrice: stockCostPrice !== '' ? stockCostPrice : undefined,
        lastArrival: stockArrivalDate || undefined,
      });
      setStockToUpdate(null);
      setAddAmount(1);
      setStockNewPrice('');
      setStockCostPrice('');
      setStockArrivalDate(new Date().toLocaleDateString('sv'));
      loadProducts();
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
      let imageUrl: string | undefined;
      if (newProductImageFile) {
        setUploadingImage(true);
        imageUrl = await api.uploadProductImage(newProductImageFile);
      }
      await api.createProduct({ ...newProduct, imageUrl }, userId);
      setShowNewProductModal(false);
      resetNewProductForm();
      loadProducts();
    } catch (err) {
      alert('Error al crear el producto');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    try {
      setSavingEdit(true);
      let imageUrl = editingProduct.imageUrl;
      if (editProductImageFile) {
        setUploadingImage(true);
        imageUrl = await api.uploadProductImage(editProductImageFile);
      }
      await api.updateProduct(editingProduct.id, { ...editingProduct, imageUrl });
      setEditingProduct(null);
      loadProducts();
    } catch (err) {
      alert('Error al guardar cambios');
    } finally {
      setSavingEdit(false);
      setUploadingImage(false);
      setEditProductImageFile(null);
    }
  };

  const handleNewImageChange = async (file?: File) => {
    if (!file) return;
    const validationError = await validateImageFile(file, PRODUCT_IMAGE_LIMITS);
    if (validationError) {
      alert(validationError);
      setNewProductImageFile(null);
      setPreview(null, setNewProductImagePreview);
      return;
    }
    setNewProductImageFile(file);
    setPreview(URL.createObjectURL(file), setNewProductImagePreview);
  };

  const handleEditImageChange = async (file?: File) => {
    if (!file) return;
    const validationError = await validateImageFile(file, PRODUCT_IMAGE_LIMITS);
    if (validationError) {
      alert(validationError);
      setEditProductImageFile(null);
      setPreview(editingProduct?.imageUrl ?? null, setEditProductImagePreview);
      return;
    }
    setEditProductImageFile(file);
    setPreview(URL.createObjectURL(file), setEditProductImagePreview);
  };

  const handleToggleAvailability = async (product: Product) => {
    const nextIsActive = product.isActive === false;
    try {
      setUpdatingAvailabilityId(product.id);
      await api.updateProduct(product.id, { isActive: nextIsActive });
      setProducts((prev) => prev.map(p => p.id === product.id ? { ...p, isActive: nextIsActive } : p));
    } catch (err) {
      alert('No se pudo actualizar la disponibilidad del producto.');
    } finally {
      setUpdatingAvailabilityId(null);
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
        {products.map((product) => {
          const isUnavailable = product.isActive === false;
          return (
          <Card
            key={product.id}
            className={`${styles.productCard} ${product.stock <= (product.minStock || 0) ? styles.outOfStockAlert : ''} ${isUnavailable ? styles.unavailableCard : ''}`}
          >
            {product.stock <= (product.minStock || 0) && (
              <div className={styles.alertRibbon}>Stock Bajo</div>
            )}
            {isUnavailable && (
              <div className={styles.unavailableBadge}>No disponible</div>
            )}
            <div className={styles.productImageWrap}>
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className={styles.productImage} />
              ) : (
                <div className={styles.productImagePlaceholder}>
                  <Package size={48} />
                </div>
              )}
            </div>
            <div className={styles.productHeader}>
              <div>
                <h3 className={styles.productTitle}>{product.name}</h3>
                <span className={styles.brandLabel}>{product.brand || 'Sin marca'}</span>
                <span style={{ display: 'block', fontSize: '0.7rem', color: '#8b5cf6', fontWeight: 600, marginTop: 2 }}>
                  {product.salonId ? (salonsMap[product.salonId] || 'Desconocido') : 'Sin salón'}
                </span>
              </div>
              <span className={styles.productPrice}>${product.price}</span>
            </div>
            
            <div className={styles.productDetails}>
              <p className={styles.productDesc}>{product.description}</p>
              {(product.terceroNombre || product.supplierName) && (
                <div className={styles.supplierInfo}>
                  <strong>Proveedor:</strong> {product.terceroNombre || product.supplierName}
                  {product.terceroNit && <span> (NIT: {product.terceroNit})</span>}
                </div>
              )}
              <div className={styles.supplierInfo}>
                <strong>Tratamiento IVA:</strong> {TAX_TREATMENT_OPTIONS.find((o) => o.value === (product.taxTreatment || 'gravado'))?.label || 'Gravado'}
              </div>
            </div>

            <div className={styles.productMeta}>
              <div className={`${styles.stockBadge} ${product.stock <= (product.minStock || 0) ? styles.lowStock : styles.normalStock}`}>
                {product.stock <= (product.minStock || 0) ? <AlertCircle size={14} /> : <Package size={14} />}
                <span>{product.stock} {product.unit || 'uds'}</span>
              </div>
              <span className={styles.categoryTag}>{product.category}</span>
            </div>
            <div className={styles.productActions}>
              <Button 
                variant="outline" 
                size="sm" 
                icon={<PlusCircle size={16} />}
                onClick={() => setStockToUpdate({ id: product.id, name: product.name, current: product.stock })}
              >
                Cargar Stock
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<Edit2 size={16} />}
                onClick={() => setEditingProduct(product)}
              >
                Editar
              </Button>
              <Button
                variant={isUnavailable ? 'secondary' : 'danger'}
                size="sm"
                className={styles.fullWidthAction}
                onClick={() => handleToggleAvailability(product)}
                disabled={updatingAvailabilityId === product.id}
              >
                {updatingAvailabilityId === product.id
                  ? 'Actualizando...'
                  : isUnavailable
                    ? 'Marcar disponible'
                    : 'No disponible'}
              </Button>
            </div>
          </Card>
        );
        })}
      </div>

      {stockToUpdate && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Cargar Stock: {stockToUpdate.name}</h3>
            <p>Introduce la cantidad y los datos de la compra.</p>

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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>Cantidad</label>
                <input
                  type="number"
                  value={addAmount}
                  onChange={(e) => setAddAmount(parseInt(e.target.value) || 0)}
                  className={styles.stockInput}
                  min="1"
                />
                {isBox && addAmount > 0 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginTop: 2, display: 'block' }}>
                    = {addAmount * UNITS_PER_BOX} unidades
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>Fecha de ingreso</label>
                <input
                  type="date"
                  value={stockArrivalDate}
                  onChange={(e) => setStockArrivalDate(e.target.value)}
                  className={styles.stockInput}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>Precio de compra ($) por unidad</label>
                <input
                  type="number"
                  value={stockCostPrice}
                  onChange={(e) => setStockCostPrice(e.target.value ? parseFloat(e.target.value) : '')}
                  className={styles.stockInput}
                  placeholder="Ej. 150.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>Nuevo precio de venta ($)</label>
                <input
                  type="number"
                  value={stockNewPrice}
                  onChange={(e) => setStockNewPrice(e.target.value ? parseFloat(e.target.value) : '')}
                  className={styles.stockInput}
                  placeholder="Dejar vacío para mantener el actual"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={() => { setStockToUpdate(null); setStockNewPrice(''); setStockCostPrice(''); }}>Cancelar</Button>
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

              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label>Imagen del Producto</label>
                {newProductImagePreview && (
                  <img
                    src={newProductImagePreview}
                    alt="Vista previa del producto"
                    className={styles.imagePreview}
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleNewImageChange(e.target.files?.[0])}
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
                <label>Tratamiento IVA</label>
                <select
                  value={(newProduct as any).taxTreatment || 'gravado'}
                  onChange={(e) => setNewProduct({ ...newProduct, taxTreatment: e.target.value as TaxTreatment } as any)}
                >
                  {TAX_TREATMENT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
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

              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label>Proveedor (Tercero)</label>
                <select
                  value={(newProduct as any).terceroId || ''}
                  onChange={(e) => setNewProduct({...newProduct, terceroId: e.target.value} as any)}
                >
                  <option value="">Sin proveedor</option>
                  {terceros.map(t => (
                    <option key={t.id} value={t.id}>{t.nit} — {t.nombre}</option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label>Precio de Compra ($)</label>
                <input
                  type="number"
                  value={(newProduct as any).costPrice || ''}
                  onChange={(e) => setNewProduct({...newProduct, costPrice: parseFloat(e.target.value) || 0} as any)}
                  placeholder="Costo unitario"
                />
              </div>

              <div className={styles.field}>
                <label>Fecha de Compra</label>
                <input
                  type="date"
                  value={(newProduct as any).purchaseDate || ''}
                  onChange={(e) => setNewProduct({...newProduct, purchaseDate: e.target.value} as any)}
                />
              </div>

              <div className={styles.field}>
                <label>Salón</label>
                <select
                  value={(newProduct as any).salonId || ''}
                  onChange={(e) => setNewProduct({...newProduct, salonId: e.target.value} as any)}
                >
                  <option value="">Sin asignar</option>
                  {salons.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
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
              <Button variant="ghost" onClick={() => { setShowNewProductModal(false); resetNewProductForm(); }}>
                Cancelar
              </Button>
              <Button onClick={handleCreateProduct} disabled={uploadingImage}>
                {uploadingImage ? 'Subiendo imagen...' : 'Guardar Producto'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {editingProduct && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} ${styles.largeModal}`}>
            <h3>Editar Producto</h3>
            <p>Modifica los datos del producto.</p>

            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label>Nombre *</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                />
              </div>

              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label>Imagen del Producto</label>
                {editProductImagePreview && (
                  <img
                    src={editProductImagePreview}
                    alt="Vista previa del producto"
                    className={styles.imagePreview}
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleEditImageChange(e.target.files?.[0])}
                />
              </div>

              <div className={styles.field}>
                <label>Marca</label>
                <input
                  type="text"
                  value={editingProduct.brand || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, brand: e.target.value})}
                />
              </div>

              <div className={styles.field}>
                <label>Categoría</label>
                <select
                  value={editingProduct.category}
                  onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                >
                  <option value="Cabello">Cabello</option>
                  <option value="Uñas">Uñas</option>
                  <option value="Facial">Facial</option>
                  <option value="Maquillaje">Maquillaje</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              <div className={styles.field}>
                <label>Tratamiento IVA</label>
                <select
                  value={editingProduct.taxTreatment || 'gravado'}
                  onChange={(e) => setEditingProduct({ ...editingProduct, taxTreatment: e.target.value as TaxTreatment })}
                >
                  {TAX_TREATMENT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label>Unidad (ml, gr, ud)</label>
                <input
                  type="text"
                  value={editingProduct.unit || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, unit: e.target.value})}
                />
              </div>

              <div className={styles.field}>
                <label>Precio de Venta ($) *</label>
                <input
                  type="number"
                  value={editingProduct.price || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})}
                />
              </div>

              <div className={styles.field}>
                <label>Stock Mínimo (Alerta)</label>
                <input
                  type="number"
                  value={editingProduct.minStock || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, minStock: parseInt(e.target.value) || 0})}
                />
              </div>

              <div className={styles.field}>
                <label>Stock Máximo</label>
                <input
                  type="number"
                  value={editingProduct.maxStock || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, maxStock: parseInt(e.target.value) || 0})}
                />
              </div>

              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label>Proveedor (Tercero)</label>
                <select
                  value={editingProduct.terceroId || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, terceroId: e.target.value})}
                >
                  <option value="">Sin proveedor</option>
                  {terceros.map(t => (
                    <option key={t.id} value={t.id}>{t.nit} — {t.nombre}</option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label>Precio de Compra ($)</label>
                <input
                  type="number"
                  value={editingProduct.costPrice || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, costPrice: parseFloat(e.target.value) || 0})}
                  placeholder="Costo unitario"
                />
              </div>

              <div className={styles.field}>
                <label>Fecha de Compra</label>
                <input
                  type="date"
                  value={editingProduct.purchaseDate || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, purchaseDate: e.target.value})}
                />
              </div>

              <div className={styles.field}>
                <label>Salón</label>
                <select
                  value={editingProduct.salonId || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, salonId: e.target.value})}
                >
                  <option value="">Sin asignar</option>
                  {salons.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label>Descripción</label>
                <textarea
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                  rows={2}
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={() => setEditingProduct(null)}>Cancelar</Button>
              <Button onClick={handleSaveEdit} disabled={savingEdit || uploadingImage}>
                {uploadingImage ? 'Subiendo imagen...' : savingEdit ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
