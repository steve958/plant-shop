import { SubmitHandler, useForm } from "react-hook-form";
import { auth, db } from "../firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./Register.css";

interface FormData {
  name: string;
  surname: string;
  email: string;
  password: string;
  place: string;
  postalCode: string;
  street: string;
  number: string;
  phoneNumber: string;
}

const RegisterForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();
  const navigate = useNavigate();

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const user = userCredential.user;

      await sendEmailVerification(user);

      await setDoc(doc(collection(db, "users"), user.uid), {
        name: data.name,
        surname: data.surname,
        email: data.email,
        place: data.place,
        postalCode: data.postalCode,
        street: data.street,
        number: data.number,
        phoneNumber: data.phoneNumber,
        isAdmin: false,
      });

      toast.success("Registracija uspešna! Na Vaš email smo poslali link za verifikaciju.");
      navigate("/prijava");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Registracija neuspešna: ${error.message}`);
      } else {
        toast.error("Desila se greška. Molimo vas pokušajte ponovo!");
      }
    }
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit(onSubmit)}>
        <h2 className="register-title">Registracija</h2>

        <div className="inputs-wrapper">
          {/* Row 1: Ime, Prezime */}
          <div className="register-row">
            <div className="register-input-wrapper">
              <label htmlFor="name">Ime</label>
              <input
                id="name"
                className="register-input"
                {...register("name", { required: true })}
                placeholder="Unesite ime"
              />
              {errors.name && (
                <span className="error">Ovo polje je obavezno</span>
              )}
            </div>
            <div className="register-input-wrapper">
              <label htmlFor="surname">Prezime</label>
              <input
                id="surname"
                className="register-input"
                {...register("surname", { required: true })}
                placeholder="Unesite prezime"
              />
              {errors.surname && (
                <span className="error">Ovo polje je obavezno</span>
              )}
            </div>
          </div>

          {/* Row 2: E-mail, Password */}
          <div className="register-row">
            <div className="register-input-wrapper">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                className="register-input"
                {...register("email", { required: true })}
                placeholder="example@domain.com"
              />
              {errors.email && (
                <span className="error">Ovo polje je obavezno</span>
              )}
            </div>
            <div className="register-input-wrapper">
              <label htmlFor="password">Šifra</label>
              <input
                id="password"
                type="password"
                className="register-input"
                {...register("password", { required: true })}
                placeholder="Unesite lozinku"
              />
              {errors.password && (
                <span className="error">Ovo polje je obavezno</span>
              )}
            </div>
          </div>

          {/* Row 3: Mesto, Poštanski broj */}
          <div className="register-row">
            <div className="register-input-wrapper">
              <label htmlFor="place">Mesto stanovanja</label>
              <input
                id="place"
                className="register-input"
                {...register("place", { required: true })}
                placeholder="Vaše mesto stanovanja"
              />
              {errors.place && (
                <span className="error">Ovo polje je obavezno</span>
              )}
            </div>
            <div className="register-input-wrapper">
              <label htmlFor="postalCode">Poštanski broj</label>
              <input
                id="postalCode"
                className="register-input"
                {...register("postalCode", { required: true })}
                placeholder="11000"
              />
              {errors.postalCode && (
                <span className="error">Ovo polje je obavezno</span>
              )}
            </div>
          </div>

          {/* Row 4: Ulica, Broj */}
          <div className="register-row">
            <div className="register-input-wrapper">
              <label htmlFor="street">Ulica</label>
              <input
                id="street"
                className="register-input"
                {...register("street", { required: true })}
                placeholder="Ulica"
              />
              {errors.street && (
                <span className="error">Ovo polje je obavezno</span>
              )}
            </div>
            <div className="register-input-wrapper">
              <label htmlFor="number">Broj kuće/zgrade</label>
              <input
                id="number"
                className="register-input"
                {...register("number", { required: true })}
                placeholder="123"
              />
              {errors.number && (
                <span className="error">Ovo polje je obavezno</span>
              )}
            </div>
          </div>

          {/* Row 5: Broj telefona */}
          <div className="register-row">
            <div className="register-input-wrapper">
              <label htmlFor="phoneNumber">Broj telefona</label>
              <input
                id="phoneNumber"
                className="register-input"
                {...register("phoneNumber", { required: true })}
                placeholder="06x/xxxx-xxx"
              />
              {errors.phoneNumber && (
                <span className="error">Ovo polje je obavezno</span>
              )}
            </div>
          </div>
        </div>

        <button className="register-page-button" type="submit">
          Registruj se
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;
