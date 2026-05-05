import Header from "../componets/Header";
import Formulario from "../componets/Formulario";
import Footer from "../componets/Footer";
import "./login.css";

const Login = () => {
  return (
    <div className="login-container">
      <div className="login-card">
        <Header />
        <Formulario />
        <Footer />
        <div className="decorative-needle">🪡</div>
      </div>
    </div>
  );
};

export default Login;