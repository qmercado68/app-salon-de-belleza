'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  CheckCircle2,
  Package,
  Calendar,
  User,
  Clock
} from 'lucide-react';
import styles from './POSView.module.css';
import { api } from '@/lib/api';
import { Product, SaleItem, PaymentMethod, Appointment, TaxTreatment } from '@/lib/types';

interface POSViewProps {
  userId?: string;
}

export default function POSView({ userId }: POSViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [appointmentSearchTerm, setAppointmentSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [showProducts, setShowProducts] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('sv'));
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastInvoiceNumber, setLastInvoiceNumber] = useState<string | null>(null);
  const [appliesVat, setAppliesVat] = useState(false);
  const [vatPercentage, setVatPercentage] = useState(0);
  const [nextInvoicePreview, setNextInvoicePreview] = useState<string | null>(null);

  const normalizeDiscount = (value?: number) => {
    const n = Number(value ?? 0);
    if (!Number.isFinite(n)) return 0;
    return Math.min(Math.max(n, 0), 100);
  };

  const calculateLineSubtotal = (quantity: number, unitPrice: number, discountPercentage?: number) => {
    const gross = quantity * unitPrice;
    const discountPct = normalizeDiscount(discountPercentage);
    const net = gross - (gross * discountPct) / 100;
    return Math.round(net * 100) / 100;
  };

  const buildInvoicePreview = (prefix?: string, nextNumber?: number | null) => {
    const safePrefix = (prefix || 'FV').trim();
    const safeNumber = Number(nextNumber ?? 1);
    const normalized = Number.isFinite(safeNumber) && safeNumber > 0 ? safeNumber : 1;
    return `${safePrefix}-${String(normalized).padStart(6, '0')}`;
  };

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        const data = await api.getProducts();
        setProducts(data.filter(p => p.isActive !== false));
      } catch (err) {
        console.error('Error loading products:', err);
      } finally {
        setLoadingProducts(false);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    const loadSalonTaxConfig = async () => {
      if (!userId) return;
      try {
        let salonId = await api.getSalonId(userId);
        let salon = salonId ? await api.getSalonById(salonId) : null;
        if (!salon) {
          const salons = await api.getSalons();
          salon = salons[0] ?? null;
          salonId = salon?.id ?? null;
        }
        if (!salon) return;
        setAppliesVat(Boolean(salon.appliesVat));
        setVatPercentage(Number(salon.vatPercentage || 0));
        setNextInvoicePreview(buildInvoicePreview(salon.invoicePrefix, salon.invoiceNextNumber));
      } catch (err) {
        console.error('Error loading salon tax config:', err);
      }
    };
    loadSalonTaxConfig();
  }, [userId]);

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setLoadingAppointments(true);
        const data = await api.getUnpaidAppointments(selectedDate);
        setPendingAppointments(data);
      } catch (err) {
        console.error('Error loading appointments:', err);
      } finally {
        setLoadingAppointments(false);
      }
    };
    loadAppointments();
  }, [selectedDate, showSuccess]); // Refresh on date change or after success

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['Todos', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(productSearchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'Todos' || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, productSearchTerm, activeCategory]);

  const filteredAppointments = useMemo(() => {
    const term = appointmentSearchTerm.toLowerCase();
    return pendingAppointments.filter(a =>
      a.clientName.toLowerCase().includes(term) ||
      a.serviceName.toLowerCase().includes(term) ||
      (a.stylistName && a.stylistName.toLowerCase().includes(term))
    );
  }, [pendingAppointments, appointmentSearchTerm]);

  const addToCart = (product: Product) => {
    // Check stock
    const inCart = cart.find(item => item.productId === product.id);
    const currentQty = inCart ? inCart.quantity : 0;
    
    if (currentQty >= product.stock) {
      alert(`No hay más stock disponible para ${product.name}`);
      return;
    }

    if (inCart) {
      setCart(cart.map(item => 
        item.productId === product.id 
          ? {
              ...item,
              quantity: item.quantity + 1,
              subtotal: calculateLineSubtotal(item.quantity + 1, item.unitPrice, item.discountPercentage),
            }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        subtotal: calculateLineSubtotal(1, product.price, 0),
        discountPercentage: 0,
        taxTreatment: product.taxTreatment || 'gravado',
      }]);
    }
  };

  const addAppointmentToCart = (appt: Appointment) => {
    const inCart = cart.find(item => item.appointmentId === appt.id);
    if (inCart) {
      alert('Esta cita ya está en el carrito');
      return;
    }

    setCart([...cart, {
      appointmentId: appt.id,
      serviceId: appt.serviceId,
      productName: `${appt.clientName} - ${appt.serviceName}`,
      quantity: 1,
      unitPrice: appt.servicePrice || 0,
      subtotal: calculateLineSubtotal(1, appt.servicePrice || 0, 0),
      discountPercentage: 0,
      taxTreatment: appt.serviceTaxTreatment || 'gravado',
    }]);
  };

  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.productId === productId) {
          const newQty = Math.max(1, item.quantity + delta);
          
          // Check stock on increase
          if (delta > 0 && newQty > product.stock) {
            alert('Stock insuficiente');
            return item;
          }
          
          return {
            ...item,
            quantity: newQty,
            subtotal: calculateLineSubtotal(newQty, item.unitPrice, item.discountPercentage),
          };
        }
        return item;
      });
    });
  };

  const updateDiscount = (id: string, isProduct: boolean, rawValue: string) => {
    const parsed = Number(rawValue);
    const discountPercentage = Number.isFinite(parsed) ? normalizeDiscount(parsed) : 0;
    setCart((prev) =>
      prev.map((item) => {
        const matches = isProduct ? item.productId === id : item.appointmentId === id;
        if (!matches) return item;
        return {
          ...item,
          discountPercentage,
          subtotal: calculateLineSubtotal(item.quantity, item.unitPrice, discountPercentage),
        };
      })
    );
  };

  const removeItem = (id: string, isProduct: boolean) => {
    if (isProduct) {
      setCart(cart.filter(item => item.productId !== id));
    } else {
      setCart(cart.filter(item => item.appointmentId !== id));
    }
  };

  const grossSubtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const discountTotal = grossSubtotal - subtotal;
  const discountPercent = grossSubtotal > 0 ? (discountTotal / grossSubtotal) * 100 : 0;
  const taxableBase = cart
    .filter((item) => (item.taxTreatment || 'gravado') === 'gravado')
    .reduce((sum, item) => sum + item.subtotal, 0);
  const vatAmount = appliesVat ? (taxableBase * vatPercentage) / 100 : 0;
  const total = subtotal + vatAmount;

  const taxTreatmentLabel = (value?: TaxTreatment) => {
    if (value === 'exento') return 'Exento';
    if (value === 'excluido') return 'Excluido';
    return 'Gravado';
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || isProcessing) return;

    setIsProcessing(true);
    try {
      const result = await api.processSale({
        sellerId: userId || 'anonymous',
        totalAmount: total,
        paymentMethod: paymentMethod,
        items: cart
      });
      setLastInvoiceNumber(result.invoiceNumber ?? null);
      if (result.invoiceNumber) {
        const match = result.invoiceNumber.match(/^(.*-)(\d+)$/);
        if (match) {
          const [, prefix, num] = match;
          setNextInvoicePreview(`${prefix}${String(Number(num) + 1).padStart(num.length, '0')}`);
        } else {
          setNextInvoicePreview(result.invoiceNumber);
        }
      }

      // Show success and clear cart
      setShowSuccess(true);
      setCart([]);
      
      // Refresh products to show updated stock
      const updatedProducts = await api.getProducts();
      setProducts(updatedProducts.filter(p => p.isActive !== false));

      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      alert(`Error al procesar la venta: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.pos}>
      {/* LEFT: PRODUCTS */}
      <div className={styles.productsSection}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.headerTitle}>Punto de Pago</h2>
            <p className={styles.headerSubtitle}>
              Prioriza el cobro de citas y habilita productos solo cuando los necesites.
            </p>
          </div>
          <button
            className={`${styles.toggleBtn} ${showProducts ? styles.toggleBtnActive : ''}`}
            onClick={() => setShowProducts((prev) => !prev)}
          >
            <Package size={16} />
            {showProducts ? 'Ocultar productos' : 'Mostrar productos'}
          </button>
        </div>

        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <Calendar size={18} />
              Citas por cobrar
            </div>
            <div className={styles.sectionHint}>
              {selectedDate === new Date().toLocaleDateString('sv') ? 'Hoy' : selectedDate}
            </div>
          </div>

          <div className={styles.filtersRow}>
            <div className={styles.searchBar}>
              <Search className={styles.searchIcon} size={20} />
              <input 
                type="text" 
                placeholder="Buscar cliente o servicio..." 
                className={styles.searchInput}
                value={appointmentSearchTerm}
                onChange={(e) => setAppointmentSearchTerm(e.target.value)}
              />
            </div>
            <div className={styles.datePickerContainer}>
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
                className={styles.dateInput}
              />
            </div>
          </div>

          <div className={styles.productGrid}>
            {loadingAppointments && (
              <div className={styles.loadingInline}>Cargando citas pendientes...</div>
            )}
            {!loadingAppointments && filteredAppointments.map(appt => (
              <div 
                key={appt.id} 
                className={styles.appointmentCard}
                onClick={() => addAppointmentToCart(appt)}
              >
                <div className={styles.apptHeader}>
                  <div className={styles.apptTime}>
                    <Clock size={14} />
                    {new Date(appt.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className={styles.apptStatus}>{appt.status}</div>
                </div>
                <div className={styles.apptUser}>
                  <User size={18} />
                  <span>{appt.clientName}</span>
                </div>
                <div className={styles.apptService}>
                  <strong>{appt.serviceName}</strong>
                  <span className={styles.stylistNameTag}>Con: {appt.stylistName}</span>
                </div>
                <div className={styles.apptAction}>Haz clic para cobrar</div>
              </div>
            ))}

            {!loadingAppointments && filteredAppointments.length === 0 && (
              <div className={styles.noAppointments}>
                <Calendar size={48} strokeWidth={1} />
                <p>No hay citas pendientes para {selectedDate === new Date().toLocaleDateString('sv') ? 'hoy' : selectedDate}.</p>
              </div>
            )}
          </div>
        </div>

        {showProducts && (
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <Package size={18} />
                Productos
              </div>
              <div className={styles.sectionHint}>Opcional</div>
            </div>

            <div className={styles.filtersRow}>
              <div className={styles.searchBar}>
                <Search className={styles.searchIcon} size={20} />
                <input 
                  type="text" 
                  placeholder="Buscar producto..." 
                  className={styles.searchInput}
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.categories}>
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`${styles.categoryBtn} ${activeCategory === cat ? styles.categoryBtnActive : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className={styles.productGrid}>
              {loadingProducts && (
                <div className={styles.loadingInline}>Cargando productos...</div>
              )}
              {!loadingProducts && filteredProducts.map(product => (
                <div 
                  key={product.id} 
                  className={styles.productCard}
                  onClick={() => addToCart(product)}
                >
                  <div className={styles.productImage}>
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className={styles.productImagePhoto}
                      />
                    ) : (
                      <Package size={40} />
                    )}
                  </div>
                  <div className={styles.productName}>{product.name}</div>
                  <div className={styles.productPrice}>${product.price}</div>
                  <div className={`${styles.stockBadge} ${product.stock <= 5 ? styles.lowStock : ''}`}>
                    Stock: {product.stock}
                  </div>
                  {product.stock === 0 && <div className={styles.outOfStock}>Agotado</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: CART */}
      <div className={styles.cartSection}>
        <div className={styles.cartHeader}>
          <div>
            <h2 className={styles.cartTitle}>
              <ShoppingCart size={22} />
              Pago Actual
            </h2>
            <p className={styles.invoicePreviewText}>
              Factura próxima: <strong>{nextInvoicePreview ?? 'No configurada'}</strong>
            </p>
            {lastInvoiceNumber && (
              <p className={styles.invoiceLastText}>
                Última factura: <strong>{lastInvoiceNumber}</strong>
              </p>
            )}
          </div>
          {cart.length > 0 && (
            <button className={styles.clearBtn} onClick={() => setCart([])}>
              Limpiar
            </button>
          )}
        </div>

        <div className={styles.cartItems}>
          {cart.length === 0 ? (
            <div className={styles.emptyCart}>
              <ShoppingCart size={48} strokeWidth={1} />
              <p>Selecciona una cita para cobrar.<br />Los productos son opcionales.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.productId || item.appointmentId} className={`${styles.cartItem} ${item.appointmentId ? styles.serviceItem : ''}`}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{item.productName}</span>
                  <span className={styles.itemPrice}>${item.unitPrice} ud.</span>
                </div>
                {item.productId ? (
                  <div className={styles.quantityControl}>
                    <button className={styles.qtyBtn} onClick={(e) => { e.stopPropagation(); updateQuantity(item.productId!, -1); }}>
                      <Minus size={14} />
                    </button>
                    <span className={styles.qtyValue}>{item.quantity}</span>
                    <button className={styles.qtyBtn} onClick={(e) => { e.stopPropagation(); updateQuantity(item.productId!, 1); }}>
                      <Plus size={14} />
                    </button>
                  </div>
                ) : (
                <div className={styles.serviceBadge}>Servicio</div>
                )}
                <div className={styles.discountControl}>
                  <span className={styles.discountLabel}>Desc.</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={Number(item.discountPercentage || 0)}
                    onChange={(e) => updateDiscount((item.productId || item.appointmentId)!, Boolean(item.productId), e.target.value)}
                    className={styles.discountInput}
                  />
                  <span className={styles.discountLabel}>%</span>
                </div>
                <div className={styles.serviceBadge}>{taxTreatmentLabel(item.taxTreatment)}</div>
                <div className={styles.itemSubtotal}>${item.subtotal}</div>
                <button className={styles.removeBtn} onClick={() => removeItem((item.productId || item.appointmentId)!, !!item.productId)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className={styles.cartFooter}>
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Descuento ({discountPercent.toFixed(2)}%)</span>
            <span>-${discountTotal.toFixed(2)}</span>
          </div>
          {appliesVat && (
            <div className={styles.summaryRow}>
              <span>IVA ({vatPercentage}%)</span>
              <span>${vatAmount.toFixed(2)}</span>
            </div>
          )}
          <div className={styles.totalRow}>
            <span>TOTAL</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <div className={styles.paymentMethods}>
            <button 
              className={`${styles.payBtn} ${paymentMethod === 'efectivo' ? styles.payBtnActive : ''}`}
              onClick={() => setPaymentMethod('efectivo')}
            >
              <Banknote size={24} />
              <span>Efectivo</span>
            </button>
            <button 
              className={`${styles.payBtn} ${paymentMethod === 'tarjeta' ? styles.payBtnActive : ''}`}
              onClick={() => setPaymentMethod('tarjeta')}
            >
              <CreditCard size={24} />
              <span>Tarjeta</span>
            </button>
          </div>

          <button 
            className={styles.processBtn}
            disabled={cart.length === 0 || isProcessing}
            onClick={handleCheckout}
          >
            {isProcessing ? 'Procesando...' : `Cobrar $${total}`}
          </button>
        </div>
      </div>

      {/* SUCCESS OVERLAY */}
      {showSuccess && (
        <div className={styles.successOverlay}>
          <div className={styles.successCard}>
            <CheckCircle2 size={64} className={styles.successIcon} />
            <h3>¡Pago Exitoso!</h3>
            <p>El cobro ha sido procesado correctamente.</p>
            {lastInvoiceNumber && <p>Factura: <strong>{lastInvoiceNumber}</strong></p>}
          </div>
        </div>
      )}
    </div>
  );
}
