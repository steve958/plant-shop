import { useForm } from "react-hook-form";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login } from "../Redux/authSlice";
import "./LogIn.css";
import { toast } from "react-toastify";
import { useState } from "react";

interface LoginFormData {
  email: string;
  password: string;
}

const LoginPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [inputEmail, setInputEmail] = useState<string>('')
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onSubmit = async (data: LoginFormData) => {
    setIsButtonDisabled(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();

        // Dispatch the full user object to Redux
        dispatch(
          login({
            email: user.email!,
            isAdmin: userData.isAdmin,
            name: userData.name,
            number: userData.number,
            phoneNumber: userData.phoneNumber,
            place: userData.place,
            postalCode: userData.postalCode,
            street: userData.street,
            surname: userData.surname,
          })
        );

        if (userData.isAdmin) {
          navigate("/admin/panel");
        } else {
          navigate("/početna");
        }
      } else {
        toast.error("Ne postoje informacije o ovom korisniku.");
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error("Prijavljivanje neuspešno");
      } else {
        toast.error("Dogodila se greška prilikom prijave. Molimo vas da pokušate ponovo.");
      }
      setIsButtonDisabled(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!inputEmail) {
      toast.error("Molimo vas da unesete email pre resetovanja lozinke.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, inputEmail);
      toast.success("E-mail za resetovanje lozinke je poslat!");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Greška: ${error.message}`);
      }
    }
  };

  return (
    <div className="login-page-container">
      <form className="login-page-form" onSubmit={handleSubmit(onSubmit)}>
        <h2 className="login-title">Prijava</h2>

        <div className="login-input-wrapper">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="login-input"
            placeholder="Unesite email adresu"
            {...register("email", { required: "Unesite E-mail" })}
            onChange={(e) => setInputEmail(e.target.value)}
          />
          {errors.email && <span className="error">{errors.email.message}</span>}
        </div>

        <div className="login-input-wrapper">
          <label htmlFor="password">Lozinka</label>
          <input
            id="password"
            type="password"
            className="login-input"
            placeholder="Unesite lozinku"
            {...register("password", { required: "Unesite lozinku" })}
          />
          {errors.password && <span className="error">{errors.password.message}</span>}
        </div>

        <span className="forgot-password-link" onClick={handleForgotPassword}>
          Zaboravljena lozinka?
        </span>

        <div className="login-button-wrapper">
          <button className="login-button" type="submit" disabled={isButtonDisabled}>
            Prijavi se
          </button>
          <button className="register-button" type="button" onClick={() => navigate("/registracija")}>
            Registruj se
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
