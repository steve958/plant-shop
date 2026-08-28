import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { getIdTokenResult, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { auth, db } from '../firebase';
import { login } from '../Redux/authSlice';
import logo from '../../assets/plant-centar-logo-horizontalni.svg';
import './AdminLogin.css';

type AdminLoginData = { email: string; password: string };

export default function AdminLogin() {
  const { register, handleSubmit, formState: { errors } } = useForm<AdminLoginData>();
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onSubmit = async (data: AdminLoginData) => {
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const token = await getIdTokenResult(credential.user, true);
      let isAdmin = token.claims.admin === true;

      if (import.meta.env.DEV && !isAdmin) {
        const legacyProfile = await getDoc(doc(db, 'users', credential.user.uid));
        isAdmin = legacyProfile.exists() && legacyProfile.data().isAdmin === true;
      }

      if (!isAdmin) {
        await signOut(auth);
        toast.error('Ovaj nalog nema administratorski pristup.');
        return;
      }

      dispatch(login({ email: credential.user.email || data.email, isAdmin: true }));
      navigate('/admin/panel', { replace: true });
    } catch (error) {
      const code = (error as { code?: string }).code;
      toast.error(code === 'auth/too-many-requests'
        ? 'Previše pokušaja. Sačekajte nekoliko minuta.'
        : 'Administratorski podaci nisu ispravni.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-login-brand"><img src={logo} alt="Plant Centar prodavnica" /><span>Administracija prodavnice</span></div>
        <div className="admin-login-icon"><LockOutlinedIcon /></div>
        <span className="admin-login-eyebrow">Zaštićen pristup</span>
        <h1>Prijava administratora</h1>
        <p>Ova stranica je namenjena isključivo vlasniku i ovlašćenim članovima Plant Centar tima.</p>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <label htmlFor="admin-email">Email</label>
          <input id="admin-email" type="email" autoComplete="username" placeholder="admin@plantcentar.com" disabled={loading} {...register('email', { required: 'Unesite administratorski email' })} />
          {errors.email && <span className="admin-login-error">{errors.email.message}</span>}
          <label htmlFor="admin-password">Lozinka</label>
          <input id="admin-password" type="password" autoComplete="current-password" placeholder="Unesite lozinku" disabled={loading} {...register('password', { required: 'Unesite lozinku' })} />
          {errors.password && <span className="admin-login-error">{errors.password.message}</span>}
          <button type="submit" disabled={loading}>{loading ? 'Proveravamo pristup...' : 'Prijavi se u administraciju'}</button>
        </form>
        <button className="admin-login-back" onClick={() => navigate('/početna')}>← Nazad u prodavnicu</button>
      </section>
    </main>
  );
}
