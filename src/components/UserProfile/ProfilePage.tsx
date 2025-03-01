import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useDispatch } from "react-redux";
import { logout } from "../Redux/authSlice";
import { useNavigate } from "react-router-dom";
import "./ProfilePage.css";
import { ScaleLoader } from "react-spinners";

interface UserProfile {
  email: string;
  isAdmin: boolean;
  name: string;
  number: string;
  phoneNumber: string;
  place: string;
  postalCode: string;
  street: string;
  surname: string;
}

const ProfilePage = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (auth.currentUser) {
        const uid = auth.currentUser.uid;
        setLoading(true);

        try {
          const docRef = doc(db, "users", uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserProfile({
              email: data.email,
              isAdmin: data.isAdmin,
              name: data.name,
              number: data.number,
              phoneNumber: data.phoneNumber,
              place: data.place,
              postalCode: data.postalCode,
              street: data.street,
              surname: data.surname,
            });
            setFormData({
              email: data.email,
              isAdmin: data.isAdmin,
              name: data.name,
              number: data.number,
              phoneNumber: data.phoneNumber,
              place: data.place,
              postalCode: data.postalCode,
              street: data.street,
              surname: data.surname,
            });
            setUserId(uid);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch(logout());
      navigate("/prijava");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleUpdateProfile = async () => {
    if (userId && formData) {
      try {
        const docRef = doc(db, "users", userId);
        const { email, ...updateData } = formData; // Exclude email from updating
        await updateDoc(docRef, updateData);
        setUserProfile({ ...formData, email }); // Update local state
        setEditing(false);
      } catch (error) {
        console.error("Profile update failed", error);
      }
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-content">
        <h1 className="profile-title">Vaše informacije</h1>
        {loading ? (
          <div className="loader-wrapper">
            <ScaleLoader color="#54C143" />
          </div>
        ) : (
          <>
            {userProfile && (
              <div className="edit-profile-container">
                <p className="profile-email">Email: {userProfile.email}</p>
                {editing ? (
                  <div className="edit-profile-content">
                    <div className="edit-profile-input-wrapper">
                      <label>Ime:</label>
                      <input
                        type="text"
                        title="Ime"
                        placeholder="Unesite vaše ime"
                        value={formData?.name || ""}
                        onChange={(e) =>
                          setFormData((prev) =>
                            prev ? { ...prev, name: e.target.value } : null
                          )
                        }
                      />
                    </div>
                    <div className="edit-profile-input-wrapper">
                      <label>Prezime:</label>
                      <input
                        type="text"
                        title="Prezime"
                        placeholder="Unesite vaše prezime"
                        value={formData?.surname || ""}
                        onChange={(e) =>
                          setFormData((prev) =>
                            prev ? { ...prev, surname: e.target.value } : null
                          )
                        }
                      />
                    </div>
                    <div className="edit-profile-input-wrapper">
                      <label>Broj telefona:</label>
                      <input
                        type="text"
                        title="Broj telefona"
                        placeholder="Unesite broj telefona"
                        value={formData?.phoneNumber || ""}
                        onChange={(e) =>
                          setFormData((prev) =>
                            prev
                              ? { ...prev, phoneNumber: e.target.value }
                              : null
                          )
                        }
                      />
                    </div>
                    <div className="edit-profile-input-wrapper">
                      <label>Mesto stanovanja:</label>
                      <input
                        type="text"
                        title="Mesto stanovanja"
                        placeholder="Unesite mesto stanovanja"
                        value={formData?.place || ""}
                        onChange={(e) =>
                          setFormData((prev) =>
                            prev ? { ...prev, place: e.target.value } : null
                          )
                        }
                      />
                    </div>
                    <div className="edit-profile-input-wrapper">
                      <label>Poštanski broj:</label>
                      <input
                        type="text"
                        title="Poštanski broj"
                        placeholder="Unesite poštanski broj"
                        value={formData?.postalCode || ""}
                        onChange={(e) =>
                          setFormData((prev) =>
                            prev
                              ? { ...prev, postalCode: e.target.value }
                              : null
                          )
                        }
                      />
                    </div>
                    <div className="edit-profile-input-wrapper">
                      <label>Naziv ulice:</label>
                      <input
                        type="text"
                        title="Naziv ulice"
                        placeholder="Unesite naziv ulice"
                        value={formData?.street || ""}
                        onChange={(e) =>
                          setFormData((prev) =>
                            prev ? { ...prev, street: e.target.value } : null
                          )
                        }
                      />
                    </div>
                    <div className="edit-profile-input-wrapper">
                      <label>Broj kuće:</label>
                      <input
                        type="text"
                        title="Broj kuće"
                        placeholder="Unesite broj kuće"
                        value={formData?.number || ""}
                        onChange={(e) =>
                          setFormData((prev) =>
                            prev ? { ...prev, number: e.target.value } : null
                          )
                        }
                      />
                    </div>

                    <div className="edit-button-wrapper">
                      <button className="save-button" onClick={handleUpdateProfile}>
                        Sačuvaj
                      </button>
                      <button className="cancel-button" onClick={() => setEditing(false)}>
                        Otkaži
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="show-profile">
                    <p>Ime: {userProfile.name}</p>
                    <p>Prezime: {userProfile.surname}</p>
                    <p>Broj telefona: {userProfile.phoneNumber}</p>
                    <p>Mesto stanovanja: {userProfile.place}</p>
                    <p>Poštanski broj: {userProfile.postalCode}</p>
                    <p>Naziv ulice: {userProfile.street}</p>
                    <p>Broj kuće/zgrade: {userProfile.number}</p>
                    <div className="show-profile-button-wrapper">
                      <button className="edit-button" onClick={() => setEditing(true)}>
                        Izmeni
                      </button>
                      <button className="logout-button" onClick={handleLogout}>
                        Odjavi se
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
