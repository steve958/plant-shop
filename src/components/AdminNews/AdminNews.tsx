import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import UnpublishedOutlinedIcon from '@mui/icons-material/UnpublishedOutlined';
import { toast } from 'react-toastify';
import { db, storage } from '../firebase';
import productPlaceholder from '../../assets/product-placeholder.svg';
import './AdminNews.css';

type NewsItem = {
  newsId: string;
  title: string;
  description: string;
  imageUrl: string;
  published: boolean;
  publishedAt?: { toDate?: () => Date } | string | null;
  author?: string;
  externalUrl?: string;
};

type NewsForm = Omit<NewsItem, 'newsId' | 'publishedAt'> & { imageFile: File | null };
const emptyForm: NewsForm = { title: '', description: '', imageUrl: '', published: true, author: '', externalUrl: '', imageFile: null };

const preservedNewsPreview: NewsItem[] = [
  { newsId: 'rezidba-borovnice-2025', title: 'Značaj pravilne rezidbe borovnice', description: 'Sačuvana vest sa postojećeg Plant Centar sajta.', imageUrl: '', published: true, publishedAt: '2025-02-02', author: 'Dipl. inž. zaštite bilja Đorđe Arsenović' },
  { newsId: 'agrosvet-specijal-2025', title: 'Agrosvet časopis', description: 'Sačuvana vest sa postojećeg Plant Centar sajta.', imageUrl: '', published: true, publishedAt: '2025-01-25' },
  { newsId: 'zastita-voca-pred-zimu', title: 'Zaštita voćnih kultura pred zimu', description: 'Sačuvana vest sa postojećeg Plant Centar sajta.', imageUrl: '', published: true, publishedAt: '2024-10-24', author: 'Dipl. inž. zaštite bilja Đorđe Arsenović' },
  { newsId: 'agrosvet-138', title: 'Agrosvet časopis', description: 'Sačuvana vest sa postojećeg Plant Centar sajta.', imageUrl: '', published: true, publishedAt: '2024-09-08' },
];

const getDate = (value: NewsItem['publishedAt']) => {
  if (value && typeof value === 'object' && value.toDate) return value.toDate();
  const date = typeof value === 'string' ? new Date(value) : new Date(0);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
};

export default function AdminNews({ previewMode }: { previewMode: boolean }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<NewsForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'news'));
      const databaseNews = snapshot.docs.map((newsDocument) => ({ newsId: newsDocument.id, ...(newsDocument.data() as Omit<NewsItem, 'newsId'>) }));
      setNews(databaseNews.length ? databaseNews : previewMode ? preservedNewsPreview : []);
    } catch (error) {
      console.error('Error fetching news:', error);
      if (previewMode) setNews(preservedNewsPreview);
    } finally {
      setLoading(false);
    }
  }, [previewMode]);

  useEffect(() => { fetchNews(); }, [fetchNews]);
  const sortedNews = useMemo(() => [...news].sort((a, b) => getDate(b.publishedAt).getTime() - getDate(a.publishedAt).getTime()), [news]);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setEditorOpen(true); };
  const openEdit = (item: NewsItem) => {
    setEditingId(item.newsId);
    setForm({ title: item.title, description: item.description, imageUrl: item.imageUrl || '', published: item.published, author: item.author || '', externalUrl: item.externalUrl || '', imageFile: null });
    setEditorOpen(true);
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (previewMode || !form.title.trim() || !form.description.trim()) return;
    setSaving(true);
    try {
      let imageUrl = form.imageUrl.trim();
      if (form.imageFile) {
        const path = `news/${Date.now()}-${form.imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
        const uploaded = await uploadBytes(ref(storage, path), form.imageFile, { contentType: form.imageFile.type });
        imageUrl = await getDownloadURL(uploaded.ref);
      }
      if (!imageUrl) {
        toast.error('Dodajte fotografiju ili URL fotografije.');
        return;
      }
      const payload = {
        title: form.title.trim(), description: form.description.trim(), imageUrl,
        published: form.published, author: form.author?.trim() || '', externalUrl: form.externalUrl?.trim() || '',
        updatedAt: serverTimestamp(),
      };
      if (editingId) await updateDoc(doc(db, 'news', editingId), payload);
      else await addDoc(collection(db, 'news'), { ...payload, publishedAt: serverTimestamp(), createdAt: serverTimestamp() });
      toast.success(editingId ? 'Vest je izmenjena.' : 'Vest je dodata.');
      setEditorOpen(false);
      await fetchNews();
    } catch (error) {
      console.error('Error saving news:', error);
      toast.error('Vest nije sačuvana. Proverite Firebase pravila.');
    } finally { setSaving(false); }
  };

  const togglePublished = async (item: NewsItem) => {
    if (previewMode) return;
    try {
      await updateDoc(doc(db, 'news', item.newsId), { published: !item.published, updatedAt: serverTimestamp(), ...(!item.published ? { publishedAt: serverTimestamp() } : {}) });
      setNews((current) => current.map((entry) => entry.newsId === item.newsId ? { ...entry, published: !entry.published } : entry));
    } catch (error) { console.error('Error updating news:', error); toast.error('Status vesti nije promenjen.'); }
  };

  const removeNews = async (item: NewsItem) => {
    if (previewMode || !window.confirm(`Obriši vest „${item.title}“?`)) return;
    try { await deleteDoc(doc(db, 'news', item.newsId)); setNews((current) => current.filter((entry) => entry.newsId !== item.newsId)); toast.success('Vest je obrisana.'); }
    catch (error) { console.error('Error deleting news:', error); toast.error('Vest nije obrisana.'); }
  };

  return <section className="admin-news">
    <div className="admin-news-toolbar"><div><strong>{news.filter((item) => item.published).length} objavljenih</strong><span>{news.length} ukupno</span></div><button type="button" onClick={openCreate} disabled={previewMode}><AddCircleOutlineIcon />Nova vest</button></div>
    {loading ? <div className="admin-news-empty">Učitavanje vesti...</div> : !sortedNews.length ? <div className="admin-news-empty"><h2>Još nema vesti</h2><p>Dodajte prvu vest koja će se prikazati u sekciji Aktuelnosti na Plant Centar sajtu.</p></div> : <div className="admin-news-list">
      {sortedNews.map((item) => <article key={item.newsId} className="admin-news-card">
        <img src={item.imageUrl || productPlaceholder} alt="" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = productPlaceholder; }} />
        <div className="admin-news-copy"><div className="admin-news-status">{item.published ? <><PublicOutlinedIcon />Objavljeno</> : <><UnpublishedOutlinedIcon />Nacrt</>}</div><h2>{item.title}</h2><p>{item.description}</p><time>{getDate(item.publishedAt).toLocaleDateString('sr-RS')}</time></div>
        <div className="admin-news-actions"><button type="button" onClick={() => openEdit(item)} disabled={previewMode} title="Izmeni vest"><EditOutlinedIcon /></button><button type="button" onClick={() => togglePublished(item)} disabled={previewMode} title={item.published ? 'Povuci vest' : 'Objavi vest'}>{item.published ? <UnpublishedOutlinedIcon /> : <PublicOutlinedIcon />}</button><button type="button" onClick={() => removeNews(item)} disabled={previewMode} title="Obriši vest"><DeleteOutlineIcon /></button></div>
      </article>)}
    </div>}

    {editorOpen && <div className="admin-news-modal" onClick={() => !saving && setEditorOpen(false)}><form onSubmit={handleSave} onClick={(event) => event.stopPropagation()}>
      <div className="admin-news-modal-heading"><div><span>Aktuelnosti</span><h2>{editingId ? 'Izmena vesti' : 'Nova vest'}</h2></div><button type="button" onClick={() => setEditorOpen(false)} aria-label="Zatvori"><CloseOutlinedIcon /></button></div>
      <label>Naslov<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
      <label>Tekst vesti<textarea required rows={8} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
      <div className="admin-news-form-grid"><label>Autor<input value={form.author} onChange={(event) => setForm({ ...form, author: event.target.value })} /></label><label>Spoljni link<input type="url" value={form.externalUrl} onChange={(event) => setForm({ ...form, externalUrl: event.target.value })} placeholder="https://..." /></label></div>
      <label>URL fotografije<input type="url" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} placeholder="https://..." /></label>
      <label className="admin-news-file">ili otpremite fotografiju<input type="file" accept="image/*" onChange={(event) => setForm({ ...form, imageFile: event.target.files?.[0] || null })} /></label>
      <label className="admin-news-checkbox"><input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} />Objavi odmah</label>
      <div className="admin-news-modal-actions"><button type="button" onClick={() => setEditorOpen(false)}>Odustani</button><button type="submit" disabled={saving}>{saving ? 'Čuvanje...' : 'Sačuvaj vest'}</button></div>
    </form></div>}
  </section>;
}
