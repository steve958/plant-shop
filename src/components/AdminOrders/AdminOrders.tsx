import { useEffect, useMemo, useState } from 'react';
import { arrayUnion, collection, doc, onSnapshot, orderBy, query, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore';
import CloseIcon from '@mui/icons-material/Close';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { db } from '../firebase';
import productPlaceholder from '../../assets/product-placeholder.svg';
import './AdminOrders.css';

type OrderStatus = 'new' | 'contacted' | 'completed' | 'cancelled';
type AdminOrder = {
  id: string;
  orderNumber: string;
  customer: { name: string; surname: string; email: string; phone: string; place: string; postalCode: string; street: string; number: string };
  items: { productId: string; name: string; image: string; price: number; quantity: number; lineTotal: number }[];
  // delivery is null on orders placed after delivery pricing moved to per-order agreement.
  totals: { subtotal: number; delivery: number | null; total: number };
  customerNote?: string;
  status: OrderStatus;
  createdAt?: Timestamp | Date | null;
};

const statusLabels: Record<OrderStatus, string> = { new: 'Nova', contacted: 'Kontaktiran', completed: 'Završena', cancelled: 'Otkazana' };

const previewOrders: AdminOrder[] = [
  { id: 'preview-1', orderNumber: 'PC-260828-1042', customer: { name: 'Milica', surname: 'Jovanović', email: 'milica@primer.rs', phone: '064 222 3344', place: 'Šabac', postalCode: '15000', street: 'Karađorđeva', number: '18' }, items: [{ productId: 'v', name: 'Verimark 10 ml', image: productPlaceholder, price: 1490, quantity: 2, lineTotal: 2980 }], totals: { subtotal: 2980, delivery: 350, total: 3330 }, customerNote: 'Pozvati posle 15 časova.', status: 'new', createdAt: new Date() },
  { id: 'preview-2', orderNumber: 'PC-260828-0981', customer: { name: 'Nikola', surname: 'Marković', email: 'nikola@primer.rs', phone: '063 555 1288', place: 'Loznica', postalCode: '15300', street: 'Vuka Karadžića', number: '7' }, items: [{ productId: 'a', name: 'Aminomax 80', image: productPlaceholder, price: 980, quantity: 3, lineTotal: 2940 }, { productId: 'b', name: 'Bacillo Stoper', image: productPlaceholder, price: 1250, quantity: 1, lineTotal: 1250 }], totals: { subtotal: 4190, delivery: 350, total: 4540 }, status: 'contacted', createdAt: new Date(Date.now() - 36e5) },
  { id: 'preview-3', orderNumber: 'PC-260827-8824', customer: { name: 'Jelena', surname: 'Ilić', email: 'jelena@primer.rs', phone: '065 777 9032', place: 'Ruma', postalCode: '22400', street: 'Glavna', number: '41' }, items: [{ productId: 'c', name: 'Villager BC 1250', image: productPlaceholder, price: 18490, quantity: 1, lineTotal: 18490 }], totals: { subtotal: 18490, delivery: 350, total: 18840 }, status: 'completed', createdAt: new Date(Date.now() - 864e5) },
];

export default function AdminOrders({ previewMode }: { previewMode: boolean }) {
  const [orders, setOrders] = useState<AdminOrder[]>(previewMode ? previewOrders : []);
  const [loading, setLoading] = useState(!previewMode);
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (previewMode) return;
    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    return onSnapshot(ordersQuery, (snapshot) => {
      setOrders(snapshot.docs.map((orderDoc) => ({ id: orderDoc.id, ...(orderDoc.data() as Omit<AdminOrder, 'id'>) })));
      setLoading(false);
    }, (error) => {
      console.error('Order inbox failed to load:', error);
      setLoading(false);
    });
  }, [previewMode]);

  const filteredOrders = useMemo(() => orders.filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const haystack = `${order.orderNumber} ${order.customer.name} ${order.customer.surname} ${order.customer.phone} ${order.customer.email}`.toLowerCase();
    return matchesStatus && haystack.includes(search.trim().toLowerCase());
  }), [orders, search, statusFilter]);

  const setOrderStatus = async (order: AdminOrder, status: OrderStatus) => {
    if (previewMode || updating || order.status === status) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status,
        updatedAt: serverTimestamp(),
        statusHistory: arrayUnion({ status, changedAt: new Date().toISOString() }),
      });
      setSelectedOrder((current) => current ? { ...current, status } : current);
    } catch (error) {
      console.error('Order status update failed:', error);
    } finally {
      setUpdating(false);
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('sr-RS', { style: 'currency', currency: 'RSD', minimumFractionDigits: 2 }).format(price);
  const formatDate = (value?: Timestamp | Date | null) => {
    const date = value instanceof Timestamp ? value.toDate() : value instanceof Date ? value : null;
    return date ? new Intl.DateTimeFormat('sr-RS', { dateStyle: 'medium', timeStyle: 'short' }).format(date) : 'Upravo sada';
  };
  const counts = { all: orders.length, new: orders.filter((order) => order.status === 'new').length, contacted: orders.filter((order) => order.status === 'contacted').length, completed: orders.filter((order) => order.status === 'completed').length };

  return (
    <section className="admin-orders">
      <div className="admin-order-stats">
        <button className={statusFilter === 'all' ? 'active' : ''} onClick={() => setStatusFilter('all')}><span>Sve porudžbine</span><strong>{counts.all}</strong></button>
        <button className={statusFilter === 'new' ? 'active' : ''} onClick={() => setStatusFilter('new')}><span>Nove</span><strong>{counts.new}</strong></button>
        <button className={statusFilter === 'contacted' ? 'active' : ''} onClick={() => setStatusFilter('contacted')}><span>Kontaktirane</span><strong>{counts.contacted}</strong></button>
        <button className={statusFilter === 'completed' ? 'active' : ''} onClick={() => setStatusFilter('completed')}><span>Završene</span><strong>{counts.completed}</strong></button>
      </div>

      <div className="admin-order-toolbar"><label><SearchOutlinedIcon /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Broj porudžbine, kupac, telefon ili email..." /></label><span>{filteredOrders.length} rezultata</span></div>

      {loading ? <div className="admin-orders-empty"><h2>Učitavamo porudžbine...</h2></div> : !filteredOrders.length ? <div className="admin-orders-empty"><h2>Nema porudžbina u ovom prikazu</h2><p>Nove porudžbine će se pojaviti ovde automatski.</p></div> : (
        <div className="admin-orders-table-wrap"><table className="admin-orders-table"><thead><tr><th>Porudžbina</th><th>Kupac</th><th>Kontakt</th><th>Iznos</th><th>Status</th><th></th></tr></thead><tbody>{filteredOrders.map((order) => <tr key={order.id} onClick={() => setSelectedOrder(order)}><td><strong>{order.orderNumber}</strong><span>{formatDate(order.createdAt)}</span></td><td><strong>{order.customer.name} {order.customer.surname}</strong><span>{order.customer.place}</span></td><td><a href={`tel:${order.customer.phone}`} onClick={(event) => event.stopPropagation()}>{order.customer.phone}</a><span>{order.customer.email}</span></td><td><strong>{formatPrice(order.totals.total)}</strong><span>{order.items.length} {order.items.length === 1 ? 'stavka' : 'stavke'}</span></td><td><span className={`order-status order-status-${order.status}`}>{statusLabels[order.status]}</span></td><td><button onClick={() => setSelectedOrder(order)}>Otvori</button></td></tr>)}</tbody></table></div>
      )}

      {selectedOrder && <div className="admin-order-overlay" onMouseDown={(event) => event.target === event.currentTarget && setSelectedOrder(null)}><aside className="admin-order-detail" aria-label={`Porudžbina ${selectedOrder.orderNumber}`}>
        <header><div><span>Detalji porudžbine</span><h2>{selectedOrder.orderNumber}</h2><p>{formatDate(selectedOrder.createdAt)}</p></div><button aria-label="Zatvori detalje" onClick={() => setSelectedOrder(null)}><CloseIcon /></button></header>
        <div className="admin-order-detail-status"><span className={`order-status order-status-${selectedOrder.status}`}>{statusLabels[selectedOrder.status]}</span>{previewMode && <small>Akcije su isključene u pregledu</small>}</div>
        <section><h3>Kupac i dostava</h3><strong>{selectedOrder.customer.name} {selectedOrder.customer.surname}</strong><p>{selectedOrder.customer.street} {selectedOrder.customer.number}<br />{selectedOrder.customer.postalCode} {selectedOrder.customer.place}</p><div className="admin-order-contact-actions"><a href={`tel:${selectedOrder.customer.phone}`}><PhoneOutlinedIcon />{selectedOrder.customer.phone}</a><a href={`mailto:${selectedOrder.customer.email}`}><MailOutlineIcon />Email</a></div></section>
        {selectedOrder.customerNote && <section><h3>Napomena kupca</h3><p>{selectedOrder.customerNote}</p></section>}
        <section><h3>Proizvodi</h3><div className="admin-order-lines">{selectedOrder.items.map((item) => <article key={item.productId}><img src={item.image || productPlaceholder} alt="" loading="lazy" decoding="async" /><div><strong>{item.name}</strong><span>{item.quantity} × {formatPrice(item.price)}</span></div><b>{formatPrice(item.lineTotal)}</b></article>)}</div></section>
        <section className="admin-order-totals"><div><span>Proizvodi</span><strong>{formatPrice(selectedOrder.totals.subtotal)}</strong></div><div><span>Dostava</span><strong>{typeof selectedOrder.totals.delivery === 'number' ? formatPrice(selectedOrder.totals.delivery) : 'Po dogovoru'}</strong></div><div><span>{typeof selectedOrder.totals.delivery === 'number' ? 'Ukupno' : 'Ukupno bez dostave'}</span><strong>{formatPrice(selectedOrder.totals.total)}</strong></div></section>
        <footer><button disabled={previewMode || updating || selectedOrder.status === 'contacted'} onClick={() => setOrderStatus(selectedOrder, 'contacted')}>Označi kontaktirano</button><button className="complete" disabled={previewMode || updating || selectedOrder.status === 'completed'} onClick={() => setOrderStatus(selectedOrder, 'completed')}>Završi porudžbinu</button><button className="cancel" disabled={previewMode || updating || selectedOrder.status === 'cancelled'} onClick={() => setOrderStatus(selectedOrder, 'cancelled')}>Otkaži</button></footer>
      </aside></div>}
    </section>
  );
}
