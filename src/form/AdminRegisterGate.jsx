import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { checkIfAdminExists } from "../firebase/config";

export default function AdminRegisterGate() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const exists = await checkIfAdminExists();

        if (!exists) {
          // Allow FIRST superadmin registration only
          navigate("/admin-register");
        } else {
          toast.error("Super Admin already exists in the system.");
          navigate("/login");
        }
      } catch (error) {
        toast.error("Unable to verify Super Admin status.");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Verifying Super Admin status...
      </div>
    );
  }

  return null;
}