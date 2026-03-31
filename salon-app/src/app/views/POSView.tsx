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
  X,
  Calendar,
  User,
  Clock
} from 'lucide-react';
import styles from './POSView.module.css';
import { api } from '@/lib/api';
import { Product, SaleItem, PaymentMethod, Appointment } from '@/lib/types';

interface POSViewProps {
  userId?: string;
}

export default function POSView({ userId }: POSViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [activeTab, setActiveTab] = useState<'products' | 'appointments'>('products');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await api.getProducts();
        setProducts(data.filter(p => p.isActive !== false));
      } catch (err) {
        console.error('Error loading products:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const data = await api.getUnpaidAppointments(selectedDate);
        setPendingAppointments(data);
      } catch (err) {
        console.error('Error loading appointments:', err);
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
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'Todos' || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, activeCategory]);

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
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unitPrice }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        subtotal: product.price
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
      subtotal: appt.servicePrice || 0
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
          
          return { ...item, quantity: newQty, subtotal: newQty * item.unitPrice };
        }
        return item;
      });
    });
  };

  const removeItem = (id: string, isProduct: boolean) => {
    if (isProduct) {
      setCart(cart.filter(item => item.productId !== id));
    } else {
      setCart(cart.filter(item => item.appointmentId !== id));
    }
  };

  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const handleCheckout = async () => {
    if (cart.length === 0 || isProcessing) return;

    setIsProcessing(true);
    try {
      await api.processSale({
        sellerId: userId || 'anonymous',
        totalAmount: total,
        paymentMethod: paymentMethod,
        items: cart
      });

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

  if (loading) return <div className={styles.loading}>Cargando productos...</div>;

  return (
    <div className={styles.pos}>
      {/* LEFT: PRODUCTS */}
      <div className={styles.productsSection}>
        <div className={styles.topTabs}>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'products' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <Package size={18} />
            Productos
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'appointments' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            <Calendar size={18} />
            Citas {selectedDate === new Date().toISOString().split('T')[0] ? 'de Hoy' : ''}
          </button>
        </div>

        <div className={styles.filtersRow}>
          <div className={styles.searchBar}>
            <Search className={styles.searchIcon} size={20} />
            <input 
              type="text" 
              placeholder={activeTab === 'products' ? "Buscar producto..." : "Buscar cliente..."} 
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {activeTab === 'appointments' && (
            <div className={styles.datePickerContainer}>
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
                className={styles.dateInput}
              />
            </div>
          )}
        </div>

        {activeTab === 'products' && (
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
        )}

        <div className={styles.productGrid}>
          {activeTab === 'products' ? (
            filteredProducts.map(product => (
              <div 
                key={product.id} 
                className={styles.productCard}
                onClick={() => addToCart(product)}
              >
                <div className={styles.productImage}>
                  <Package size={40} />
                </div>
                <div className={styles.productName}>{product.name}</div>
                <div className={styles.productPrice}>${product.price}</div>
                <div className={`${styles.stockBadge} ${product.stock <= 5 ? styles.lowStock : ''}`}>
                  Stock: {product.stock}
                </div>
                {product.stock === 0 && <div className={styles.outOfStock}>Agotado</div>}
              </div>
            ))
          ) : (
            pendingAppointments
              .filter(a => 
                a.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                a.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (a.stylistName && a.stylistName.toLowerCase().includes(searchTerm.toLowerCase()))
              )
              .map(appt => (
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
              ))
          )}
          
          {activeTab === 'appointments' && pendingAppointments.length === 0 && (
            <div className={styles.noAppointments}>
              <Calendar size={48} strokeWidth={1} />
              <p>No hay citas pendientes para {selectedDate === new Date().toISOString().split('T')[0] ? 'hoy' : selectedDate}.</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: CART */}
      <div className={styles.cartSection}>
        <div className={styles.cartHeader}>
          <h2 className={styles.cartTitle}>
            <ShoppingCart size={22} />
            Venta Actual
          </h2>
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
              <p>El carrito está vacío.<br />Haz clic en un producto para agregarlo.</p>
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
            <span>${total}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Descuento</span>
            <span>$0</span>
          </div>
          <div className={styles.totalRow}>
            <span>TOTAL</span>
            <span>${total}</span>
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
            <h3>¡Venta Exitosa!</h3>
            <p>El ticket ha sido procesado correctamente.</p>
          </div>
        </div>
      )}
    </div>
  );
}
